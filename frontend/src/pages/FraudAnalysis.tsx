import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react'
import { checkFraud } from '../services/api'

const featureLabels: Record<string, string> = {
  claim_frequency: 'Claim Frequency',
  unusual_timing: 'Unusual Timing',
  gps_mismatch: 'GPS Mismatch',
  rapid_succession: 'Rapid Succession',
  amount_anomaly: 'Amount Anomaly',
}

const featureColors = ['#6366f1', '#f87171', '#fbbf24', '#f97316', '#a78bfa']

interface FeatureSliderProps {
  label: string; value: number; onChange: (v: number) => void; color: string
}

const FeatureSlider: React.FC<FeatureSliderProps> = ({ label, value, onChange, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-bold" style={{ color }}>{(value * 100).toFixed(0)}%</span>
    </div>
    <input
      type="range" min={0} max={100} value={value * 100}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      className="w-full h-1.5 rounded-full cursor-pointer"
      style={{ accentColor: color }}
    />
    <div className="w-full bg-indigo-500/10 rounded-full h-1">
      <div
        className="h-1 rounded-full transition-all duration-300"
        style={{ width: `${value * 100}%`, background: color }}
      />
    </div>
  </div>
)

const FraudAnalysis: React.FC = () => {
  const [features, setFeatures] = useState({
    claim_frequency: 0.3,
    unusual_timing: 0.2,
    gps_mismatch: 0.1,
    rapid_succession: 0.25,
    amount_anomaly: 0.15,
  })
  const [result, setResult] = useState<{
    fraud_score: number; decision: string; message: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const computeFraudScore = () => {
    const vals = Object.values(features)
    const weights = [0.25, 0.2, 0.2, 0.2, 0.15]
    return vals.reduce((acc, v, i) => acc + v * weights[i], 0)
  }

  const localScore = computeFraudScore()

  const handleCheck = async () => {
    setLoading(true)
    try {
      const { data } = await checkFraud({
        claim_id: `CLM-${Date.now()}`,
        ...features,
      })
      setResult(data)
    } catch {
      const score = computeFraudScore()
      const decision =
        score < 0.4 ? 'approve' : score < 0.7 ? 'review' : 'reject'
      const messages = {
        approve: '✅ Low fraud risk — Auto-approved',
        review: '⚠️ Moderate risk — Sent for manual review',
        reject: '🚫 High fraud risk — Claim rejected',
      }
      setResult({ fraud_score: score, decision, message: messages[decision] })
    } finally {
      setLoading(false)
    }
  }

  const scoreColor =
    localScore < 0.4 ? '#34d399' : localScore < 0.7 ? '#fbbf24' : '#f87171'
  const DecisionIcon =
    result?.decision === 'approve' ? CheckCircle : result?.decision === 'review' ? Clock : XCircle

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Shield size={20} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Fraud Feature Input</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Adjust ML model features</p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(features).map(([key, val], i) => (
              <FeatureSlider
                key={key}
                label={featureLabels[key]}
                value={val}
                onChange={(v) => setFeatures((prev) => ({ ...prev, [key]: v }))}
                color={featureColors[i]}
              />
            ))}
          </div>

          <button
            id="check-fraud-btn"
            onClick={handleCheck}
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running ML Model...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Shield size={16} /> Run Fraud Detection
              </span>
            )}
          </button>
        </motion.div>

        {/* Result panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Live score */}
          <div className="card p-6 flex flex-col items-center justify-center space-y-3">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Live Fraud Score</p>
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${localScore * 264} 264`}
                  initial={{ strokeDasharray: '0 264' }}
                  animate={{ strokeDasharray: `${localScore * 264} 264` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black" style={{ color: scoreColor }}>
                  {(localScore * 100).toFixed(0)}
                </span>
                <span className="text-xs font-semibold" style={{ color: scoreColor }}>Score</span>
              </div>
            </div>

            {/* Threshold indicators */}
            <div className="flex gap-3 text-[10px]">
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400">{'<40'} Approve</span>
              <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">40-70 Review</span>
              <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400">{'>70'} Reject</span>
            </div>
          </div>

          {/* Feature breakdown */}
          <div className="card p-5 space-y-3">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Feature Breakdown</p>
            {Object.entries(features).map(([key, val], i) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>{featureLabels[key]}</span>
                  <span style={{ color: featureColors[i] }}>{(val * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-indigo-500/10 rounded-full h-1.5">
                  <motion.div
                    animate={{ width: `${val * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-1.5 rounded-full"
                    style={{ background: featureColors[i] }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Decision output */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card p-5 text-center space-y-2"
                style={{
                  background: result.decision === 'approve' ? 'rgba(52,211,153,0.1)' : result.decision === 'review' ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
                  border: `1px solid ${result.decision === 'approve' ? 'rgba(52,211,153,0.3)' : result.decision === 'review' ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'}`,
                }}
              >
                <DecisionIcon
                  size={32}
                  className="mx-auto"
                  style={{ color: result.decision === 'approve' ? '#34d399' : result.decision === 'review' ? '#fbbf24' : '#f87171' }}
                />
                <p
                  className="text-lg font-black uppercase tracking-wide"
                  style={{ color: result.decision === 'approve' ? '#34d399' : result.decision === 'review' ? '#fbbf24' : '#f87171' }}
                >
                  {result.decision}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{result.message}</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Score: {(result.fraud_score * 100).toFixed(1)}%
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default FraudAnalysis
