import React from 'react'
import { LayoutDashboard, Shield, FileText, Activity, Calculator } from 'lucide-react'

interface BottomNavProps {
  activePage: string
  onNavigate: (page: string) => void
}

const items = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'risk', label: 'Risk', icon: Activity },
  { id: 'claims', label: 'Claims', icon: FileText },
  { id: 'calculator', label: 'Calc', icon: Calculator },
  { id: 'insurance', label: 'Policy', icon: Shield },
]

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate }) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-2 border-t"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex justify-around items-center">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id
          return (
            <button
              key={id}
              id={`bottom-nav-${id}`}
              onClick={() => onNavigate(id)}
              className={`bottom-nav-item flex flex-col items-center gap-1 min-w-0 flex-1 ${isActive ? 'active' : ''}`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-500/20' : ''}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
