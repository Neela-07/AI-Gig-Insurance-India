import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, CheckCircle2, Shield, ArrowRight, MapPin } from 'lucide-react'
import { getRiskSnapshot, buyPolicy, getPolicy } from '../services/api'
import { authService } from '../services/auth'
import { locationService } from '../services/location'
import type { UserLocation } from '../services/location'

const PLAN_COLORS: Record<string, string> = {
  'Micro AI': '#94a3b8',
  'Basic':    '#34d399',
  'Standard': '#fbbf24',
  'Premium':  '#a78bfa',
}

const PLAN_BASE: Record<string, number> = {
  'Basic': 120, 'Standard': 249, 'Premium': 399,
}

const PLAN_COVERAGE: Record<string, { perDay: number; maxDays: number; features: string[] }> = {
  'Micro AI': {
    perDay: 400, maxDays: 1,
    features: ['1-day instant coverage', 'Rain & Heat triggers', 'Basic claim support'],
  },
  'Basic': {
    perDay: 500, maxDays: 1,
    features: ['1-day standard coverage', 'All weather triggers', 'AI claim verification'],
  },
  'Standard': {
    perDay: 700, maxDays: 2,
    features: ['2-day extended coverage', 'Full environmental triggers', 'Priority support', 'AQI protection'],
  },
  'Premium': {
    perDay: 900, maxDays: 3,
    features: ['3-day max coverage', 'All triggers + Traffic', 'Dedicated human agent', 'Zero deductible'],
  },
}

function computePlanPremium(planName: string, safetyScore: number): number {
  if (planName === 'Micro AI') {
    if (safetyScore >= 100) return 50
    if (safetyScore >= 90) return 80 - Math.round((safetyScore - 90) * 3)
    return 80
  }
  const base = PLAN_BASE[planName] ?? 249
  if (safetyScore >= 80) {
    const pct = 5 + Math.round(((safetyScore - 80) / 20) * 5)
    return Math.max(1, Math.round(base * (1 - pct / 100)))
  }
  if (safetyScore >= 50) return base
  const pct = 5 + Math.round(((49 - safetyScore) / 49) * 5)
  return Math.round(base * (1 + pct / 100))
}

export default function InsuranceRecommendation() {
  const [loading, setLoading] = useState(true)
  const [safetyScore, setSafetyScore] = useState<number | null>(null)
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [activePlan, setActivePlan] = useState<string | null>(null)
  const [buying, setBuying] = useState<string | null>(null)

  const user = authService.getCurrentUser()
  const watchCleanup = useRef<(() => void) | null>(null)
  const locationRef = useRef<UserLocation | null>(null)

  const fetchScore = useCallback(async (loc: UserLocation) => {
    if (!user) return
    try {
      const [{ data: policyData }, { data: snapData }] = await Promise.all([
        getPolicy(user.id).catch(() => ({ data: { policy: null } })),
        getRiskSnapshot(user.id, { lat: loc.lat, lon: loc.lon, city: loc.city })
      ])
      
      if (policyData.policy?.plan_name) setActivePlan(policyData.policy.plan_name)
      if (snapData) setSafetyScore(snapData.safety_score)
    } catch (e) {
      console.error('Fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    const init = async () => {
      let loc = locationService.getSaved()
      if (!loc) {
        try {
          loc = await locationService.requestGPS()
          locationService.save(loc)
        } catch {
          loc = { lat: 19.076, lon: 72.8777, city: 'Mumbai', source: 'default' }
        }
      }
      locationRef.current = loc
      setLocation(loc)
      await fetchScore(loc)

      if (locationService.isGPSAllowed() || loc.source === 'gps') {
        watchCleanup.current = locationService.watchLocation((newLoc) => {
          locationRef.current = newLoc
          setLocation(newLoc)
          fetchScore(newLoc)
        }, 100)
      }
    }
    init()

    return () => {
      if (watchCleanup.current) watchCleanup.current()
    }
  }, [fetchScore])

  const handleBuy = async (planName: string, premium: number) => {
    if (!user) return
    setBuying(planName)
    try {
      const cov = PLAN_COVERAGE[planName]
      await buyPolicy({
        worker_id: user.id,
        plan_name: planName,
        premium_amount: premium,
        coverage_per_day: cov.perDay,
        max_days: cov.maxDays,
        coverage_amount: cov.perDay * cov.maxDays
      })
      setActivePlan(planName)
    } catch (e) {
      console.error('Buy failed', e)
    } finally {
      setBuying(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  // Fallback defaults if APIs fail
  const score = safetyScore ?? 75
  const recommendedPlan = score >= 90 ? 'Micro AI' : score >= 75 ? 'Basic' : score >= 50 ? 'Standard' : 'Premium'

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 space-y-6 max-w-5xl mx-auto">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="card p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> AI Recommendation Engine
              </span>
              {location && (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center gap-1.5">
                  <MapPin size={12} /> {location.city}
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-black gradient-text">Personalised for your Risk Profile</h2>
            <p className="text-sm mt-2 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
              Based on your current safety score of <strong className="text-white">{score}/100</strong> and live environmental conditions, 
              the AI recommends the <strong>{recommendedPlan}</strong> plan for optimal coverage.
            </p>
          </div>
          
          <div className="flex-shrink-0 text-center p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Live Safety Score</p>
            <div className="text-5xl font-black" style={{ color: score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171' }}>
              {score}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Micro AI', 'Basic', 'Standard', 'Premium'].map((planName, idx) => {
          const isRec = planName === recommendedPlan
          const isActive = planName === activePlan
          const premium = computePlanPremium(planName, score)
          const color = PLAN_COLORS[planName]
          const cov = PLAN_COVERAGE[planName]
          const isBuying = buying === planName

          return (
            <motion.div
              key={planName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative p-5 rounded-2xl flex flex-col h-full overflow-hidden transition-all duration-300"
              style={{
                background: isActive 
                  ? `linear-gradient(135deg, ${color}22, ${color}08)`
                  : isRec 
                  ? `linear-gradient(135deg, ${color}15, rgba(255,255,255,0.02))`
                  : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isActive ? color + '80' : isRec ? color + '40' : 'rgba(255,255,255,0.05)'}`,
                boxShadow: isRec && !isActive ? `0 0 20px ${color}10` : 'none',
                transform: isRec && !isActive ? 'translateY(-4px)' : 'none'
              }}
            >
              {/* Badges */}
              <div className="absolute top-0 right-0 p-3 flex flex-col gap-2 items-end">
                {isActive && (
                  <span className="px-2 py-1 bg-green-500 text-[#000] rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 size={10} /> Active
                  </span>
                )}
                {isRec && !isActive && (
                  <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1"
                    style={{ background: color, color: '#000' }}>
                    <Sparkles size={10} /> AI Pick
                  </span>
                )}
              </div>

              {/* Title & Icon */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}20`, color: color }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{planName}</h3>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    Max ₹{cov.perDay * cov.maxDays} coverage
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black" style={{ color }}>₹{premium}</span>
                  <span className="text-xs mb-1.5 opacity-60" style={{ color: 'var(--text-secondary)' }}>/wk</span>
                </div>
                {planName !== 'Micro AI' && (
                  <p className="text-[10px] mt-1 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                    {score >= 80 ? 'Safe Worker Discount Applied' : score >= 50 ? 'Standard Premium' : 'High Risk Surcharge'}
                  </p>
                )}
                {planName === 'Micro AI' && (
                  <p className="text-[10px] mt-1 opacity-70" style={{ color: 'var(--text-secondary)' }}>
                    Risk-adjusted from base ₹50-80
                  </p>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-2 mb-6 flex-1">
                {cov.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color }} />
                    <span className="leading-tight">{f}</span>
                  </li>
                ))}
              </ul>

               {/* Action Button */}
               <button
                  onClick={() => handleBuy(planName, premium)}
                  disabled={isActive || isBuying}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 group mt-auto"
                  style={{
                    background: isActive ? `${color}15` : isRec ? color : 'rgba(255,255,255,0.05)',
                    color: isActive ? color : isRec ? '#000' : 'var(--text-primary)',
                    border: `1px solid ${isActive ? color + '40' : isRec ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    cursor: isActive ? 'default' : 'pointer',
                    opacity: isBuying ? 0.7 : 1
                  }}
                >
                  {isBuying ? (
                    <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Processing...</>
                  ) : isActive ? (
                    'Current Plan'
                  ) : (
                    <>
                      Activate Plan
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
            </motion.div>
          )
        })}
      </div>

    </div>
  )
}
