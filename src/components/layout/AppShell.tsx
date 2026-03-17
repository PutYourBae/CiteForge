import React from 'react'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const isMac = navigator.userAgent.toLowerCase().includes('mac')

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F1117]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* macOS Custom Drag Bar */}
        {isMac && <div className="h-8 w-full drag-region shrink-0 bg-transparent" />}

        <div className="flex-1 overflow-hidden relative z-10">
          {children}
        </div>
        <StatusBar />
      </main>
    </div>
  )
}
