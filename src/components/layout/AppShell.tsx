import React from 'react'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0F1117]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
        <StatusBar />
      </main>
    </div>
  )
}
