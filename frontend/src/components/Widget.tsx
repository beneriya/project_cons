import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'

export interface WidgetProps {
  icon?: ReactNode
  value: string | number
  label: string
  color?: 'blue' | 'green' | 'red' | 'amber'
}

const colorMap = {
  blue: { card: 'border-l-primary', icon: 'bg-primary/10 text-primary' },
  green: { card: 'border-l-emerald-500', icon: 'bg-emerald-500/10 text-emerald-600' },
  red: { card: 'border-l-destructive', icon: 'bg-destructive/10 text-destructive' },
  amber: { card: 'border-l-amber-500', icon: 'bg-amber-500/10 text-amber-600' },
}

export function Widget({ icon, value, label, color = 'blue' }: WidgetProps) {
  const colors = colorMap[color]
  return (
    <Card className={cn(
      'overflow-hidden border-l-4 transition-all duration-200 hover:shadow-[var(--theme-card-hover)] hover:-translate-y-0.5',
      colors.card
    )}>
      <CardHeader className="flex flex-row items-center gap-2 pb-1">
        {icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', colors.icon)}>
            {icon}
          </span>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}
