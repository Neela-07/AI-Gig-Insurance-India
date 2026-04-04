import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Download } from 'lucide-react'
import ClaimCard from '../components/ui/ClaimCard'
import WorkflowPipeline from '../components/ui/WorkflowPipeline'

import { getClaims } from '../services/api'
import { authService } from '../services/auth'

type Filter = 'all' | 'approved' | 'review' | 'rejected'

const Claims: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [claimsList, setClaimsList] = useState<any[]>([])
  
  useEffect(() => {
    const user = authService.getCurrentUser()
    const workerId = user?.id || 'WRK-8821'
    getClaims(workerId).then(res => setClaimsList(res.data.claims)).catch(console.error)
  }, [])

  const filtered = claimsList.filter(
    (c) => filter === 'all' || c.status === filter
  )

  const totalPayout = claimsList
    .filter((c) => c.status === 'approved' || c.status === 'credited')
    .reduce((acc, c) => acc + (c.payout_amount || 0), 0)

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Claims', value: claimsList.length, color: '#818cf8' },
          { label: 'Total Payout', value: `₹${totalPayout.toLocaleString()}`, color: '#34d399' },
          { label: 'Approval Rate', value: '67%', color: '#fbbf24' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card p-4 text-center"
          >
            <p className="text-xl font-black" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Pipeline for active claim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card p-5"
      >
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Active Claim Pipeline — CLM-003
        </p>
        <WorkflowPipeline currentStep={3} />
      </motion.div>

      {/* Filter + list */}
      <div className="space-y-3">
        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
          {(['all', 'approved', 'review', 'rejected'] as Filter[]).map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'hover:bg-indigo-500/10'
              }`}
              style={filter !== f ? { color: 'var(--text-secondary)', border: '1px solid var(--border)' } : {}}
            >
              {f}
            </button>
          ))}
          <button className="ml-auto flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-500/10 transition-all" style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)', flexShrink: 0 }}>
            <Download size={12} /> Export
          </button>
        </div>

        {/* Claims list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filtered.map((claim, i) => (
              <div key={claim.id} onClick={() => setSelectedId(selectedId === claim.id ? null : claim.id)}>
                <ClaimCard {...claim} eventType={claim.event_type || claim.eventType} fraudScore={claim.fraud_score || claim.fraudScore} payout={`₹${claim.payout_amount || 0}`} date={claim.triggered_at ? new Date(claim.triggered_at).toLocaleDateString() : claim.date} index={i} />
                <AnimatePresence>
                  {selectedId === claim.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mx-1 p-4 rounded-b-2xl -mt-2 pt-6 text-xs space-y-2"
                        style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid var(--border)', borderTop: 'none' }}
                      >
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>Claim ID</span>
                          <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>{claim.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>Fraud Score</span>
                          <span className="font-semibold" style={{ color: claim.fraudScore! > 0.5 ? '#f87171' : claim.fraud_score! > 0.5 ? '#f87171' : '#34d399' }}>
                            {claim.fraudScore !== undefined ? (claim.fraudScore * 100).toFixed(0) : claim.fraud_score !== undefined ? (claim.fraud_score * 100).toFixed(0) : '—'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--text-secondary)' }}>Processing Time</span>
                          <span style={{ color: 'var(--text-primary)' }}>~2.4 seconds</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Claims
