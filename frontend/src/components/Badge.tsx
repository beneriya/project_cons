import type { HTMLAttributes } from 'react'

type BadgeVariant = 'in' | 'out' | 'low-stock' | 'in-stock' | 'out-of-stock' | 'blue' | 'green' | 'red' | 'amber' | 'gray'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClass: Record<BadgeVariant, string> = {
  in: 'badge badge-in',
  out: 'badge badge-out',
  'low-stock': 'badge badge-amber',
  'in-stock': 'badge badge-green',
  'out-of-stock': 'badge badge-red',
  blue: 'badge badge-blue',
  green: 'badge badge-green',
  red: 'badge badge-red',
  amber: 'badge badge-amber',
  gray: 'badge badge-gray',
}

export function Badge({ variant = 'gray', className = '', ...props }: BadgeProps) {
  return <span className={`${variantClass[variant]} ${className}`.trim()} {...props} />
}
