import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, CloudRain, Flame, Wind, Car,
  CheckCircle2, XCircle, Clock, AlertTriangle, Filter,
  ChevronDown
} from 'lucide-react'
import { getClaims } from '../services/api'
import { authService } from '../services/auth'

const EVENT_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string; emoji: string }> = {
  rain:    { icon: CloudRain, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  emoji: '🌧️' },
  heat:    { icon: Flame,     color: '#f97316', bg: 'rgba(249,115,22,0.12)',  emoji: '🌡️' },
  aqi:     { icon: Wind,      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', emoji: '💨' },
  traffic: { icon: Car,       color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  emoji: '🚗' },
  outage:  { icon: AlertTriangle, color: '#f87171', bg: 'rgba(248,113,113,0.12)', emoji: '⚡' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  credited:   { label: 'Paid Out',    color: '#34d399', bg: 'rgba(52,211,153,0.12)',   icon: CheckCircle2 },
  approved:   { label: 'Approved',    color: '#34d399', bg: 'rgba(52,211,153,0.12)',   icon: CheckCircle2 },
  rejected:   { label: 'Rejected',    color: '#f87171', bg: 'rgba(248,113,113,0.12)',  icon: XCircle },
  processing: { label: 'Processing',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   icon: Clock },
  review:     { label: 'In Review',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   icon: Clock },
  fraud_check:{ label: 'Fraud Check', color: '#f97316', bg: 'rgba(249,115,22,0.12)',   icon: AlertTriangle },
}

type FilterType = 'all' | 'credited' | 'approved' | 'rejected' | 'processing'

const ClaimsHistory: React.FC = () => {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const user = authService.getCurrentUser()

  const fetchClaims = useCallback(async (silent = false) => {
    if (!user) return
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await getClaims(user.id)
      setClaims(res.data.claims || [])
    } catch (e) {
      console.error('Failed to fetch claims', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => { fetchClaims() }, [fetchClaims])

  const filtered = filter === 'all'
    ? claims
    : claims.filter(c => c.status === filter || (filter === 'approved' && c.status === 'credited'))

  const totalPaid = claims
    .filter(c => c.status === 'credited' || c.status === 'approved')
    .reduce((sum, c) => sum + (c.payout_amount || 0), 0)

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24 md:pb-6 max-w-3xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Claims History</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {claims.length} total claim{claims.length !== 1 ? 's' : ''} · fetched from database
          </p>
        </div>
        <button
          onClick={() => fetchClaims(true)}
          disabled={refreshing}
          className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20 transition-all"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Claims', value: claims.length, color: '#818cf8' },
          { label: 'Paid Out', value: claims.filter(c => c.status === 'credited' || c.status === 'approved').length, color: '#34d399' },
          { label: 'Total Received', value: `₹${totalPaid.toLocaleString()}`, color: '#fbbf24' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <Filter size={14} className="text-indigo-400 self-center flex-shrink-0" />
        {([
          { id: 'all',        label: 'All' },
          { id: 'credited',   label: 'Paid Out' },
          { id: 'processing', label: 'Processing' },
          { id: 'rejected',   label: 'Rejected' },
        ] as { id: FilterType; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === tab.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
              color: filter === tab.id ? '#818cf8' : 'var(--text-secondary)',
              border: `1px solid ${filter === tab.id ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Claim List ──────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {filter === 'all' ? 'No claims yet' : `No ${filter} claims`}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
            Claims will appear here after you trigger them
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((claim, i) => {
              const eventKey = (claim.event_type || 'rain').toLowerCase()
              const evt = EVENT_ICONS[eventKey] || EVENT_ICONS.rain
              const sts = STATUS_CONFIG[claim.status] || STATUS_CONFIG.processing
              const StsIcon = sts.icon
              const isExp = expanded === claim.id
              const date = new Date(claim.triggered_at || claim.created_at)

              return (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {/* Main row */}
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left"
                    onClick={() => setExpanded(isExp ? null : claim.id)}
                  >
                    {/* Event icon */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: evt.bg }}>
                      {evt.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                        {eventKey.charAt(0).toUpperCase() + eventKey.slice(1)} Event
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {claim.id} · {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{ background: sts.bg }}>
                      <StsIcon size={11} style={{ color: sts.color }} />
                      <span className="text-[10px] font-bold" style={{ color: sts.color }}>{sts.label}</span>
                    </div>

                    {/* Payout */}
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-black" style={{ color: claim.payout_amount ? '#34d399' : 'var(--text-secondary)' }}>
                        {claim.payout_amount ? `₹${claim.payout_amount}` : '—'}
                      </p>
                    </div>

                    <ChevronDown size={14} className="flex-shrink-0 transition-transform"
                      style={{ color: 'var(--text-secondary)', transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            {[
                              { label: 'Claim ID',      value: claim.id },
                              { label: 'Event Type',    value: eventKey.charAt(0).toUpperCase() + eventKey.slice(1) },
                              { label: 'Date & Time',   value: date.toLocaleString('en-IN') },
                              { label: 'Payout Amount', value: claim.payout_amount ? `₹${claim.payout_amount}` : '—' },
                              { label: 'Status',        value: sts.label },
                              { label: 'Fraud Score',   value: claim.fraud_score != null ? `${(claim.fraud_score * 100).toFixed(0)}% risk` : '—' },
                            ].map(d => (
                              <div key={d.label}>
                                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>{d.label}</p>
                                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{d.value}</p>
                              </div>
                            ))}
                          </div>
                          {claim.description && (
                            <p className="mt-3 text-xs p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                              📝 {claim.description}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default ClaimsHistory
