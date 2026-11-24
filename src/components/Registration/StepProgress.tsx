"use client"

import { Check } from "lucide-react"

interface StepProgressProps {
  currentStep: number
  totalSteps?: number
  stepLabels: string[]
  onStepClick?: (step: number) => void
  highestStepReached?: number
}

export function StepProgress({
  currentStep,
  stepLabels,
  onStepClick,
  highestStepReached = currentStep,
}: StepProgressProps) {
  return (
    <nav className="step-progress" aria-label="Registration Progress">
      <ol className="step-progress__list">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isClickable = onStepClick && stepNumber <= highestStepReached && stepNumber !== currentStep

          return (
            <li
              key={label}
              className={`step-progress__item ${
                isCurrent
                  ? "step-progress__item--current"
                  : isCompleted
                  ? "step-progress__item--completed"
                  : "step-progress__item--upcoming"
              }`}
              aria-current={isCurrent ? "step" : undefined}
            >
              <button
                type="button"
                className="step-progress__button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(stepNumber)}
                title={isClickable ? `Jump to Step ${stepNumber}: ${label}` : undefined}
              >
                <span className="step-progress__badge" aria-hidden="true">
                  {isCompleted ? <Check size={14} strokeWidth={2.6} /> : stepNumber}
                </span>
                <span className="step-progress__label">
                  <span className="step-progress__number-label">Step {stepNumber}</span>
                  <span className="step-progress__title">{label}</span>
                </span>
              </button>
              {index < stepLabels.length - 1 && (
                <div
                  className={`step-progress__connector ${
                    stepNumber < currentStep ? "step-progress__connector--active" : ""
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
