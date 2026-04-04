import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Star, Zap, Clock, MapPin, CheckCircle2, History,
  RefreshCw, Wind, Car, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Activity,
  CloudRain, Flame, BarChart2, Navigation
} from 'lucide-react'
import InsuranceCard from '../components/ui/InsuranceCard'
import { getPolicy, buyPolicy, getRiskSnapshot, getClaims } from '../services/api'
import { authService } from '../services/auth'
import { SkeletonCard } from '../components/ui/SkeletonLoader'
import { locationService, DEFAULT_LOCATION } from '../services/location'
import type { UserLocation } from '../services/location'

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface PlanInfo {
  name: string
  adjusted_premium: number
  base_premium: number | string
  coverage_per_day: number
  max_days: number
  coverage_total: number
  color: string
  features: string[]
}

interface Trigger {
  active: boolean
  value: number
  threshold: number
  unit: string
}

interface RiskSnapshot {
  safety_score: number
  risk_level: string
  adjustment_label: string
  adjustment_color: string
  recommended_plan: string
  active_plan_premium: number | null
  plans: PlanInfo[]
  triggers: Record<string, Trigger>
  any_triggered: boolean
  live_conditions: { rain_mm: number; temp_c: number; aqi: number; traffic_pct: number }
  risk_factors: { zone_risk: number; claim_frequency: number; work_consistency: number; claim_count_30d: number }
  location: { city: string; lat: number; lon: number }
  timestamp: string
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const safetyColor = (score: number) =>
  score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171'

/* ── Circular gauge ─────────────────────────────────────────────────────────── */
function SafetyGauge({ score }: { score: number }) {
  const color = safetyColor(score)
  const r = 44
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  return (
    <div className="relative w-28 h-28 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-[10px] font-semibold opacity-70" style={{ color }}>/ 100</span>
      </div>
    </div>
  )
}

/* ── Condition Pill ──────────────────────────────────────────────────────────── */
function ConditionPill({
  icon: Icon, label, value, unit, active, threshold
}: { icon: React.ElementType; label: string; value: number; unit: string; active: boolean; threshold: number }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-xl"
      style={{
        background: active ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.07)'}`,
      }}>
      <Icon size={16} style={{ color: active ? '#f87171' : '#94a3b8' }} />
      <span className="text-[10px] font-semibold" style={{ color: active ? '#f87171' : '#94a3b8' }}>{label}</span>
      <span className="text-sm font-black" style={{ color: active ? '#f87171' : 'var(--text-primary)' }}>
        {value.toFixed(value < 10 ? 1 : 0)}{unit}
      </span>
      <span className="text-[9px] opacity-50">{active ? '🚨 Triggered' : `Limit: ${threshold}${unit}`}</span>
    </div>
  )
}

/* ── Location Permission Modal ───────────────────────────────────────────── */
function LocationModal({
  onGPS, onSkip, error
}: { onGPS: () => void; onSkip: () => void; error: string | null }) {
  const [requesting, setRequesting] = React.useState(false)

  const handleGPS = async () => {
    setRequesting(true)
    await onGPS()
    setRequesting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative max-w-sm w-full rounded-2xl p-6 space-y-5"
        style={{ background: 'var(--card-bg, #1a1a2e)', border: '1px solid rgba(99,102,241,0.3)' }}
      >
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center relative">
            <Navigation size={28} className="text-indigo-400" />
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-2xl animate-ping bg-indigo-500/20" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
            Real-time Location
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            SmartShield AI continuously tracks your <strong>live GPS</strong> to fetch
            accurate <strong>weather, AQI</strong> and <strong>risk conditions</strong>
            from your current location — updating as you move.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
            <AlertTriangle size={12} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2.5">
          <button
            id="allow-gps-btn"
            onClick={handleGPS}
            disabled={requesting}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
          >
            {requesting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Getting location...</>
            ) : (
              <>📍 Enable Live Location</>
            )}
          </button>
          <button
            id="skip-location-btn"
            onClick={onSkip}
            className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Skip — use Mumbai (default)
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Location Banner ─────────────────────────────────────────────────────── */
function LocationBanner({
  location, onChange, isLive
}: { location: UserLocation; onChange: () => void; isLive: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
      style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)' }}>

      {/* Live dot */}
      {isLive ? (
        <span className="relative flex-shrink-0">
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
      ) : (
        <MapPin size={12} className="text-indigo-400 flex-shrink-0" />
      )}

      <span style={{ color: 'var(--text-secondary)' }}>
        {isLive ? (
          <><strong className="text-emerald-300">LIVE</strong> · {location.city}
            {location.accuracy != null && (
              <span className="ml-1 opacity-50">(±{location.accuracy}m)</span>
            )}
          </>
        ) : (
          <>Data for <strong className="text-indigo-300">{location.city}</strong> (default)</>
        )}
      </span>

      <button
        onClick={onChange}
        className="ml-auto text-[10px] px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all"
      >
        {isLive ? 'Stop' : 'Enable GPS'}
      </button>
    </div>
  )
}

/* ── Plan Card ──────────────────────────────────────────────────────────────── */
function PlanCard({
  plan, isActive, isRecommended, isActivating, onActivate, policy, activePremium
}: {
  plan: PlanInfo; isActive: boolean; isRecommended: boolean; isActivating: boolean
  onActivate: (p: PlanInfo) => void; policy: any; activePremium?: number | null
}) {
  // If this is the active plan, show the live-calculated premium (not stored DB value)
  const displayPremium = isActive && activePremium != null ? activePremium : plan.adjusted_premium

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-5 flex flex-col"
      style={{
        background: isActive
          ? `linear-gradient(135deg, ${plan.color}22, ${plan.color}08)`
          : isRecommended
          ? `linear-gradient(135deg, ${plan.color}18, rgba(255,255,255,0.02))`
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isActive ? plan.color + '70' : isRecommended ? plan.color + '40' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Badges */}
      <div className="absolute -top-3 left-0 right-0 flex justify-center gap-1.5">
        {isActive && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: plan.color, color: '#000' }}>✓ Active</span>
        )}
        {isRecommended && !isActive && (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
            style={{ background: plan.color, color: '#000' }}>
            <Star size={8} fill="currentColor" /> Recommended
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3 mt-1">
        <Shield size={16} style={{ color: plan.color }} />
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{plan.name}</span>
      </div>

      {/* Live premium — key insight */}
      <div className="mb-1">
        <span className="text-2xl font-black" style={{ color: plan.color }}>
          ₹{displayPremium}
          <span className="text-xs font-medium opacity-60">/wk</span>
        </span>
      </div>
      {plan.name === 'Micro AI' && (
        <p className="text-[10px] mb-1" style={{ color: 'var(--text-secondary)' }}>
          Base: ₹50–₹80 · Risk-adjusted
        </p>
      )}

      <div className="mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
        ₹{plan.coverage_per_day}/day · Max {plan.max_days} day{plan.max_days > 1 ? 's' : ''}
        <span className="ml-1 font-semibold" style={{ color: plan.color }}>
          (₹{plan.coverage_total} total)
        </span>
      </div>

      <ul className="space-y-1.5 mb-4 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <Zap size={9} style={{ color: plan.color, flexShrink: 0 }} />{f}
          </li>
        ))}
      </ul>

      <button
        id={`select-plan-${plan.name.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={() => onActivate(plan)}
        disabled={isActive || isActivating}
        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
        style={isActive
          ? { background: `${plan.color}20`, color: plan.color, border: `1px solid ${plan.color}40`, cursor: 'default' }
          : { background: `${plan.color}25`, color: plan.color, border: `1px solid ${plan.color}50` }}
      >
        {isActivating ? 'Activating…' : isActive ? 'Current Plan' : policy ? 'Switch Plan' : 'Activate Plan'}
      </button>
    </motion.div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────────────── */
const MyInsurance: React.FC = () => {
  const [policy, setPolicy]             = useState<any>(null)
  const [snapshot, setSnapshot]         = useState<RiskSnapshot | null>(null)
  const [claims, setClaims]             = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [activating, setActivating]     = useState<string | null>(null)
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null)
  const [location, setLocation]         = useState<UserLocation | null>(null)
  const [showLocModal, setShowLocModal] = useState(false)
  const [locError, setLocError]         = useState<string | null>(null)
  const [isLive, setIsLive]             = useState(false)   // true = watchPosition active
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const watchCleanup  = useRef<(() => void) | null>(null)   // GPS watchPosition cleanup
  const locationRef   = useRef<UserLocation | null>(null)   // always up-to-date for callbacks
  const user = authService.getCurrentUser()

  /* Fetch everything */
  const fetchAll = useCallback(async (silent = false, loc?: UserLocation) => {
    if (!user) return
    const useLoc = loc ?? locationRef.current ?? DEFAULT_LOCATION
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const activePlanName = policy?.plan_name as string | undefined
      const [policyRes, snapshotRes, claimsRes] = await Promise.allSettled([
        getPolicy(user.id),
        getRiskSnapshot(user.id, {
          lat: useLoc.lat,
          lon: useLoc.lon,
          city: useLoc.city,
          active_plan: activePlanName,
        }),
        getClaims(user.id),
      ])

      if (policyRes.status === 'fulfilled') setPolicy(policyRes.value.data.policy)
      if (snapshotRes.status === 'fulfilled') {
        setSnapshot(snapshotRes.value.data)
        setLastUpdated(new Date())
      }
      if (claimsRes.status === 'fulfilled') setClaims(claimsRes.value.data.claims || [])
    } catch (e) {
      console.error('Fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id, policy?.plan_name])

  /* Start real-time GPS watch */
  const startWatch = useCallback(() => {
    if (watchCleanup.current) watchCleanup.current()  // stop any existing watch

    const stop = locationService.watchLocation((loc) => {
      locationRef.current = loc
      setLocation(loc)
      setIsLive(true)
      // Re-fetch weather/risk whenever location changes
      fetchAll(true, loc)
    }, 50)

    watchCleanup.current = stop
    setIsLive(true)
    locationService.markGPSAllowed()
  }, [fetchAll])

  /* Stop GPS watch */
  const stopWatch = useCallback(() => {
    if (watchCleanup.current) {
      watchCleanup.current()
      watchCleanup.current = null
    }
    setIsLive(false)
  }, [])

  /* Init on mount */
  useEffect(() => {
    const saved = locationService.getSaved()
    const gpsAllowed = locationService.isGPSAllowed()

    if (gpsAllowed) {
      // User previously allowed GPS — start watching immediately (no modal)
      const initLoc = saved ?? DEFAULT_LOCATION
      locationRef.current = initLoc
      setLocation(initLoc)
      fetchAll(false, initLoc)
      startWatch()  // will override with live GPS as soon as first fix arrives
    } else if (saved && saved.source === 'default') {
      // Previously skipped — use default, show no modal
      locationRef.current = saved
      setLocation(saved)
      fetchAll(false, saved)
    } else {
      // First visit — show modal
      setShowLocModal(true)
      fetchAll(false, DEFAULT_LOCATION)
    }

    // Cleanup GPS watch on unmount
    return () => {
      if (watchCleanup.current) watchCleanup.current()
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  /* 30-second polling (catches non-location changes like claim counts) */
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchAll(true), 30_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchAll])

  /* Handle GPS allow from modal */
  const handleAllowGPS = async () => {
    setLocError(null)
    try {
      // Get one-shot fix first so modal closes quickly
      const loc = await locationService.requestGPS()
      locationService.save(loc)
      locationRef.current = loc
      setLocation(loc)
      setShowLocModal(false)
      fetchAll(true, loc)
      // Then start continuous watch
      startWatch()
    } catch (e: any) {
      setLocError(e.message || 'Could not get GPS location')
    }
  }

  /* Handle skip → use default Mumbai, no modal */
  const handleSkip = () => {
    locationService.save(DEFAULT_LOCATION)
    locationRef.current = DEFAULT_LOCATION
    setLocation(DEFAULT_LOCATION)
    setIsLive(false)
    setShowLocModal(false)
  }

  /* Toggle GPS from banner */
  const handleToggleGPS = () => {
    if (isLive) {
      stopWatch()
      locationService.clear()
      setLocation(DEFAULT_LOCATION)
      locationRef.current = DEFAULT_LOCATION
      fetchAll(true, DEFAULT_LOCATION)
    } else {
      setLocError(null)
      setShowLocModal(true)
    }
  }

  /* Activate a plan */
  const handleActivate = async (plan: PlanInfo) => {
    if (!user) return
    setActivating(plan.name)
    try {
      await buyPolicy({
        worker_id: user.id,
        plan_name: plan.name,
        premium_amount: plan.adjusted_premium,
        coverage_per_day: plan.coverage_per_day,
        max_days: plan.max_days,
        coverage_amount: plan.coverage_total,
      })
      await fetchAll(true)
    } catch (e) {
      console.error('Activation failed', e)
    } finally {
      setActivating(null)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {showLocModal && <LocationModal onGPS={handleAllowGPS} onSkip={handleSkip} error={locError} />}
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    )
  }

  const scoreColor = snapshot ? safetyColor(snapshot.safety_score) : '#fbbf24'
  const adjColor   = snapshot?.adjustment_color || '#fbbf24'
  const displayCity = location?.city ?? snapshot?.location?.city ?? 'Your Location'

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">

      {/* Location modal */}
      <AnimatePresence>
        {showLocModal && (
          <LocationModal onGPS={handleAllowGPS} onSkip={handleSkip} error={locError} />
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>My Insurance</h2>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Live premiums · auto-refresh every 30s</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            id="refresh-insurance-btn"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20 transition-all"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Location banner */}
      {location && (
        <LocationBanner location={location} onChange={handleToggleGPS} isLive={isLive} />
      )}

      {/* ── Active Policy Card ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-primary)' }}>
          Active Policy
        </p>

        {/* If user has Micro AI plan, show their live-adjusted premium */}
        {policy && snapshot?.active_plan_premium != null ? (
          <div className="space-y-2">
            <InsuranceCard
              planName={policy.plan_name}
              coverageAmount={`₹${policy.coverage_amount?.toLocaleString() ?? 0}`}
              premium={`₹${snapshot.active_plan_premium}/wk`}
              validUntil={policy.end_date ? new Date(policy.end_date).toLocaleDateString() : 'Ongoing'}
              workerId={user?.id || 'WRK-XXXX'}
              status={policy.status || 'inactive'}
            />
            {/* Live premium explanation */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <Activity size={11} className="text-emerald-400 flex-shrink-0" />
              <span style={{ color: 'var(--text-secondary)' }}>
                Live-calculated premium for your{' '}
                <strong className="text-emerald-300">{policy.plan_name}</strong> plan based on current risk score{' '}
                <strong className="text-emerald-300">{snapshot.safety_score}/100</strong>
                {snapshot.adjustment_label !== 'No change'
                  ? ` (${snapshot.adjustment_label})`
                  : ' (No adjustment — Normal Worker)'}
              </span>
            </div>
          </div>
        ) : (
          <InsuranceCard
            planName={policy?.plan_name || 'No Active Plan'}
            coverageAmount={policy ? `₹${policy.coverage_amount?.toLocaleString()}` : '₹0'}
            premium={policy ? `₹${policy.premium_amount}/wk` : '—'}
            validUntil={policy?.end_date ? new Date(policy.end_date).toLocaleDateString() : 'N/A'}
            workerId={user?.id || 'WRK-XXXX'}
            status={policy?.status || 'inactive'}
          />
        )}
      </motion.div>

      {/* ── Risk Score + Live Conditions ─────────────────────────────────────── */}
      {snapshot && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex flex-col md:flex-row gap-5">

            {/* Safety gauge */}
            <div className="flex items-center gap-4">
              <SafetyGauge score={snapshot.safety_score} />
              <div>
                <p className="text-xs opacity-50 mb-0.5" style={{ color: 'var(--text-primary)' }}>Safety Score</p>
                <p className="text-lg font-black" style={{ color: scoreColor }}>{snapshot.risk_level}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {snapshot.adjustment_label.startsWith('-')
                    ? <TrendingDown size={14} className="text-emerald-400" />
                    : snapshot.adjustment_label.startsWith('+')
                    ? <TrendingUp size={14} className="text-rose-400" />
                    : <Minus size={14} className="text-yellow-400" />}
                  <span className="text-xs font-semibold" style={{ color: adjColor }}>
                    Premium {snapshot.adjustment_label}
                  </span>
                </div>
                <p className="text-[10px] mt-2 opacity-50" style={{ color: 'var(--text-secondary)' }}>
                  Zone: {Math.round(snapshot.risk_factors.zone_risk * 100)}% ·
                  Claims: {snapshot.risk_factors.claim_count_30d} ·
                  Freq: {Math.round(snapshot.risk_factors.claim_frequency * 100)}%
                </p>
              </div>
            </div>

            <div className="flex-1 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-5"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold mb-3 opacity-60 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Live Conditions — {displayCity}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ConditionPill icon={CloudRain} label="Rain"    value={snapshot.live_conditions.rain_mm}    unit="mm" active={snapshot.triggers.rain.active}     threshold={40} />
                <ConditionPill icon={Flame}     label="Heat"    value={snapshot.live_conditions.temp_c}     unit="°C" active={snapshot.triggers.heatwave.active} threshold={42} />
                <ConditionPill icon={Wind}      label="AQI"     value={snapshot.live_conditions.aqi}        unit=""   active={snapshot.triggers.aqi.active}      threshold={300} />
                <ConditionPill icon={Car}       label="Traffic" value={snapshot.live_conditions.traffic_pct} unit="%" active={snapshot.triggers.traffic.active}  threshold={80} />
              </div>

              <AnimatePresence>
                {snapshot.any_triggered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-center gap-2 p-3 rounded-xl"
                    style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}
                  >
                    <AlertTriangle size={14} className="text-rose-400 flex-shrink-0" />
                    <span className="text-xs text-rose-400 font-semibold">
                      Parametric conditions breached — You may be eligible for a claim payout!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl flex items-center gap-2"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <BarChart2 size={14} className="text-indigo-400 flex-shrink-0" />
            <span className="text-xs text-indigo-300 font-semibold">
              Based on your risk score of {snapshot.safety_score}/100, we recommend the{' '}
              <strong className="text-white">{snapshot.recommended_plan}</strong> plan.
              {policy?.plan_name && policy.plan_name !== snapshot.recommended_plan && (
                <span className="ml-1 opacity-70">
                  (Your current plan: <strong>{policy.plan_name}</strong>)
                </span>
              )}
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Policy Details ────────────────────────────────────────────────────── */}
      {policy && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-4 opacity-50" style={{ color: 'var(--text-primary)' }}>Policy Details</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Plan Type',   value: policy.plan_name,                                                  icon: Shield },
              { label: 'Coverage',    value: `₹${policy.coverage_amount?.toLocaleString() ?? 0}`,             icon: Zap },
              { label: 'Live Premium', value: snapshot?.active_plan_premium != null ? `₹${snapshot.active_plan_premium}/wk` : `₹${policy.premium_amount}/wk`, icon: Star },
              { label: 'Status',      value: policy.status === 'active' ? 'Active ✓' : 'Inactive',            icon: CheckCircle2 },
              { label: 'Valid From',  value: new Date(policy.created_at).toLocaleDateString(),                 icon: Clock },
              { label: 'Valid Until', value: policy.end_date ? new Date(policy.end_date).toLocaleDateString() : 'Ongoing', icon: History },
              { label: 'Zone',        value: displayCity,                                                       icon: MapPin },
              { label: 'Worker ID',   value: user?.id?.slice(0, 12) + '…' || '—',                            icon: Activity },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon size={14} className="text-indigo-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Available Plans ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-primary)' }}>
            Available Plans
          </p>
          {snapshot && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              Premiums adjusted to your risk score
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(snapshot?.plans ?? []).map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <PlanCard
                plan={plan}
                isActive={policy?.plan_name === plan.name}
                isRecommended={snapshot?.recommended_plan === plan.name}
                isActivating={activating === plan.name}
                onActivate={handleActivate}
                policy={policy}
                activePremium={policy?.plan_name === plan.name ? snapshot?.active_plan_premium : null}
              />
            </motion.div>
          ))}
        </div>

        {!snapshot && (
          <p className="text-center text-sm py-4" style={{ color: 'var(--text-secondary)' }}>
            Live plan data unavailable — check backend connection.
          </p>
        )}
      </div>

      {/* ── How Premiums Work ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-primary)' }}>How Premiums Are Calculated</p>

        <div className="p-3 rounded-xl text-xs font-mono"
          style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
          Risk Score = (Zone Risk × 0.4) + (Claim Frequency × 0.4) + (Work Consistency × 0.2)
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-center">
          {[
            { range: '80–100', label: 'Safe Worker',   adj: '-5% to -10%', color: '#34d399' },
            { range: '50–79',  label: 'Normal Worker', adj: 'No change',   color: '#fbbf24' },
            { range: '0–49',   label: 'High Risk',     adj: '+5% to +10%', color: '#f87171' },
          ].map((row) => (
            <div key={row.range} className="rounded-xl p-3"
              style={{ background: `${row.color}10`, border: `1px solid ${row.color}25` }}>
              <p className="font-black text-sm" style={{ color: row.color }}>{row.range}</p>
              <p className="font-semibold mt-0.5" style={{ color: row.color }}>{row.label}</p>
              <p className="mt-1 opacity-70 font-mono" style={{ color: row.color }}>{row.adj}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[11px] font-bold opacity-50 mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>Parametric Triggers</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { label: 'Rain',     cond: '> 40mm', icon: CloudRain },
              { label: 'Heatwave', cond: '> 42°C', icon: Flame },
              { label: 'AQI',      cond: '> 300',  icon: Wind },
              { label: 'Traffic',  cond: '> 80%',  icon: Car },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2 p-2.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <t.icon size={12} className="text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t.label}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>{t.cond}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Recent Claims ─────────────────────────────────────────────────────── */}
      {claims.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs font-bold uppercase tracking-wider opacity-50 mb-4" style={{ color: 'var(--text-primary)' }}>Recent Claims</p>
          <div className="space-y-2">
            {claims.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: 'rgba(99,102,241,0.1)' }}>
                    {c.event_type === 'rain' ? '🌧' : c.event_type === 'heat' ? '🌡' : c.event_type === 'aqi' ? '💨' : '🚗'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{c.event_type} event</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(c.triggered_at ?? c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-emerald-400">+₹{c.payout_amount}</p>
                  <p className="text-[10px] capitalize" style={{ color: 'var(--text-secondary)' }}>{c.status}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  )
}

export default MyInsurance
