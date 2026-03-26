import { cn } from '@/lib/utils'

interface ScoreBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-600 border-green-200 bg-green-50'
    if (s >= 60) return 'text-amber-600 border-amber-200 bg-amber-50'
    return 'text-red-600 border-red-200 bg-red-50'
  }

  return (
    <div
      className={cn(
        'rounded-full border-2 flex items-center justify-center font-headline font-bold',
        getColor(score),
        {
          'w-10 h-10 text-sm': size === 'sm',
          'w-14 h-14 text-lg': size === 'md',
          'w-20 h-20 text-2xl': size === 'lg',
        }
      )}
    >
      {score}
    </div>
  )
}
