import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CloudRain, Thermometer, Wind, Navigation, RefreshCw, Zap } from 'lucide-react'
import { getLiveRisk, validateTrigger } from '../services/api'

interface RiskData {
  rain_mm: number
  temp_c: number
  aqi: number
  traffic_pct: number
  zone: string
  timestamp: string
}

const thresholds = {
  rain_mm: 40,
  temp_c: 42,
  aqi: 300,
  traffic_pct: 80,
}

const generateMock = (): RiskData => ({
  rain_mm: Math.round(Math.random() * 80),
  temp_c: Math.round(30 + Math.random() * 20),
  aqi: Math.round(100 + Math.random() * 350),
  traffic_pct: Math.round(40 + Math.random() * 60),
  zone: 'Mumbai Central',
  timestamp: new Date().toLocaleTimeString(),
})

const RiskMonitor: React.FC = () => {
  const [data, setData] = useState<RiskData>(generateMock())
  const [refreshing, setRefreshing] = useState(false)
  const [triggerResult, setTriggerResult] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  const fetchData = useCallback(async () => {
    setRefreshing(true)
    try {
      const { data: resp } = await getLiveRisk(demoMode)
      setData(resp)
    } catch {
      setData(generateMock())
    } finally {
      setRefreshing(false)
    }
  }, [demoMode])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 8000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const handleValidate = async () => {
    try {
      const { data: resp } = await validateTrigger({
        ...data,
        worker_id: 'WRK-8821',
      })
      setTriggerResult(resp.message || 'Trigger validated!')
    } catch {
      const triggered = Object.entries(thresholds).some(
        ([k, v]) => (data as unknown as Record<string, number>)[k] > v
      )
      setTriggerResult(
        triggered
          ? '🚨 Conditions breached — Claim triggered!'
          : '✅ Conditions normal — No claim needed'
      )
    }
    setTimeout(() => setTriggerResult(null), 4000)
  }

  const cards = [
    {
      key: 'rain_mm',
      label: 'Rainfall',
      value: data.rain_mm,
      unit: 'mm',
      icon: CloudRain,
      threshold: thresholds.rain_mm,
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.12)',
      description: 'Trigger if > 40mm',
    },
    {
      key: 'temp_c',
      label: 'Temperature',
      value: data.temp_c,
      unit: '°C',
      icon: Thermometer,
      threshold: thresholds.temp_c,
      color: '#f87171',
      bg: 'rgba(248,113,113,0.12)',
      description: 'Trigger if > 42°C',
    },
    {
      key: 'aqi',
      label: 'Air Quality (AQI)',
      value: data.aqi,
      unit: '',
      icon: Wind,
      threshold: thresholds.aqi,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.12)',
      description: 'Trigger if > 300',
    },
    {
      key: 'traffic_pct',
      label: 'Traffic Density',
      value: data.traffic_pct,
      unit: '%',
      icon: Navigation,
      threshold: thresholds.traffic_pct,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.12)',
      description: 'Trigger if > 80%',
    },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      {/* Status bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {data.zone}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Last updated: {data.timestamp}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
              demoMode
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                : 'hover:bg-amber-500/10 text-gray-400 border border-gray-700'
            }`}
          >
            <Zap size={10} className="inline mr-1" />
            {demoMode ? 'Demo Surge: ON' : 'Demo Surge: OFF'}
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
              autoRefresh
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            <Zap size={10} className="inline mr-1" />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </button>
          <button
            id="refresh-risk-btn"
            onClick={fetchData}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-indigo-500/10 ${
              refreshing ? 'opacity-50' : ''
            }`}
            style={{ color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </motion.div>

      {/* Risk cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon
          const isTriggered = card.value > card.threshold
          const pct = Math.min(100, (card.value / (card.threshold * 1.5)) * 100)

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.09 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: card.bg }}
                  >
                    <Icon size={20} style={{ color: card.color }} />
                  </div>
                  <div>
                    <p
                      className="text-sm font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {card.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {card.description}
                    </p>
                  </div>
                </div>
                <span className={isTriggered ? 'status-triggered' : 'status-safe'}>
                  {isTriggered ? 'Triggered' : 'Safe'}
                </span>
              </div>

              {/* Big value */}
              <motion.p
                key={card.value}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-black mb-3"
                style={{ color: isTriggered ? '#f87171' : card.color }}
              >
                {card.value}
                <span className="text-lg font-semibold ml-1">{card.unit}</span>
              </motion.p>

              {/* Progress bar */}
              <div className="space-y-1">
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(99,102,241,0.1)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: isTriggered
                        ? 'linear-gradient(90deg, #f87171, #ef4444)'
                        : `linear-gradient(90deg, ${card.color}80, ${card.color})`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  <span>0</span>
                  <span>Threshold: {card.threshold}{card.unit}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Trigger validation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-5"
      >
        <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Trigger Validation
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
          Validate if current conditions breach parametric triggers for automatic claim initiation.
        </p>
        <button
          id="validate-trigger-btn"
          onClick={handleValidate}
          className="btn-primary w-full py-3"
        >
          Validate Current Conditions
        </button>
        <AnimatePresence>
          {triggerResult && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-3 rounded-xl text-sm font-semibold text-center"
              style={{
                background: triggerResult.includes('🚨') ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                border: `1px solid ${triggerResult.includes('🚨') ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}`,
                color: triggerResult.includes('🚨') ? '#f87171' : '#34d399',
              }}
            >
              {triggerResult}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default RiskMonitor
