import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

export function Button({ variant = 'primary', size, className = '', children, ...props }: ButtonProps) {
  const base = 'btn'
  const variantClass =
    variant === 'primary' ? 'btn-primary' :
    variant === 'secondary' ? 'btn-secondary' :
    variant === 'danger' ? 'btn-danger' : 'btn-ghost'
  const sizeClass = size === 'sm' ? 'btn-sm' : ''
  return (
    <button type="button" className={`${base} ${variantClass} ${sizeClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
