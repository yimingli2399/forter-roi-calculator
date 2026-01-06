'use client'

import { useState, useEffect } from 'react'
import InputField from './InputField'
import { getTranslation, type Language } from '@/lib/utils/translations'
import type { ScenarioInputs as ScenarioInputsType } from '@/lib/utils/calculations'

interface ScenarioInputsProps {
  scenario: 's1' | 's2'
  inputs: ScenarioInputsType
  onChange: (inputs: ScenarioInputsType) => void
  lang: Language
  diffFields?: Set<string>
  hiddenFields?: Set<string>
  onHiddenFieldsChange?: (fields: Set<string>) => void
  showAllHidden?: boolean
  comments?: { [fieldId: string]: string }
  onCommentChange?: (fieldId: string, comment: string) => void
}

export default function ScenarioInputs({
  scenario,
  inputs,
  onChange,
  lang,
  diffFields = new Set(),
  hiddenFields = new Set(),
  onHiddenFieldsChange,
  showAllHidden = false,
  comments,
  onCommentChange,
}: ScenarioInputsProps) {
  const t = getTranslation(lang)
  const scenarioPrefix = scenario === 's1' ? 's1' : 's2'
  const [localHiddenFields, setLocalHiddenFields] = useState<Set<string>>(hiddenFields)

  useEffect(() => {
    setLocalHiddenFields(hiddenFields)
  }, [hiddenFields])

  useEffect(() => {
    if (showAllHidden) {
      setLocalHiddenFields(new Set())
      onHiddenFieldsChange?.(new Set())
    }
  }, [showAllHidden, onHiddenFieldsChange])

  const updateField = (field: keyof ScenarioInputsType, value: any) => {
    onChange({ ...inputs, [field]: value })
  }

  const toggleHidden = (field: string, hidden: boolean) => {
    const fieldId = `${scenarioPrefix}_${field}`
    const newHiddenFields = new Set(localHiddenFields)
    if (hidden) {
      newHiddenFields.add(fieldId)
    } else {
      newHiddenFields.delete(fieldId)
    }
    setLocalHiddenFields(newHiddenFields)
    onHiddenFieldsChange?.(newHiddenFields)
  }

  const isFieldHidden = (field: string) => {
    return localHiddenFields.has(`${scenarioPrefix}_${field}`)
  }

  return (
    <div className={`p-4 border rounded-lg ${scenario === 's1' ? 'scenario-header-s1' : 'scenario-header-s2'}`}>
      <div className="flex items-center justify-between">
        <h3
          className="subsection-title mt-0"
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            const newName = e.target.textContent || inputs.name
            if (newName !== inputs.name) {
              updateField('name', newName)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
        >
          {inputs.name}
        </h3>
      </div>
      <div className="space-y-4">
        <InputField
          id={`${scenarioPrefix}_preAuthDecline`}
          label={t.preAuthDecline}
          value={inputs.preAuthDecline}
          onChange={(v) => updateField('preAuthDecline', v)}
          isPercentage
          step={0.01}
          comment={comments?.[`${scenarioPrefix}_preAuthDecline`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_preAuthDecline`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('preAuthDecline')}
          onHideChange={(hidden) => toggleHidden('preAuthDecline', hidden)}
          diffHighlight={diffFields.has('preAuthDecline')}
        />
        <InputField
          id={`${scenarioPrefix}_postAuthAuto`}
          label={t.postAuthAuto}
          value={inputs.postAuthAuto}
          onChange={(v) => updateField('postAuthAuto', v)}
          isPercentage
          comment={comments?.[`${scenarioPrefix}_postAuthAuto`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_postAuthAuto`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('postAuthAuto')}
          onHideChange={(hidden) => toggleHidden('postAuthAuto', hidden)}
          diffHighlight={diffFields.has('postAuthAuto')}
        />
        <InputField
          id={`${scenarioPrefix}_postAuthManual`}
          label={t.postAuthManual}
          value={inputs.postAuthManual}
          onChange={(v) => updateField('postAuthManual', v)}
          isPercentage
          comment={comments?.[`${scenarioPrefix}_postAuthManual`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_postAuthManual`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('postAuthManual')}
          onHideChange={(hidden) => toggleHidden('postAuthManual', hidden)}
          diffHighlight={diffFields.has('postAuthManual')}
        />
        <InputField
          id={`${scenarioPrefix}_3dsUsage`}
          label={t.threeDSUsage}
          value={inputs['3dsUsage']}
          onChange={(v) => updateField('3dsUsage', v)}
          isPercentage
          step={1}
          comment={comments?.[`${scenarioPrefix}_3dsUsage`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_3dsUsage`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('3dsUsage')}
          onHideChange={(hidden) => toggleHidden('3dsUsage', hidden)}
          diffHighlight={diffFields.has('3dsUsage')}
        />
        <InputField
          id={`${scenarioPrefix}_3dsError`}
          label={t.threeDSError}
          value={inputs['3dsError']}
          onChange={(v) => updateField('3dsError', v)}
          isPercentage
          step={0.01}
          comment={comments?.[`${scenarioPrefix}_3dsError`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_3dsError`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('3dsError')}
          onHideChange={(hidden) => toggleHidden('3dsError', hidden)}
          diffHighlight={diffFields.has('3dsError')}
        />
        <InputField
          id={`${scenarioPrefix}_authRate`}
          label={t.authRate}
          value={inputs.authRate}
          onChange={(v) => updateField('authRate', v)}
          isPercentage
          comment={comments?.[`${scenarioPrefix}_authRate`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_authRate`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('authRate')}
          onHideChange={(hidden) => toggleHidden('authRate', hidden)}
          diffHighlight={diffFields.has('authRate')}
        />
        <InputField
          id={`${scenarioPrefix}_chargebackRate`}
          label={t.chargebackRate}
          value={inputs.chargebackRate}
          onChange={(v) => updateField('chargebackRate', v)}
          isPercentage
          step={0.0001}
          comment={comments?.[`${scenarioPrefix}_chargebackRate`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_chargebackRate`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('chargebackRate')}
          onHideChange={(hidden) => toggleHidden('chargebackRate', hidden)}
          diffHighlight={diffFields.has('chargebackRate')}
        />
        <InputField
          id={`${scenarioPrefix}_fixedFee`}
          label={t.fixedFee}
          value={inputs.fixedFee}
          onChange={(v) => updateField('fixedFee', v)}
          comment={comments?.[`${scenarioPrefix}_fixedFee`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_fixedFee`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('fixedFee')}
          onHideChange={(hidden) => toggleHidden('fixedFee', hidden)}
          diffHighlight={diffFields.has('fixedFee')}
        />
        <InputField
          id={`${scenarioPrefix}_percentageFee`}
          label={t.percentageFee}
          value={inputs.percentageFee}
          onChange={(v) => updateField('percentageFee', v)}
          isPercentage
          step={0.01}
          comment={comments?.[`${scenarioPrefix}_percentageFee`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_percentageFee`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('percentageFee')}
          onHideChange={(hidden) => toggleHidden('percentageFee', hidden)}
          diffHighlight={diffFields.has('percentageFee')}
          additionalCheckbox={{
            id: `${scenarioPrefix}_applyToNon3DS`,
            label: t.applyToNon3DS,
            checked: inputs.applyToNon3DS,
            onChange: (checked) => updateField('applyToNon3DS', checked),
          }}
        />
        <InputField
          id={`${scenarioPrefix}_perTransactionCost`}
          label={t.perTransactionCost}
          value={inputs.perTransactionCost}
          onChange={(v) => updateField('perTransactionCost', v)}
          comment={comments?.[`${scenarioPrefix}_perTransactionCost`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_perTransactionCost`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('perTransactionCost')}
          onHideChange={(hidden) => toggleHidden('perTransactionCost', hidden)}
          diffHighlight={diffFields.has('perTransactionCost')}
        />
        <InputField
          id={`${scenarioPrefix}_manualReviewCost`}
          label={t.manualReviewCost}
          value={inputs.manualReviewCost}
          onChange={(v) => updateField('manualReviewCost', v)}
          comment={comments?.[`${scenarioPrefix}_manualReviewCost`] || ''}
          onCommentChange={(comment) => onCommentChange?.(`${scenarioPrefix}_manualReviewCost`, comment)}
          showHideCheckbox
          isHidden={isFieldHidden('manualReviewCost')}
          onHideChange={(hidden) => toggleHidden('manualReviewCost', hidden)}
          diffHighlight={diffFields.has('manualReviewCost')}
        />
      </div>
    </div>
  )
}

