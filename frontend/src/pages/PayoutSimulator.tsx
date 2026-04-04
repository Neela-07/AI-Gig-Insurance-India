import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DollarSign, CloudRain, Thermometer, Wind, Navigation, AlertTriangle, CheckCircle } from 'lucide-react'
import { simulatePayout, triggerClaim } from '../services/api'
import { authService } from '../services/auth'
import WorkflowPipeline from '../components/ui/WorkflowPipeline'

const eventOptions = [
  { value: 'rain', label: 'Heavy Rain', icon: CloudRain, color: '#60a5fa', baseAmount: 800 },
  { value: 'heat', label: 'Heatwave', icon: Thermometer, color: '#f87171', baseAmount: 600 },
  { value: 'aqi', label: 'Poor AQI', icon: Wind, color: '#a78bfa', baseAmount: 500 },
  { value: 'traffic', label: 'Traffic Jam', icon: Navigation, color: '#fbbf24', baseAmount: 450 },
  { value: 'outage', label: 'Platform Outage', icon: AlertTriangle, color: '#fb923c', baseAmount: 700 },
]

type SimulationStage = 'idle' | 'validating' | 'fraud_check' | 'processing' | 'credited'

const stageMessages: Record<SimulationStage, string> = {
  idle: '',
  validating: '🔍 Validating parametric conditions...',
  fraud_check: '🤖 Running fraud detection model...',
  processing: '⚡ Initiating payout transfer...',
  credited: '',
}

const PayoutSimulator: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState('rain')
  const [severity, setSeverity] = useState(70)
  const [stage, setStage] = useState<SimulationStage>('idle')
  const [payout, setPayout] = useState<number | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  const eventConfig = eventOptions.find((e) => e.value === selectedEvent)!
  const estimatedPayout = Math.round(eventConfig.baseAmount * (severity / 100) * 1.2)

  const runSimulation = async () => {
    setStage('validating')
    setCurrentStep(2)
    setPayout(null)

    await new Promise((r) => setTimeout(r, 1200))
    setStage('fraud_check')
    setCurrentStep(3)

    await new Promise((r) => setTimeout(r, 1500))
    setStage('processing')
    setCurrentStep(4)

    try {
      const { data } = await simulatePayout({
        event_type: selectedEvent,
        severity: severity / 100,
        coverage: 50000,
      })
      
      try {
        const user = authService.getCurrentUser()
        await triggerClaim({
          worker_id: user?.id || 'WRK-8821',
          event_type: selectedEvent,
          payout_amount: data.payout_amount || estimatedPayout
        } as any)
      } catch (e) { console.error('Failed to register triggered claim', e) }

      setPayout(data.payout_amount || estimatedPayout)
    } catch {
      setPayout(estimatedPayout)
    }

    await new Promise((r) => setTimeout(r, 1000))
    setStage('credited')
    setCurrentStep(5)
  }

  const reset = () => {
    setStage('idle')
    setCurrentStep(1)
    setPayout(null)
  }

  const EventIcon = eventConfig.icon

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <DollarSign size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Payout Simulator</h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Simulate the end-to-end claim and payout flow
              </p>
            </div>
          </div>

          {/* Pipeline */}
          <WorkflowPipeline currentStep={currentStep} />
          {stage !== 'idle' && stage !== 'credited' && (
            <motion.p
              key={stage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center mt-3"
              style={{ color: '#818cf8' }}
            >
              {stageMessages[stage]}
            </motion.p>
          )}
        </motion.div>

        {/* Event selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5 space-y-4"
        >
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Select Event Type</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {eventOptions.map((e) => {
              const Icon = e.icon
              const isSelected = selectedEvent === e.value
              return (
                <button
                  key={e.value}
                  id={`event-${e.value}`}
                  onClick={() => setSelectedEvent(e.value)}
                  disabled={stage !== 'idle'}
                  className={`p-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-2 transition-all border ${
                    isSelected ? 'border-indigo-500/50' : 'hover:border-indigo-500/30'
                  }`}
                  style={{
                    background: isSelected ? `${e.color}20` : 'rgba(99,102,241,0.03)',
                    borderColor: isSelected ? `${e.color}50` : 'var(--border)',
                    color: isSelected ? e.color : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={18} />
                  {e.label}
                </button>
              )
            })}
          </div>

          {/* Severity slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Event Severity</span>
              <span className="font-bold" style={{ color: '#818cf8' }}>{severity}%</span>
            </div>
            <input
              type="range" min={10} max={100} value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              disabled={stage !== 'idle'}
              className="w-full h-2 rounded-full cursor-pointer"
              style={{ accentColor: '#6366f1' }}
            />
          </div>

          {/* Estimated payout preview */}
          <div
            className="p-4 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <EventIcon size={16} style={{ color: eventConfig.color }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Est. Payout
              </span>
            </div>
            <span className="text-xl font-black gradient-text">₹{estimatedPayout.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Simulate button */}
        {stage === 'idle' && (
          <motion.button
            id="simulate-payout-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={runSimulation}
            className="btn-primary w-full py-4 text-base"
          >
            🚀 Run Full Simulation
          </motion.button>
        )}

        {/* Processing animation */}
        {(stage === 'validating' || stage === 'fraud_check' || stage === 'processing') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card p-6 flex flex-col items-center justify-center gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500"
            />
            <p className="text-sm font-semibold text-center" style={{ color: 'var(--text-secondary)' }}>
              {stageMessages[stage]}
            </p>
          </motion.div>
        )}

        {/* Success result */}
        <AnimatePresence>
          {stage === 'credited' && payout !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="card p-8 text-center space-y-4"
              style={{
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.3)',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              >
                <CheckCircle size={56} className="mx-auto text-green-400" />
              </motion.div>
              <div>
                <p className="text-sm text-green-400 font-semibold">Payout Credited!</p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-5xl font-black mt-2"
                  style={{ color: '#34d399' }}
                >
                  ₹{payout.toLocaleString()}
                </motion.p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Transferred to bank account ending ****2891
                </p>
              </div>
              <div
                className="p-3 rounded-xl text-xs space-y-1"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Processing Time</span>
                  <span className="font-semibold text-indigo-400">3.7 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Fraud Score</span>
                  <span className="font-semibold text-green-400">0.14 (Low)</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Decision</span>
                  <span className="font-semibold text-green-400">Auto-Approved</span>
                </div>
              </div>
              <button
                id="reset-simulation-btn"
                onClick={reset}
                className="btn-secondary w-full"
              >
                Run Another Simulation
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PayoutSimulator
