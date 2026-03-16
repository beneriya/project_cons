import type { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  return (
    <div className="dialog-overlay" onClick={() => onOpenChange(false)} role="dialog" aria-modal="true">
      <div className="dialog-backdrop" />
      <div className="dialog-wrap" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`dialog-content ${className}`.trim()}>
      {children}
    </div>
  )
}

export function DialogHeader({ children }: { children: ReactNode }) {
  return <div className="dialog-header">{children}</div>
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="dialog-title">{children}</h2>
}
