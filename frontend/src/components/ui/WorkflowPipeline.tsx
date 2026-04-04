import React from 'react'
import { motion } from 'framer-motion'

interface WorkflowStep {
  id: number
  label: string
  sublabel: string
  icon: string
  status: 'completed' | 'active' | 'pending'
}

const steps: WorkflowStep[] = [
  { id: 1, label: 'Monitoring', sublabel: 'Live data', icon: '📡', status: 'completed' },
  { id: 2, label: 'Validation', sublabel: 'Conditions', icon: '✅', status: 'completed' },
  { id: 3, label: 'Fraud Check', sublabel: 'ML model', icon: '🤖', status: 'active' },
  { id: 4, label: 'Decision', sublabel: 'Auto-approve', icon: '⚡', status: 'pending' },
  { id: 5, label: 'Payout', sublabel: '₹ credited', icon: '💸', status: 'pending' },
]

interface WorkflowPipelineProps {
  currentStep?: number
  compact?: boolean
}

const WorkflowPipeline: React.FC<WorkflowPipelineProps> = ({
  currentStep = 3,
  compact = false,
}) => {
  const activeSteps = steps.map((s, i) => ({
    ...s,
    status: i + 1 < currentStep ? 'completed' : i + 1 === currentStep ? 'active' : 'pending',
  })) as WorkflowStep[]

  return (
    <div className={`w-full overflow-x-auto ${compact ? '' : 'pb-2'}`}>
      <div className="flex items-center min-w-max gap-0">
        {activeSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step node */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${
                  step.status === 'completed'
                    ? 'bg-green-500/20 border border-green-500/40'
                    : step.status === 'active'
                    ? 'bg-indigo-500/20 border border-indigo-500/50'
                    : 'border'
                }`}
                style={
                  step.status === 'pending'
                    ? { borderColor: 'var(--border)', background: 'rgba(99,102,241,0.03)' }
                    : undefined
                }
              >
                {step.status === 'active' && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 rounded-xl bg-indigo-500/20"
                  />
                )}
                <span className="relative">{step.icon}</span>
              </motion.div>
              {!compact && (
                <div className="text-center">
                  <p
                    className="text-xs font-semibold"
                    style={{
                      color:
                        step.status === 'active'
                          ? '#818cf8'
                          : step.status === 'completed'
                          ? '#34d399'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                    {step.sublabel}
                  </p>
                </div>
              )}
            </div>

            {/* Connector */}
            {index < activeSteps.length - 1 && (
              <div className="flex items-center">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
                  className={`h-0.5 w-8 md:w-12 origin-left ${
                    step.status === 'completed' ? 'bg-green-500/60' : 'bg-indigo-500/20'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default WorkflowPipeline
