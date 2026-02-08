'use client';

import { ReactNode, useRef, useEffect, useState } from 'react';

interface ExpandableSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  title: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  arrowPosition?: 'left' | 'right'; // Position of the arrow indicator
  headerActions?: ReactNode; // Actions rendered outside the button (e.g., inputs, buttons)
  headerFooter?: ReactNode; // Content rendered right after header (e.g., progress bars)
}

/**
 * Reusable expandable section component with smooth animations
 * Used for Actions and Competences
 */
export default function ExpandableSection({
  isExpanded,
  onToggle,
  title,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  arrowPosition = 'left',
  headerActions,
  headerFooter,
}: ExpandableSectionProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const visibleContentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  const [measurementWidth, setMeasurementWidth] = useState<string>('100%');

  // Update measurement width when container is available
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        if (width > 0) {
          setMeasurementWidth(`${width}px`);
        }
      }
    };
    
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Measure content height and handle remeasurement when expanded state changes
  useEffect(() => {
    if (!contentRef.current || !containerRef.current) return;

    const updateHeight = () => {
      if (!containerRef.current) return;
      
      let height = 0;
      
      // Try measuring from hidden div first
      if (contentRef.current) {
        const parentRect = containerRef.current.getBoundingClientRect();
        const parentWidth = parentRect.width;
        
        if (parentWidth > 0) {
          const computedStyle = window.getComputedStyle(containerRef.current);
          contentRef.current.style.width = `${parentWidth}px`;
          contentRef.current.style.paddingLeft = computedStyle.paddingLeft;
          contentRef.current.style.paddingRight = computedStyle.paddingRight;
        }
        
        contentRef.current.offsetHeight; // Force reflow
        const scrollHeight = contentRef.current.scrollHeight;
        height = scrollHeight + 4;
      }
      
      // Fallback: if hidden div didn't work, try measuring visible content
      if ((height === 0 || height < 10) && visibleContentRef.current && isExpanded) {
        const visibleScrollHeight = visibleContentRef.current.scrollHeight;
        if (visibleScrollHeight > 0) {
          height = visibleScrollHeight + 4;
        }
      }
      
      if (height > 0) {
        setContentHeight((prev) => {
          if (prev !== height) {
            return height;
          }
          return prev;
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    // Track if we've already observed visible content to avoid duplicate observations
    let hasObservedVisibleContent = false;
    
    // Wait for visible content ref to be available, then observe it
    const observeVisibleContent = () => {
      if (visibleContentRef.current && isExpanded && !hasObservedVisibleContent) {
        try {
          resizeObserver.observe(visibleContentRef.current);
          hasObservedVisibleContent = true;
        } catch (e) {
          // Already observing, ignore
        }
      }
    };

    // Initial measurement - always run when isExpanded is true
    if (isExpanded) {
      // Immediate measurement
      updateHeight();
      
      // Then multiple attempts to catch delayed renders (especially on remount)
      let rafId1: number | null = null;
      let rafId2: number | null = null;
      let rafId3: number | null = null;
      let timeoutId1: NodeJS.Timeout | null = null;
      let timeoutId2: NodeJS.Timeout | null = null;
      let timeoutId3: NodeJS.Timeout | null = null;
      let timeoutId4: NodeJS.Timeout | null = null;

      // Triple-RAF for remount cases where parent might not be laid out yet
      rafId1 = requestAnimationFrame(() => {
        updateHeight();
        observeVisibleContent(); // Try to observe visible content after first RAF
        rafId2 = requestAnimationFrame(() => {
          updateHeight();
          observeVisibleContent();
          rafId3 = requestAnimationFrame(() => {
            updateHeight();
            observeVisibleContent();
            // Multiple delayed checks to catch late renders
            timeoutId1 = setTimeout(() => {
              updateHeight();
              observeVisibleContent();
            }, 10);
            timeoutId2 = setTimeout(() => {
              updateHeight();
              observeVisibleContent();
            }, 50);
            timeoutId3 = setTimeout(() => {
              updateHeight();
              observeVisibleContent();
            }, 150);
            timeoutId4 = setTimeout(() => {
              updateHeight();
              observeVisibleContent();
            }, 300);
          });
        });
      });
      
      return () => {
        if (rafId1 !== null) cancelAnimationFrame(rafId1);
        if (rafId2 !== null) cancelAnimationFrame(rafId2);
        if (rafId3 !== null) cancelAnimationFrame(rafId3);
        if (timeoutId1 !== null) clearTimeout(timeoutId1);
        if (timeoutId2 !== null) clearTimeout(timeoutId2);
        if (timeoutId3 !== null) clearTimeout(timeoutId3);
        if (timeoutId4 !== null) clearTimeout(timeoutId4);
        resizeObserver.disconnect();
      };
    } else {
      // Still measure when collapsed (in case it changes later)
      updateHeight();
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [children, isExpanded]);

  // If expanded but not yet measured, allow natural height rendering until measurement completes
  // This fixes the issue where remounting with isExpanded=true shows no content
  const needsMeasurement = isExpanded && contentHeight === 0;
  const maxHeightValue = isExpanded 
    ? (needsMeasurement ? 'none' : `${contentHeight}px`)
    : '0px';
  const opacityValue = isExpanded ? 1 : 0;

  return (
    <div ref={containerRef} className={className}>
      <div className={`flex items-center gap-2 ${headerClassName}`}>
        <button
          onClick={onToggle}
          className="flex-1 text-left font-medieval font-semibold text-text-dark transition-colors duration-300 hover:text-red-theme"
        >
          <span className={`flex items-center gap-1 ${arrowPosition === 'right' ? 'justify-between' : ''}`}>
            {arrowPosition === 'left' && (
              <span 
                className="inline-block transition-transform duration-300"
                style={{ 
                  transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  marginLeft: '-0.5rem'
                }}
              >
                ▼
              </span>
            )}
            {title}
            {arrowPosition === 'right' && (
              <span 
                className="inline-block transition-transform duration-300 flex-shrink-0"
                style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              >
                ▼
              </span>
            )}
          </span>
        </button>
        {headerActions && (
          <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
            {headerActions}
          </div>
        )}
      </div>
      
      {/* Header footer - always visible, rendered right after header */}
      {headerFooter && (
        <div className="mt-1">
          {headerFooter}
        </div>
      )}
      
      {/* Hidden content for measurement */}
      <div
        ref={contentRef}
        className={`${contentClassName}`}
        style={{ 
          height: 'auto', 
          visibility: 'hidden', 
          position: 'absolute', 
          top: '0',
          left: '0',
          width: measurementWidth,
          paddingBottom: '4px', // Extra buffer for bottom spacing
          boxSizing: 'border-box',
          pointerEvents: 'none',
          zIndex: -1,
          opacity: 0,
        }}
        aria-hidden="true"
      >
        {children}
      </div>
      
      {/* Animated content container */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: maxHeightValue,
          opacity: opacityValue,
          transition: needsMeasurement 
            ? 'opacity 0s ease-in-out'  // No maxHeight transition while measuring
            : 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
        }}
      >
        <div 
          ref={visibleContentRef}
          className={contentClassName}
          style={{
            transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
            transition: 'transform 0.3s ease-in-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

