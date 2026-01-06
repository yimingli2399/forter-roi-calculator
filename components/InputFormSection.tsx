'use client'

import { useState, useEffect } from 'react'
import InputField from './InputField'
import ScenarioInputs from './ScenarioInputs'
import type { CalculationInputs, ScenarioInputs as ScenarioInputsType } from '@/lib/utils/calculations'
import type { Language } from '@/lib/utils/translations'
import { getTranslation, type Translations } from '@/lib/utils/translations'

interface InputFormSectionProps {
  inputs: CalculationInputs
  onInputsChange: (inputs: CalculationInputs) => void
  lang: Language
  t: ReturnType<typeof getTranslation>
}

const getComment = (comments: { [fieldId: string]: string } | undefined, fieldId: string): string => {
  return comments?.[fieldId] || ''
}

const updateComment = (
  comments: { [fieldId: string]: string } | undefined,
  fieldId: string,
  value: string
): { [fieldId: string]: string } => {
  const newComments = { ...(comments || {}) }
  if (value.trim()) {
    newComments[fieldId] = value
  } else {
    delete newComments[fieldId]
  }
  return newComments
}

export default function InputFormSection({
  inputs,
  onInputsChange,
  lang,
  t,
}: InputFormSectionProps) {
  const [retryRate, setRetryRate] = useState(inputs.retryRate)
  // Initialize hidden fields from saved data
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(
    new Set(inputs.hiddenFields || [])
  )
  const [hiddenCommonFields, setHiddenCommonFields] = useState<Set<string>>(
    new Set(inputs.hiddenCommonFields || [])
  )
  const [showAllHidden, setShowAllHidden] = useState(false)

  // Update hidden fields and retry rate when inputs change (e.g., when loading from database)
  useEffect(() => {
    setHiddenFields(new Set(inputs.hiddenFields || []))
    setHiddenCommonFields(new Set(inputs.hiddenCommonFields || []))
    setRetryRate(inputs.retryRate)
  }, [inputs.hiddenFields, inputs.hiddenCommonFields, inputs.retryRate])

  // Update hidden fields in inputs when they change
  const updateHiddenFields = (newHiddenFields: Set<string>) => {
    setHiddenFields(newHiddenFields)
    onInputsChange({
      ...inputs,
      hiddenFields: Array.from(newHiddenFields),
    })
  }

  const updateHiddenCommonFields = (newHiddenCommonFields: Set<string>) => {
    setHiddenCommonFields(newHiddenCommonFields)
    onInputsChange({
      ...inputs,
      hiddenCommonFields: Array.from(newHiddenCommonFields),
    })
  }

  const updateCommonField = (field: keyof CalculationInputs, value: any) => {
    onInputsChange({ ...inputs, [field]: value })
  }

  const updateScenario = (scenario: 's1' | 's2', scenarioInputs: ScenarioInputsType) => {
    onInputsChange({ ...inputs, [scenario]: scenarioInputs })
  }

  const updateScenarioName = (scenario: 's1' | 's2', name: string) => {
    onInputsChange({
      ...inputs,
      [scenario]: { ...inputs[scenario], name },
    })
  }

  // Check which fields differ between scenarios
  const getDiffFields = () => {
    const diffFields = new Set<string>()
    const fields: (keyof ScenarioInputsType)[] = [
      'preAuthDecline',
      'postAuthAuto',
      'postAuthManual',
      '3dsUsage',
      '3dsError',
      'authRate',
      'chargebackRate',
      'fixedFee',
      'percentageFee',
      'perTransactionCost',
      'manualReviewCost',
    ]

    fields.forEach((field) => {
      const s1Val = inputs.s1[field]
      const s2Val = inputs.s2[field]
      if (typeof s1Val === 'number' && typeof s2Val === 'number') {
        if (Math.abs(s1Val - s2Val) > 0.000001) {
          diffFields.add(field)
        }
      } else if (s1Val !== s2Val) {
        diffFields.add(field)
      }
    })

    return diffFields
  }

  const diffFields = getDiffFields()

  return (
    <div className="section-container">
      <h2 className="section-title">{t.assumptionsTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="md:col-span-2">
          <h3 className="subsection-title">{t.commonFactsTitle}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <InputField
              id="annualAttempts"
              label={t.annualAttempts}
              value={inputs.annualAttempts}
              onChange={(v) => updateCommonField('annualAttempts', v)}
              comment={getComment(inputs.comments, 'annualAttempts')}
              onCommentChange={(comment) => {
                onInputsChange({
                  ...inputs,
                  comments: updateComment(inputs.comments, 'annualAttempts', comment),
                })
              }}
            />
            <InputField
              id="atvSuccess"
              label={t.atvSuccess}
              value={inputs.atvSuccess}
              onChange={(v) => updateCommonField('atvSuccess', v)}
              comment={getComment(inputs.comments, 'atvSuccess')}
              onCommentChange={(comment) => {
                onInputsChange({
                  ...inputs,
                  comments: updateComment(inputs.comments, 'atvSuccess', comment),
                })
              }}
            />
            <InputField
              id="atvDecline"
              label={t.atvDecline}
              value={inputs.atvDecline}
              onChange={(v) => updateCommonField('atvDecline', v)}
              comment={getComment(inputs.comments, 'atvDecline')}
              onCommentChange={(comment) => {
                onInputsChange({
                  ...inputs,
                  comments: updateComment(inputs.comments, 'atvDecline', comment),
                })
              }}
            />
            <InputField
              id="threeDSCost"
              label={t.threeDSCost}
              value={inputs.threeDSCost}
              onChange={(v) => updateCommonField('threeDSCost', v)}
              comment={getComment(inputs.comments, 'threeDSCost')}
              onCommentChange={(comment) => {
                onInputsChange({
                  ...inputs,
                  comments: updateComment(inputs.comments, 'threeDSCost', comment),
                })
              }}
              showHideCheckbox
              isHidden={hiddenCommonFields.has('threeDSCost')}
              onHideChange={(hidden) => {
                const newHiddenFields = new Set(hiddenCommonFields)
                if (hidden) {
                  newHiddenFields.add('threeDSCost')
                } else {
                  newHiddenFields.delete('threeDSCost')
                }
                updateHiddenCommonFields(newHiddenFields)
              }}
            />
          </div>
        </div>
        <ScenarioInputs
          scenario="s1"
          inputs={inputs.s1}
          onChange={(s1) => updateScenario('s1', s1)}
          lang={lang}
          diffFields={diffFields}
          hiddenFields={hiddenFields}
          onHiddenFieldsChange={updateHiddenFields}
          showAllHidden={showAllHidden}
          comments={inputs.comments}
          onCommentChange={(fieldId, comment) => {
            onInputsChange({
              ...inputs,
              comments: updateComment(inputs.comments, fieldId, comment),
            })
          }}
        />
        <ScenarioInputs
          scenario="s2"
          inputs={inputs.s2}
          onChange={(s2) => updateScenario('s2', s2)}
          lang={lang}
          diffFields={diffFields}
          hiddenFields={hiddenFields}
          onHiddenFieldsChange={updateHiddenFields}
          showAllHidden={showAllHidden}
          comments={inputs.comments}
          onCommentChange={(fieldId, comment) => {
            onInputsChange({
              ...inputs,
              comments: updateComment(inputs.comments, fieldId, comment),
            })
          }}
        />
      </div>
      <div className="mt-6 input-group">
        <div className="flex justify-between items-center">
          <label htmlFor="retryRate" className="input-label">
            {t.retryRate}
          </label>
        </div>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            id="retryRate"
            min="0"
            max="100"
            step="5"
            value={retryRate}
            onChange={(e) => {
              const newValue = parseFloat(e.target.value)
              setRetryRate(newValue)
              updateCommonField('retryRate', newValue)
            }}
            className="w-full slider-track"
          />
          <span className="font-semibold text-gray-700 w-16 text-right">
            {retryRate.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="flex justify-center mt-6 mb-8 space-x-4">
        <button
          id="show-all-inputs-button"
          onClick={() => {
            setShowAllHidden(true)
            updateHiddenCommonFields(new Set())
            updateHiddenFields(new Set())
            setTimeout(() => setShowAllHidden(false), 100)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="bg-gray-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors text-lg shadow-md"
        >
          {t.showAllInputs}
        </button>
        <button
          id="calculate-button"
          onClick={() => {
            // Recalculate is automatic via useEffect
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors text-lg shadow-md"
        >
          {t.calculateButton}
        </button>
      </div>
    </div>
  )
}

