import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-3 rounded-lg border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors',
            error ? 'border-destructive' : 'border-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
