import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-accent text-accent-foreground hover:bg-orange-600 focus:ring-accent rounded-full': variant === 'primary',
            'bg-dark text-dark-foreground hover:bg-neutral-800 focus:ring-dark rounded-full': variant === 'secondary',
            'border-2 border-warm-gray text-warm-gray hover:bg-warm-gray hover:text-white focus:ring-warm-gray rounded-full': variant === 'outline',
            'text-warm-gray hover:bg-muted rounded-lg': variant === 'ghost',
            'bg-destructive text-white hover:bg-red-700 focus:ring-destructive rounded-full': variant === 'destructive',
          },
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
export default Button
