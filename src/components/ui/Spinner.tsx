import React from 'react'
import { Loader2 } from 'lucide-react'

interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

export function Spinner({ size = 24, className = '', label }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Loader2 size={size} className="animate-spin text-[#4F8EF7]" />
      {label && <p className="text-sm text-[#94A3B8]">{label}</p>}
    </div>
  )
}
