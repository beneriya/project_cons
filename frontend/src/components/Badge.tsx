import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'in'
  | 'out'
  | 'low-stock'
  | 'in-stock'
  | 'out-of-stock'
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive/10 text-destructive',
  outline: 'border border-input bg-transparent',
  in: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  out: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'in-stock': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'low-stock': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'out-of-stock': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function Badge({ variant = 'default', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
