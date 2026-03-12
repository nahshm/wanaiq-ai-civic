import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeHintProps {
    show: boolean
    className?: string
}

export const SwipeHint = ({ show, className }: SwipeHintProps) => {
    const [visible, setVisible] = useState(show)
    const [animating, setAnimating] = useState(false)

    useEffect(() => {
        if (show) {
            setVisible(true)
            setAnimating(true)
            
            // Hide after 3 seconds
            const timer = setTimeout(() => {
                setAnimating(false)
                setTimeout(() => setVisible(false), 300)
            }, 3000)

            return () => clearTimeout(timer)
        }
    }, [show])

    if (!visible) return null

    return (
        <div 
            className={cn(
                "fixed bottom-24 left-1/2 -translate-x-1/2 z-50",
                "flex flex-col items-center gap-2",
                "transition-opacity duration-300",
                animating ? "opacity-100" : "opacity-0",
                className
            )}
        >
            {/* Animated arrows */}
            <div className="flex flex-col items-center animate-bounce">
                <ChevronUp className="w-6 h-6 text-white/80 -mb-3" />
                <ChevronUp className="w-6 h-6 text-white/60 -mb-3" />
                <ChevronUp className="w-6 h-6 text-white/40" />
            </div>
            
            {/* Text hint */}
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-white/90 text-sm font-medium">
                    Swipe up for more
                </span>
            </div>
        </div>
    )
}
