'use client'

import { useState, useEffect, useRef } from 'react'
import { formatNumber, formatPercentage, deformatNumber } from '@/lib/utils/formatters'

interface InputFieldProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
  isPercentage?: boolean
  step?: number
  showComment?: boolean
  comment?: string
  onCommentChange?: (comment: string) => void
  showHideCheckbox?: boolean
  isHidden?: boolean
  onHideChange?: (hidden: boolean) => void
  diffHighlight?: boolean
  additionalCheckbox?: {
    id: string
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
  }
}

export default function InputField({
  id,
  label,
  value,
  onChange,
  isPercentage = false,
  step,
  showComment = true,
  comment = '',
  onCommentChange,
  showHideCheckbox = false,
  isHidden = false,
  onHideChange,
  diffHighlight = false,
  additionalCheckbox,
}: InputFieldProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showCommentField, setShowCommentField] = useState(!!comment && comment.trim() !== '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isFocused) {
      if (isPercentage) {
        setDisplayValue(formatPercentage(value))
      } else {
        setDisplayValue(formatNumber(value))
      }
    }
  }, [value, isPercentage, isFocused])

  // Update showCommentField when comment prop changes
  useEffect(() => {
    if (comment && comment.trim()) {
      setShowCommentField(true)
    }
    // Note: We don't automatically hide the field when comment is empty
    // to allow users to type new comments
  }, [comment])

  const handleFocus = () => {
    setIsFocused(true)
    setDisplayValue(value.toString())
    inputRef.current?.select()
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    const num = deformatNumber(e.target.value)
    onChange(num)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value)
  }

  return (
    <div className={`input-group ${isHidden ? 'hidden' : ''}`}>
      <div className="flex justify-between items-center">
        <label htmlFor={id} className="input-label">
          {label}
        </label>
        {showComment && (
          <svg
            className={`comment-icon w-5 h-5 text-gray-400 hover:text-blue-600 cursor-pointer ${
              showCommentField ? 'active' : ''
            }`}
            onClick={() => setShowCommentField(!showCommentField)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        id={id}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        inputMode="decimal"
        step={step}
        className={`input-field ${diffHighlight ? 'diff-highlight' : ''}`}
      />
      {showComment && showCommentField && (
        <textarea
          className="comment-textarea w-full mt-2 p-2 border rounded-md text-sm"
          placeholder="コメントを追加..."
          value={comment}
          onChange={(e) => onCommentChange?.(e.target.value)}
          onBlur={() => {
            if (!comment) {
              setShowCommentField(false)
            }
          }}
        />
      )}
      {(showHideCheckbox || additionalCheckbox) && (
        <div className="flex items-center mt-1">
          {showHideCheckbox && (
            <>
              <input
                type="checkbox"
                id={`hide_${id}`}
                className="h-4 w-4 text-gray-600"
                checked={isHidden}
                onChange={(e) => onHideChange?.(e.target.checked)}
              />
              <label htmlFor={`hide_${id}`} className="ml-1 text-xs text-gray-500">
                非表示
              </label>
            </>
          )}
          {additionalCheckbox && (
            <>
              <input
                type="checkbox"
                id={additionalCheckbox.id}
                className="h-4 w-4 text-gray-600 ml-4"
                checked={additionalCheckbox.checked}
                onChange={(e) => additionalCheckbox.onChange(e.target.checked)}
              />
              <label htmlFor={additionalCheckbox.id} className="ml-1 text-xs text-gray-500">
                {additionalCheckbox.label}
              </label>
            </>
          )}
        </div>
      )}
    </div>
  )
}

