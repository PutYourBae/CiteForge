import React from 'react'
import {
  Home, Search, BookMarked, Settings,
  Network, FlaskConical, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useUIStore, Page } from '../../store/ui.store'
import { useSearchStore } from '../../store/search.store'
import { usePapersStore } from '../../store/papers.store'

const NAV_ITEMS: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'home',     label: 'Home',        icon: Home },
  { id: 'results',  label: 'Search',      icon: Search },
  { id: 'saved',    label: 'Saved',       icon: BookMarked },
  { id: 'graph',    label: 'Graph',       icon: Network },
]

export function Sidebar() {
  const { currentPage, navigate, sidebarCollapsed, setSidebarCollapsed } = useUIStore()
  const totalFound = useSearchStore(s => s.totalFound)
  const savedCount = usePapersStore(s => s.savedPapers.length)

  return (
    <aside
      className={`flex flex-col h-full bg-[#1A1D27] border-r border-[#2D3149]
                  transition-all duration-200 ease-in-out shrink-0
                  ${sidebarCollapsed ? 'w-[56px]' : 'w-[200px]'}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#2D3149]">
        <FlaskConical size={22} className="text-[#4F8EF7] shrink-0" />
        {!sidebarCollapsed && (
          <span className="font-bold text-white text-[15px] tracking-tight">CiteForge</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-hidden">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = currentPage === id
          const badge = id === 'results' && totalFound > 0
            ? totalFound
            : id === 'saved' && savedCount > 0
            ? savedCount
            : null

          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              title={sidebarCollapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg
                          text-sm font-medium transition-all duration-150 relative
                          ${isActive
                            ? 'bg-[#4F8EF7]/15 text-[#4F8EF7]'
                            : 'text-[#94A3B8] hover:bg-[#21253A] hover:text-white'
                          }`}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && (
                <span className="truncate">{label}</span>
              )}
              {badge && !sidebarCollapsed && (
                <span className="ml-auto bg-[#4F8EF7]/20 text-[#4F8EF7] text-[10px]
                                  font-semibold px-1.5 py-0.5 rounded-full min-w-[20px]
                                  text-center">
                  {badge > 999 ? '999+' : badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom: Settings + Collapse toggle */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-[#2D3149] pt-3">
        <button
          onClick={() => navigate('settings')}
          title={sidebarCollapsed ? 'Settings' : undefined}
          className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg
                       text-sm font-medium transition-all duration-150
                       ${currentPage === 'settings'
                         ? 'bg-[#4F8EF7]/15 text-[#4F8EF7]'
                         : 'text-[#94A3B8] hover:bg-[#21253A] hover:text-white'
                       }`}
        >
          <Settings size={18} />
          {!sidebarCollapsed && <span>Settings</span>}
        </button>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-2
                     rounded-lg text-[#2D3149] hover:text-[#94A3B8]
                     hover:bg-[#21253A] transition-all duration-150"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed
            ? <ChevronRight size={16} />
            : <><ChevronLeft size={16} /><span className="text-xs">Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}
