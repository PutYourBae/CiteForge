import React from 'react'
import { OAStatus } from '../../types/paper.types'
import { Unlock, Lock, HelpCircle } from 'lucide-react'

export function AccessBadge({ status }: { status: OAStatus }) {
  if (status === 'open_access') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                        font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20">
        <Unlock size={9} /> Open Access
      </span>
    )
  }
  if (status === 'paid') {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                        font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
        <Lock size={9} /> Paid
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                      font-semibold bg-[#2D3149]/50 text-[#94A3B8]">
      <HelpCircle size={9} /> Unknown
    </span>
  )
}
