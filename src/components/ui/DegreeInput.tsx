'use client';

import { useState, useEffect, useRef } from 'react';

interface DegreeInputProps {
  value: number;
  onChange: (value: number) => void;
  onClick?: () => void; // Optional click handler for realization
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

/**
 * Reusable degree input component with +/- buttons
 * Used for attributes, souffrances, and competences
 */
export default function DegreeInput({
  value,
  onChange,
  onClick,
  min = -50,
  max = 50,
  size = 'md',
  disabled = false,
  className = '',
  inputClassName = '',
  buttonClassName = '',
}: DegreeInputProps) {
  const [localValue, setLocalValue] = useState(value.toString());
  const [showButtons, setShowButtons] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    const numValue = parseInt(newValue) || 0;
    const clampedValue = Math.max(min, Math.min(max, numValue));
    onChange(clampedValue);
  };

  const handleInputBlur = () => {
    const numValue = parseInt(localValue) || 0;
    const clampedValue = Math.max(min, Math.min(max, numValue));
    setLocalValue(clampedValue.toString());
    onChange(clampedValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + 1);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - 1);
    onChange(newValue);
  };

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowButtons(true);
  };

  const handleMouseLeave = () => {
    // Set a delay before hiding (500ms)
    hideTimeoutRef.current = setTimeout(() => {
      setShowButtons(false);
      hideTimeoutRef.current = null;
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Size configurations
  const sizeConfig = {
    sm: {
      input: 'w-5 px-0.5 py-0.5 text-[0.7rem]',
      button: 'text-[0.65rem] px-0.5',
      height: 'h-[calc(0.875rem+0.5rem+4px)]',
    },
    md: {
      input: 'w-7 px-1 py-1 text-sm',
      button: 'text-xs px-1',
      height: 'h-[calc(1.5rem+0.5rem)]',
    },
    lg: {
      input: 'w-10 px-2 py-2 text-base',
      button: 'text-sm px-2',
      height: 'h-[calc(2rem+0.5rem)]',
    },
  };

  const config = sizeConfig[size];
  const isAtMin = value <= min;
  const isAtMax = value >= max;

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <input
        type="number"
        min={min}
        max={max}
        value={localValue}
        onChange={disabled ? undefined : handleInputChange}
        onClick={disabled && onClick ? onClick : undefined}
        disabled={disabled}
        readOnly={disabled && !onClick}
        className={`${config.input} bg-parchment-aged border border-border-dark rounded text-text-dark font-medieval font-semibold text-center transition-all duration-300 focus:outline-none focus:border-gold-glow focus:bg-parchment-light ${
          disabled && onClick ? 'cursor-pointer hover:opacity-80' : disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${inputClassName}`}
        style={{
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.target.style.boxShadow = '0 0 10px #ffebc6, inset 0 2px 4px rgba(0, 0, 0, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.1)';
          if (!disabled) {
            handleInputBlur();
          }
        }}
      />
      {/* Invisible hover area that extends backwards for easier access */}
      {showButtons && (
        <div 
          className="absolute right-full top-0 h-full w-1"
          style={{ marginRight: '-4px', zIndex: 1 }}
        />
      )}
      <div 
        className={`absolute right-full top-[-2px] flex flex-col ${config.height} transition-opacity duration-200 ${
          showButtons ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ 
          marginRight: '-2px',
          padding: '2px 0 2px 2px',
          zIndex: 2,
        }}
      >
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || isAtMax}
          className={`${config.button} bg-parchment-aged border border-border-dark rounded text-text-dark font-medieval font-bold transition-all duration-300 hover:bg-hover-bg hover:border-gold-glow flex-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
          style={{
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2), inset 0 0 0 1px #ceb68d',
            borderBottom: 'none',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            minHeight: size === 'sm' ? '0.6rem' : '0',
          }}
        >
          +
        </button>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || isAtMin}
          className={`${config.button} bg-parchment-aged border border-border-dark rounded text-text-dark font-medieval font-bold transition-all duration-300 hover:bg-hover-bg hover:border-gold-glow flex-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
          style={{
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2), inset 0 0 0 1px #ceb68d',
            borderTop: 'none',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            minHeight: size === 'sm' ? '0.6rem' : '0',
          }}
        >
          −
        </button>
      </div>
    </div>
  );
}

