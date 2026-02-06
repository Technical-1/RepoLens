'use client'

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'glass' | 'stat'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', variant = 'default', hover = false, ...props }, ref) => {
    const baseClasses = 'rounded-xl border border-github-border/50'
    
    const variantClasses = {
      default: 'bg-github-card',
      glass: 'glass-card',
      stat: 'glass-card stat-card',
    }
    
    const hoverClasses = hover ? 'hover:bg-github-border/20 transition-colors' : ''
    
    const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`.trim()

    return (
      <div ref={ref} className={combinedClasses} {...props}>
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`p-6 border-b border-github-border/50 ${className}`} {...props}>
      {children}
    </div>
  )
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
  icon?: ReactNode
}

export function CardTitle({ children, icon, className = '', ...props }: CardTitleProps) {
  return (
    <h3 className={`text-xl font-semibold text-white flex items-center gap-2 ${className}`} {...props}>
      {icon && (
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-github-accent to-green-400" />
      )}
      {children}
    </h3>
  )
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div className={`p-4 border-t border-github-border/50 ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card

