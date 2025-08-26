'use client'

import { useState } from 'react'

interface TooltipProps {
  children: React.ReactNode
  content: string
  className?: string
}

export default function Tooltip({ children, content, className = '' }: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    })
    setShowTooltip(true)
  }
  
  return (
    <>
      <div 
        className={`relative inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </div>
      {showTooltip && (
        <div 
          className="fixed z-50 px-2 py-1 text-xs text-white bg-gray-900 border border-white rounded shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
        </div>
      )}
    </>
  )
}
