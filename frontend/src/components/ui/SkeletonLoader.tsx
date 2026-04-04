import React from 'react'

interface SkeletonProps {
  className?: string
  lines?: number
  variant?: 'card' | 'text' | 'circle' | 'bar'
  height?: number | string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'bar',
  height = 20,
}) => {
  const styles: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: variant === 'circle' ? '50%' : variant === 'card' ? '16px' : '8px',
  }

  return <div className={`skeleton ${className}`} style={styles} />
}

export const SkeletonCard: React.FC = () => (
  <div className="card p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton variant="circle" height={40} className="w-10" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} className="w-3/4" />
        <Skeleton height={12} className="w-1/2" />
      </div>
    </div>
    <Skeleton height={12} className="w-full" />
    <Skeleton height={12} className="w-4/5" />
    <Skeleton height={36} variant="card" className="w-full" />
  </div>
)

export const SkeletonMetric: React.FC = () => (
  <div className="card p-4 space-y-2">
    <Skeleton height={12} className="w-1/2" />
    <Skeleton height={32} className="w-2/3" />
    <Skeleton height={10} className="w-1/3" />
  </div>
)

export default Skeleton
