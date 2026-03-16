import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8 py-12">
      {icon && (
        <div className="text-[#2D3149] mb-1">{icon}</div>
      )}
      <h3 className="text-white font-semibold text-base">{title}</h3>
      {description && (
        <p className="text-[#94A3B8] text-sm max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
