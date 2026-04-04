import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

interface FABProps {
  onClick: () => void
  label?: string
}

const FAB: React.FC<FABProps> = ({ onClick, label = 'Simulate Claim' }) => {
  return (
    <motion.button
      id="fab-simulate-claim"
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-glow ring-pulse"
      style={{
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        boxShadow: '0 4px 24px rgba(99,102,241,0.5)',
      }}
    >
      <Plus size={18} strokeWidth={2.5} />
      <span className="text-sm font-bold hidden md:block">{label}</span>
    </motion.button>
  )
}

export default FAB
