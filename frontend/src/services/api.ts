import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ─── Risk ────────────────────────────────────────────────────────────────────
export const getLiveRisk = (params?: { lat?: number; lon?: number; city?: string; demo_mode?: boolean }) => {
  const parts: string[] = []
  if (params?.lat !== undefined) parts.push(`lat=${params.lat}`)
  if (params?.lon !== undefined) parts.push(`lon=${params.lon}`)
  if (params?.city) parts.push(`city=${encodeURIComponent(params.city)}`)
  if (params?.demo_mode) parts.push('demo_mode=surge')
  const qs = parts.length ? `?${parts.join('&')}` : ''
  return API.get(`/risk/live${qs}`)
}

// ─── Trigger ─────────────────────────────────────────────────────────────────
export const validateTrigger = (data: {
  rain_mm: number
  temp_c: number
  aqi: number
  traffic_pct: number
  worker_id: string
}) => API.post('/trigger/validate', data)

// ─── Premium ─────────────────────────────────────────────────────────────────
export const calculatePremium = (data: {
  zone_risk: number
  claim_frequency: number
  work_consistency: number
  worker_id?: string
}) => API.post('/premium/calculate', data)

export const getPolicy = (worker_id: string) => API.get(`/premium/policy?worker_id=${worker_id}`)

export const getRiskSnapshot = (
  worker_id: string,
  opts?: { lat?: number; lon?: number; city?: string; active_plan?: string }
) => {
  const parts: string[] = [`worker_id=${worker_id}`]
  if (opts?.lat !== undefined) parts.push(`lat=${opts.lat}`)
  if (opts?.lon !== undefined) parts.push(`lon=${opts.lon}`)
  if (opts?.city) parts.push(`city=${encodeURIComponent(opts.city)}`)
  if (opts?.active_plan) parts.push(`active_plan=${encodeURIComponent(opts.active_plan)}`)
  return API.get(`/premium/risk-snapshot?${parts.join('&')}`)
}

export const buyPolicy = (data: {
  worker_id: string
  plan_name: string
  premium_amount: number
  coverage_amount?: number
  coverage_per_day?: number
  max_days?: number
}) => API.post('/premium/buy', data)

// ─── Claims ──────────────────────────────────────────────────────────────────
export const triggerClaim = (data: {
  worker_id: string
  event_type: string
  rain_mm?: number
  temp_c?: number
  aqi?: number
  traffic_pct?: number
}) => API.post('/claim/trigger', data)

export const getClaims = (worker_id: string) =>
  API.get(`/claims?worker_id=${worker_id}`)

// ─── Fraud ───────────────────────────────────────────────────────────────────
export const checkFraud = (data: {
  claim_id: string
  claim_frequency: number
  unusual_timing: number
  gps_mismatch: number
  rapid_succession: number
  amount_anomaly: number
}) => API.post('/fraud/check', data)

// ─── Payout ──────────────────────────────────────────────────────────────────
export const simulatePayout = (data: {
  event_type: string
  severity: number
  coverage: number
}) => API.post('/payout/simulate', data)

// ─── Admin ───────────────────────────────────────────────────────────────────
export const getAdminStats = () => API.get('/admin/stats')

export default API
