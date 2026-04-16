import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  Select as SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'> & {
  label?: string
  hint?: string
  error?: boolean
}>(({ label, hint, error, className = '', id, ...props }, ref) => {
  const inputId = id ?? `inp-${Math.random().toString(36).slice(2)}`
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium leading-none whitespace-nowrap peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        data-slot="input"
        className={cn(
          'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-all duration-200',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-transparent',
          'hover:border-input/80 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      {hint && (
        <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
          {hint}
        </p>
      )}
    </div>
  )
})
Input.displayName = 'Input'

interface SelectProps {
  label?: string
  value?: string
  onChange?: (e: { target: { value: string } }) => void
  onValueChange?: (value: string) => void
  children?: React.ReactNode
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

function getOptionLabel(children: React.ReactNode): string {
  if (children == null) return ''
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(getOptionLabel).join('')
  if (React.isValidElement(children) && children.props?.children != null)
    return getOptionLabel(children.props.children)
  return ''
}

function Select({
  label,
  value = '',
  onChange,
  onValueChange,
  children,
  placeholder = 'Select...',
  required,
  disabled,
  className,
  id: idProp,
}: SelectProps) {
  const id = idProp ?? `sel-${Math.random().toString(36).slice(2)}`
  const EMPTY = '__empty__'
  const options = React.Children.toArray(children)
    .filter(
      (child): child is React.ReactElement<{ value?: string; children?: React.ReactNode }> =>
        React.isValidElement(child) && (child.type === 'option' || (child.type as string) === 'option')
    )
    .map((child) => {
      const v = child.props.value
      const val = v === undefined || v === null ? '' : String(v)
      const labelText = getOptionLabel(child.props.children)
      return {
        value: val === '' ? EMPTY : val,
        rawValue: val,
        label: labelText.trim() || val || placeholder,
      }
    })

  const handleValueChange = (v: string) => {
    const out = v === EMPTY ? '' : v
    onValueChange?.(out)
    onChange?.({ target: { value: out } })
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium leading-none whitespace-nowrap">
          {label}
        </label>
      )}
      <SelectRoot
        value={value === '' ? EMPTY : value || undefined}
        onValueChange={handleValueChange}
        required={required}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className={cn(
            'h-10 w-full justify-between font-normal transition-all duration-200',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </div>
  )
}
Select.displayName = 'Select'

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'> & { label?: string }
>(({ label, className = '', id, ...props }, ref) => {
  const textareaId = id ?? `ta-${Math.random().toString(36).slice(2)}`
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium leading-none whitespace-nowrap">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={cn(
          'flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    </div>
  )
})
Textarea.displayName = 'Textarea'

export { Input, Select, Textarea }
