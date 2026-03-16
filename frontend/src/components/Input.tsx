import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className = '', id, ...props }: InputProps) {
  const inputId = id ?? `inp-${Math.random().toString(36).slice(2)}`
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <input id={inputId} className={`inp ${className}`.trim()} {...props} />
      {hint && <span className="input-hint">{hint}</span>}
    </div>
  )
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: React.ReactNode
}

export function Select({ label, className = '', id, children, ...props }: SelectProps) {
  const selectId = id ?? `sel-${Math.random().toString(36).slice(2)}`
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={selectId} className="input-label">
          {label}
        </label>
      )}
      <select id={selectId} className={`inp ${className}`.trim()} {...props}>
        {children}
      </select>
    </div>
  )
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className = '', id, ...props }: TextareaProps) {
  const textareaId = id ?? `ta-${Math.random().toString(36).slice(2)}`
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={textareaId} className="input-label">
          {label}
        </label>
      )}
      <textarea id={textareaId} className={`inp ${className}`.trim()} {...props} />
    </div>
  )
}
