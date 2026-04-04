import React from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle, Clock, XCircle, CloudRain, Thermometer, Wind, AlertTriangle,
  TrendingUp
} from 'lucide-react'

type ClaimStatus = 'approved' | 'review' | 'rejected' | 'processing'

interface ClaimCardProps {
  eventType: 'rain' | 'heat' | 'aqi' | 'traffic' | 'outage'
  date: string
  payout: string
  status: ClaimStatus
  fraudScore?: number
  description: string
  index?: number
}

const eventConfig = {
  rain: { icon: CloudRain, color: '#60a5fa', label: 'Heavy Rain', bg: 'rgba(96,165,250,0.15)' },
  heat: { icon: Thermometer, color: '#f87171', label: 'Heatwave', bg: 'rgba(248,113,113,0.15)' },
  aqi: { icon: Wind, color: '#a78bfa', label: 'Poor AQI', bg: 'rgba(167,139,250,0.15)' },
  traffic: { icon: TrendingUp, color: '#fbbf24', label: 'Traffic Jam', bg: 'rgba(251,191,36,0.15)' },
  outage: { icon: AlertTriangle, color: '#fb923c', label: 'Platform Outage', bg: 'rgba(251,146,60,0.15)' },
}

const statusConfig: Record<ClaimStatus, { icon: React.ElementType; color: string; label: string }> = {
  approved: { icon: CheckCircle, color: '#34d399', label: 'Approved' },
  review: { icon: Clock, color: '#fbbf24', label: 'In Review' },
  rejected: { icon: XCircle, color: '#f87171', label: 'Rejected' },
  processing: { icon: Clock, color: '#818cf8', label: 'Processing' },
}

const ClaimCard: React.FC<ClaimCardProps> = ({
  eventType, date, payout, status, fraudScore, description, index = 0
}) => {
  const event = eventConfig[eventType]
  const statusInfo = statusConfig[status]
  const EventIcon = event.icon
  const StatusIcon = statusInfo.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="card p-4 flex items-center gap-4 hover:cursor-pointer"
    >
      {/* Event icon */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: event.bg }}
      >
        <EventIcon size={22} style={{ color: event.color }} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {event.label}
          </p>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"
            style={{
              background: `${statusInfo.color}20`,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.color}40`,
            }}
          >
            <StatusIcon size={10} />
            {statusInfo.label}
          </span>
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          {date}
        </p>
      </div>

      {/* Right side */}
      <div className="text-right flex-shrink-0">
        <p className="text-base font-black" style={{ color: '#34d399' }}>
          {payout}
        </p>
        {fraudScore !== undefined && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Fraud: {(fraudScore * 100).toFixed(0)}%
          </p>
        )}
      </div>
    </motion.div>
  )
}

export default ClaimCard
