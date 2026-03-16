import type { ReactNode } from 'react'

type WidgetColor = 'blue' | 'green' | 'red' | 'amber'

export interface WidgetProps {
  icon: ReactNode
  value: number
  label: string
  color: WidgetColor
  className?: string
}

const colorClass: Record<WidgetColor, string> = {
  blue: 'widget blue',
  green: 'widget green',
  red: 'widget red',
  amber: 'widget amber',
}

export function Widget({ icon, value, label, color, className = '' }: WidgetProps) {
  return (
    <div className={`${colorClass[color]} ${className}`.trim()}>
      <div className="widget-icon">{icon}</div>
      <div className="widget-value">{value}</div>
      <div className="widget-label">{label}</div>
    </div>
  )
}
