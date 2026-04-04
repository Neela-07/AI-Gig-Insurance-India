import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard, CheckCircle2, Clock, RefreshCw, Shield,
  Zap, Calendar,
  Wallet, Smartphone, Building, X, AlertCircle
} from 'lucide-react'
import { getPayments, getRiskSnapshot } from '../services/api'
import { authService } from '../services/auth'
import { locationService, DEFAULT_LOCATION } from '../services/location'

interface Payment {
  id: string
  plan_name: string
  amount: number
  date: string
  status: 'paid' | 'pending' | 'failed'
  billing_cycle: string
  coverage_amount: number
}

interface CurrentDue {
  plan_name: string
  base_premium: number
  adjusted_premium: number
  safety_score: number
  due_date: string
  billing_cycle: string
  coverage_amount: number
}

const PLAN_COLORS: Record<string, string> = {
  'Micro AI': '#94a3b8',
  'Basic': '#34d399',
  'Standard': '#fbbf24',
  'Premium': '#a78bfa',
  'Gold Shield Plan': '#f59e0b',
}

const Payments: React.FC = () => {
  const [currentDue, setCurrentDue] = useState<CurrentDue | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [payMethod, setPayMethod] = useState<'upi' | 'card' | 'netbanking'>('upi')
  const [paying, setPaying] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const [liveScore, setLiveScore] = useState<number | null>(null)
  const user = authService.getCurrentUser()

  const fetchData = useCallback(async (silent = false) => {
    if (!user) {
      setLoading(false)
      return
    }
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const [paymentsRes] = await Promise.allSettled([getPayments(user.id)])

      if (paymentsRes.status === 'fulfilled') {
        const d = paymentsRes.value.data
        setCurrentDue(d.current_due)
        setPayments(d.payments || [])
        setTotalPaid(d.total_paid || 0)
      }

      // Fetch live safety score for dynamic premium display
      const loc = locationService.getSaved() || DEFAULT_LOCATION
      try {
        const snap = await getRiskSnapshot(user.id, { lat: loc.lat, lon: loc.lon, city: loc.city })
        setLiveScore(snap.data?.safety_score ?? null)
      } catch { /* non-critical */ }
    } catch (e) {
      console.error('Payments fetch failed', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => { fetchData() }, [fetchData])

  const handlePay = async () => {
    setPaying(true)
    await new Promise(r => setTimeout(r, 2000)) // Simulate payment
    setPaying(false)
    setPaySuccess(true)
    setTimeout(() => {
      setPaySuccess(false)
      setShowPayModal(false)
      fetchData(true)
    }, 2500)
  }

  const planColor = currentDue ? (PLAN_COLORS[currentDue.plan_name] || '#818cf8') : '#818cf8'
  const safetyScore = liveScore ?? currentDue?.safety_score ?? 75
  const scoreLabel = safetyScore >= 80 ? 'Safe Worker' : safetyScore >= 50 ? 'Normal Worker' : 'High Risk'
  const scoreColor = safetyScore >= 80 ? '#34d399' : safetyScore >= 50 ? '#fbbf24' : '#f87171'

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 pb-24 md:pb-6 max-w-3xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>Payments</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Weekly premium billing · dynamically adjusted
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20 transition-all"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Paid',    value: `₹${totalPaid.toLocaleString()}`, color: '#34d399' },
          { label: 'Payments Made', value: payments.filter(p => p.status === 'paid').length, color: '#818cf8' },
          { label: 'Safety Score',  value: `${safetyScore}/100`, color: scoreColor },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-base font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Current Due Card ────────────────────────────────────────── */}
      {currentDue ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl p-5 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${planColor}18, rgba(255,255,255,0.02))`,
            border: `1px solid ${planColor}40`,
          }}
        >
          {/* Glow orb */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ background: planColor }} />

          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1" style={{ color: 'var(--text-primary)' }}>
                Current Due
              </p>
              <div className="flex items-center gap-2">
                <Shield size={16} style={{ color: planColor }} />
                <span className="text-sm font-bold" style={{ color: planColor }}>{currentDue.plan_name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black" style={{ color: planColor }}>₹{currentDue.adjusted_premium}</span>
                <span className="text-xs opacity-60">/{currentDue.billing_cycle}</span>
              </div>
              {currentDue.adjusted_premium !== currentDue.base_premium && (
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Base: ₹{currentDue.base_premium}
                  {currentDue.adjusted_premium < currentDue.base_premium
                    ? <span className="text-emerald-400 ml-1">↓ Discount</span>
                    : <span className="text-rose-400 ml-1">↑ Surcharge</span>}
                </p>
              )}
            </div>
          </div>

          {/* Risk-based adjustment info */}
          <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl"
            style={{ background: `${scoreColor}12`, border: `1px solid ${scoreColor}25` }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: `${scoreColor}20`, color: scoreColor }}>
              {safetyScore}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: scoreColor }}>{scoreLabel}</strong> · Premium adjusted from base ₹{currentDue.base_premium} based on live risk score
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                Due: <strong>{new Date(currentDue.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
              </span>
              <span className="mt-0.5 block">Coverage: ₹{currentDue.coverage_amount.toLocaleString()}</span>
            </div>
            <button
              id="pay-now-btn"
              onClick={() => setShowPayModal(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: planColor, color: '#000' }}
            >
              Pay Now
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <AlertCircle size={28} className="mx-auto mb-2 text-yellow-400" />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No active plan found</p>
          <p className="text-xs mt-1 opacity-60" style={{ color: 'var(--text-secondary)' }}>Activate a plan to see your current due</p>
        </div>
      )}

      {/* ── Payment History ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider opacity-50" style={{ color: 'var(--text-primary)' }}>
          Payment History
        </p>

        {payments.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text-secondary)' }}>
            <Wallet size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No payment history yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map((pay, i) => {
              const pColor = PLAN_COLORS[pay.plan_name] || '#818cf8'
              const isPaid = pay.status === 'paid'
              return (
                <motion.div
                  key={pay.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Status icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isPaid ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)' }}>
                    {isPaid
                      ? <CheckCircle2 size={18} className="text-emerald-400" />
                      : <Clock size={18} className="text-yellow-400" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {pay.plan_name} Premium
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {pay.id} · {new Date(pay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: isPaid ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                      color: isPaid ? '#34d399' : '#fbbf24',
                    }}>
                    {isPaid ? 'Paid' : 'Pending'}
                  </span>

                  {/* Amount */}
                  <p className="text-sm font-black flex-shrink-0" style={{ color: pColor }}>
                    ₹{pay.amount}
                  </p>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Pay Now Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm rounded-2xl p-6 space-y-5"
              style={{ background: 'var(--surface)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              {/* Close */}
              <button onClick={() => setShowPayModal(false)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                <X size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>

              {paySuccess ? (
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center py-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </div>
                  <p className="text-lg font-black text-emerald-400">Payment Successful!</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    ₹{currentDue?.adjusted_premium} paid for {currentDue?.plan_name}
                  </p>
                </motion.div>
              ) : (
                <>
                  <div>
                    <h3 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>Pay Premium</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {currentDue?.plan_name} · ₹{currentDue?.adjusted_premium}/{currentDue?.billing_cycle}
                    </p>
                  </div>

                  {/* Amount summary */}
                  <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text-secondary)' }}>Premium</span>
                      <span style={{ color: 'var(--text-primary)' }}>₹{currentDue?.base_premium}</span>
                    </div>
                    {currentDue && currentDue.adjusted_premium !== currentDue.base_premium && (
                      <div className="flex justify-between text-sm mt-1">
                        <span style={{ color: 'var(--text-secondary)' }}>Risk Adjustment</span>
                        <span style={{ color: currentDue.adjusted_premium < currentDue.base_premium ? '#34d399' : '#f87171' }}>
                          {currentDue.adjusted_premium < currentDue.base_premium ? '-' : '+'}₹{Math.abs(currentDue.adjusted_premium - currentDue.base_premium)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-base mt-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>Total Due</span>
                      <span style={{ color: planColor }}>₹{currentDue?.adjusted_premium}</span>
                    </div>
                  </div>

                  {/* Payment method tabs */}
                  <div>
                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>Payment Method</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'upi',        label: 'UPI',        icon: Smartphone },
                        { id: 'card',       label: 'Card',       icon: CreditCard },
                        { id: 'netbanking', label: 'Net Banking', icon: Building },
                      ] as { id: typeof payMethod; label: string; icon: React.ElementType }[]).map(m => {
                        const MIcon = m.icon
                        return (
                          <button
                            key={m.id}
                            onClick={() => setPayMethod(m.id)}
                            className="flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all"
                            style={{
                              background: payMethod === m.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${payMethod === m.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`,
                            }}
                          >
                            <MIcon size={16} style={{ color: payMethod === m.id ? '#818cf8' : 'var(--text-secondary)' }} />
                            <span className="text-[10px] font-semibold"
                              style={{ color: payMethod === m.id ? '#818cf8' : 'var(--text-secondary)' }}>
                              {m.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* UPI input */}
                  {payMethod === 'upi' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Enter UPI ID (e.g. name@upi)"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-primary)',
                        }}
                      />
                    </div>
                  )}

                  {payMethod === 'card' && (
                    <div className="space-y-2">
                      <input type="text" placeholder="Card Number" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="MM/YY" className="px-4 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} />
                        <input type="text" placeholder="CVV" className="px-4 py-2.5 rounded-xl text-sm outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)' }} />
                      </div>
                    </div>
                  )}

                  <button
                    id="confirm-payment-btn"
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
                  >
                    {paying ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                    ) : (
                      <>Pay ₹{currentDue?.adjusted_premium} <Zap size={14} /></>
                    )}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Payments
