import { cn } from "@/lib/utils"
import { Zap } from "lucide-react"

interface DailLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
}

export function DailLogo({ size = "md", className, showText = true }: DailLogoProps) {
  const sizes = {
    sm: {
      container: "w-8 h-8",
      text: "text-base",
      spacing: "gap-2",
      icon: "w-4 h-4",
      padding: "p-1.5"
    },
    md: {
      container: "w-10 h-10",
      text: "text-lg",
      spacing: "gap-2.5",
      icon: "w-5 h-5",
      padding: "p-2"
    },
    lg: {
      container: "w-12 h-12",
      text: "text-xl",
      spacing: "gap-3",
      icon: "w-6 h-6",
      padding: "p-2.5"
    },
    xl: {
      container: "w-14 h-14",
      text: "text-2xl",
      spacing: "gap-3",
      icon: "w-7 h-7",
      padding: "p-3"
    }
  }

  const currentSize = sizes[size]

  return (
    <div className={cn("flex items-center", currentSize.spacing, className)}>
      {/* Modern minimalist logo icon */}
      <div className={cn(
        "relative flex items-center justify-center",
        "bg-gradient-to-br from-blue-600 to-blue-700",
        "rounded-2xl shadow-sm",
        "transition-all duration-200 hover:shadow-md",
        currentSize.container,
        currentSize.padding
      )}>
        {/* Lightning bolt icon for electric company */}
        <Zap className={cn(
          "text-white fill-white",
          currentSize.icon
        )} />
      </div>

      {/* Company name - clean and simple */}
      {showText && (
        <span className={cn(
          "font-semibold text-gray-900 dark:text-white",
          currentSize.text
        )}>
          다일전기
        </span>
      )}
    </div>
  )
}

// Favicon version - simplified for small size
export function DailFavicon({ size = 32 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect width="32" height="32" rx="8" fill="url(#gradient)" />
      
      {/* Electric bolt */}
      <path 
        d="M10 8 L18 14 L14 14 L20 24 L12 18 L16 18 Z" 
        fill="white" 
        opacity="0.2"
      />
      
      {/* Text */}
      <text 
        x="16" 
        y="18" 
        textAnchor="middle" 
        fill="white" 
        fontSize="14" 
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        다일
      </text>
      
      <text 
        x="16" 
        y="26" 
        textAnchor="middle" 
        fill="#BFDBFE" 
        fontSize="7" 
        fontWeight="500"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        전기
      </text>
      
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  )
}