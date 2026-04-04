import React from 'react'
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts'

interface RiskScoreChartProps {
  score: number // 0-100
  size?: number
}

const RiskScoreChart: React.FC<RiskScoreChartProps> = ({ score, size = 160 }) => {
  const color =
    score < 40 ? '#34d399' : score < 70 ? '#fbbf24' : '#f87171'

  const label =
    score < 40 ? 'Low' : score < 70 ? 'Medium' : 'High'

  const data = [{ value: score, fill: color }]

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="90%"
          data={data}
          startAngle={225}
          endAngle={-45}
          barSize={12}
        >
          <RadialBar
            dataKey="value"
            background={{ fill: 'rgba(99,102,241,0.1)', radius: 10 }}
            cornerRadius={10}
          >
            <Cell fill={color} />
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Center text */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ pointerEvents: 'none' }}
      >
        <span className="text-2xl font-black" style={{ color }}>
          {score}
        </span>
        <span className="text-xs font-semibold" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  )
}

export default RiskScoreChart
