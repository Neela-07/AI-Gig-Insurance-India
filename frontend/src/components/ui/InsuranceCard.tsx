import React from 'react'
import { motion } from 'framer-motion'
import { Wifi, CreditCard } from 'lucide-react'

interface InsuranceCardProps {
  planName: string
  coverageAmount: string
  premium: string
  validUntil: string
  workerId: string
  status: 'active' | 'inactive' | 'suspended'
}

const InsuranceCard: React.FC<InsuranceCardProps> = ({
  planName,
  coverageAmount,
  premium,
  validUntil,
  workerId,
  status,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      whileHover={{ scale: 1.02, rotateY: 3 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative w-full max-w-sm rounded-3xl overflow-hidden cursor-pointer select-none"
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
        boxShadow: '0 20px 60px rgba(99,102,241,0.4)',
        minHeight: 180,
        perspective: '1000px',
      }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div
        className="absolute top-[-30%] right-[-10%] w-64 h-64 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, white, transparent)' }}
      />

      {/* Card content */}
      <div className="relative p-6 flex flex-col justify-between h-full min-h-[180px]">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
              SmartShield AI
            </p>
            <p className="text-white text-lg font-bold mt-0.5">{planName}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Wifi size={20} className="text-white/80 rotate-90" />
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                status === 'active'
                  ? 'bg-green-400/30 text-green-200'
                  : 'bg-red-400/30 text-red-200'
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Coverage */}
        <div className="mt-4">
          <p className="text-white/60 text-xs">Coverage</p>
          <p className="text-white text-2xl font-black">{coverageAmount}</p>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <p className="text-white/60 text-xs">Worker ID</p>
            <p className="text-white text-sm font-mono font-semibold tracking-wider">
              {workerId}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">Valid Until</p>
            <p className="text-white text-sm font-semibold">{validUntil}</p>
          </div>
          <CreditCard size={24} className="text-white/40" />
        </div>
      </div>
    </motion.div>
  )
}

export default InsuranceCard
