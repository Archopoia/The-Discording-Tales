'use client';

import { useState, useEffect, useRef } from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
  level?: number;
  isFull?: boolean; // When marks reach 100% (100 marks for video game), show pulsing/shining effect
  onClick?: () => void; // Click handler for realization
  showRealizeLabel?: boolean; // Show "RÉALISER" instead of level name when full
}

/**
 * Reusable progress bar component for marks display
 * Used for Souffrances and Competences marks
 */
export default function ProgressBar({
  value,
  max = 100,
  height = 'md',
  className = '',
  label,
  isFull = false, // When marks reach 100% (100 marks for video game), show pulsing/shining effect
  onClick,
  showRealizeLabel = false, // Show "RÉALISER" instead of level name when full
}: ProgressBarProps) {
  const [isRealizing, setIsRealizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [charPositions, setCharPositions] = useState<number[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const percentage = Math.min((value / max) * 100, 100);
  const percentageRounded = Math.round(percentage);
  
  // Determine the label to show
  // On hover (if not at 100%), show percentage instead of level name
  const displayLabel = isHovered && !isFull
    ? `${percentageRounded}%`
    : (showRealizeLabel && isFull ? 'RÉALISER' : (label || ''));
  const isClickable = isFull && onClick;
  
  // Reset realizing state when value changes (after realization clears marks)
  useEffect(() => {
    if (!isFull && isRealizing) {
      setIsRealizing(false);
    }
  }, [value, isFull, isRealizing]);

  // Measure actual character positions after render
  useEffect(() => {
    if (!displayLabel) {
      setCharPositions([]);
      charRefs.current = [];
      return;
    }
    
    // Reset char refs array when label changes
    charRefs.current = new Array(displayLabel.length).fill(null);
    
    let measurementAttempts = 0;
    const maxAttempts = 10;
    
    const measurePositions = () => {
      measurementAttempts++;
      
      if (containerRef.current && charRefs.current.length === displayLabel.length) {
        // Check if we have all refs ready
        const validRefs = charRefs.current.filter(ref => ref !== null);
        
        if (validRefs.length === displayLabel.length) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const containerLeft = containerRect.left;
          
          const positions: number[] = [];
          let allValid = true;
          
          charRefs.current.forEach((charRef) => {
            if (charRef) {
              const charRect = charRef.getBoundingClientRect();
              // Position relative to container (0 = left edge of container)
              const relativePosition = charRect.left - containerLeft;
              positions.push(relativePosition);
              if (relativePosition < 0 || relativePosition > containerRect.width) {
                allValid = false;
              }
            } else {
              allValid = false;
            }
          });
          
          if (allValid && positions.length === displayLabel.length) {
            setCharPositions(positions);
            setContainerWidth(containerRect.width);
            return; // Success, stop trying
          }
        }
      }
      
      // If measurement failed and we haven't exceeded max attempts, try again
      if (measurementAttempts < maxAttempts) {
        requestAnimationFrame(() => {
          setTimeout(measurePositions, 50);
        });
      }
    };
    
    // Start measurement after a delay to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(measurePositions, 50);
      });
    });
  }, [displayLabel]); // Re-measure when label changes

  // Re-measure on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && displayLabel && charRefs.current.length === displayLabel.length) {
        const allRefsReady = charRefs.current.every(ref => ref !== null);
        
        if (allRefsReady) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const containerLeft = containerRect.left;
          
          const positions: number[] = [];
          charRefs.current.forEach((charRef) => {
            if (charRef) {
              const charRect = charRef.getBoundingClientRect();
              const relativePosition = charRect.left - containerLeft;
              positions.push(relativePosition);
            }
          });
          
          if (positions.length === displayLabel.length) {
            setCharPositions(positions);
            setContainerWidth(containerRect.width);
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayLabel]);

  const heightConfig = {
    sm: 'h-[0.8rem]', // 0.75rem * 1.1 (10% increase)
    md: 'h-[1.125rem]', // 4.5 (1.5 * 3)
    lg: 'h-6', // 6 (1.5 * 4)
  };

  // Handle click - animate color change then call onClick
  const handleClick = (e: React.MouseEvent) => {
    if (!isClickable || !onClick) return;
    
    e.stopPropagation();
    setIsRealizing(true);
    
    // Call the onClick handler after the blink animation completes
    setTimeout(() => {
      onClick();
      // Keep the pulsating animation going for a bit longer, then reset
      setTimeout(() => {
        setIsRealizing(false);
      }, 1500); // Keep pulsating for 1.5 seconds after realization
    }, 400); // Wait for blink animation to complete (0.4s)
  };

  // Determine fill color - only change to bluish-white when clicked
  const fillColor = isRealizing
    ? 'bg-gradient-to-r from-blue-300 via-blue-200 to-blue-100' // Bluish-white when clicked
    : 'bg-gradient-to-r from-red-theme to-yellow-theme'; // Normal gradient

  return (
    <div 
      ref={containerRef}
      className={`w-full ${heightConfig[height]} bg-parchment-dark border border-border-dark rounded relative ${className} ${
        isFull ? 'progress-bar-container-pulse' : 'overflow-hidden'
      } ${isClickable ? 'cursor-pointer' : ''}`}
      style={isFull ? { overflow: 'visible', position: 'relative', zIndex: 1 } : {}}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`h-full transition-all duration-200 relative ${fillColor} ${
          isFull ? 'progress-bar-fill-pulse' : ''
        } ${isRealizing ? 'progress-bar-realizing' : ''}`}
        style={{
          width: `${percentage}%`,
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
        }}
      />
      {displayLabel && (
        <span 
          className="absolute inset-0 flex items-center justify-center text-[0.55rem] font-medieval font-semibold whitespace-nowrap pointer-events-none"
          style={{ 
            fontVariant: 'small-caps',
            textTransform: 'uppercase',
          }}
        >
          {displayLabel.split('').map((char, index) => {
            // Calculate if fill has reached this character
            // Fill width in pixels
            const fillWidth = (containerWidth * percentage) / 100;
            
            // Get this character's position (if measured)
            const charPosition = charPositions[index];
            
            // Check if fill has reached this character's position
            // We need valid measurements and check if fill has reached the character
            const hasValidMeasurements = charPositions.length === displayLabel.length && 
                                       containerWidth > 0 && 
                                       charPositions.every(p => p !== undefined && p >= 0 && p <= containerWidth);
            
            let isCovered = false;
            if (hasValidMeasurements && charPosition !== undefined) {
              // Check if fill has reached this character's position
              // Fill starts from left (0), so we check if fillWidth has reached or passed the character's left edge
              // Use a small threshold (1px) to account for sub-pixel rendering
              isCovered = fillWidth >= (charPosition - 1);
            } else if (containerWidth > 0) {
              // Fallback: use percentage-based estimation if measurements aren't ready
              // This ensures it works even before measurements complete
              const charPositionPercent = (index + 0.5) / displayLabel.length;
              isCovered = (percentage / 100) >= charPositionPercent;
            }
            
            return (
              <span
                key={index}
                ref={(el) => {
                  charRefs.current[index] = el;
                }}
                style={{
                  color: isCovered ? '#ffebc6' : '#4d3000', // Lighter (cream) when covered, darker when not
                  textShadow: isCovered 
                    ? '1px 1px 2px rgba(0, 0, 0, 0.8)' 
                    : '1px 1px 2px rgba(255, 255, 255, 0.5)',
                  transition: 'color 0.2s ease, text-shadow 0.2s ease',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </span>
      )}
    </div>
  );
}

