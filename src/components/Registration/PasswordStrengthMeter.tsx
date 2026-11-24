"use client"

import { Check, X } from "lucide-react"

interface PasswordStrengthMeterProps {
  password: string
  confirmPassword?: string
  showConfirmCheck?: boolean
}

export function evaluatePasswordStrength(password: string): {
  score: number // 0 to 4
  label: "Too short" | "Weak" | "Fair" | "Good" | "Strong"
  hasMinLength: boolean
  hasNumber: boolean
  hasUpperOrSpecial: boolean
} {
  const hasMinLength = password.length >= 8
  const hasNumber = /\d/.test(password)
  const hasUpperOrSpecial = /[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)
  const hasLower = /[a-z]/.test(password)

  let score = 0
  if (password.length >= 6) score += 1
  if (hasMinLength) score += 1
  if (hasNumber && hasLower) score += 1
  if (hasUpperOrSpecial && hasMinLength) score += 1

  let label: "Too short" | "Weak" | "Fair" | "Good" | "Strong" = "Too short"
  if (score === 1) label = "Weak"
  else if (score === 2) label = "Fair"
  else if (score === 3) label = "Good"
  else if (score === 4) label = "Strong"

  return {
    score,
    label,
    hasMinLength,
    hasNumber,
    hasUpperOrSpecial,
  }
}

export function PasswordStrengthMeter({
  password,
  confirmPassword,
  showConfirmCheck = false,
}: PasswordStrengthMeterProps) {
  if (!password) return null

  const { score, label, hasMinLength, hasNumber, hasUpperOrSpecial } = evaluatePasswordStrength(password)
  const isMatch = confirmPassword !== undefined && confirmPassword.length > 0 && password === confirmPassword
  const isMismatch =
    confirmPassword !== undefined && confirmPassword.length > 0 && password !== confirmPassword

  const levelColor =
    score <= 1
      ? "var(--pw-weak, #d34537)"
      : score === 2
      ? "var(--pw-fair, #d9822b)"
      : score === 3
      ? "var(--pw-good, #488f7c)"
      : "var(--pw-strong, #20574c)"

  return (
    <div className="password-meter" aria-live="polite">
      <div className="password-meter__header">
        <span className="password-meter__title">Password Strength:</span>
        <span className="password-meter__status" style={{ color: levelColor }}>
          {label}
        </span>
      </div>

      <div className="password-meter__bar" role="progressbar" aria-valuenow={score * 25} aria-valuemin={0} aria-valuemax={100}>
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className="password-meter__segment"
            style={{
              backgroundColor: score >= step ? levelColor : "var(--color-border, #e4e8e2)",
            }}
          />
        ))}
      </div>

      <ul className="password-meter__checks">
        <li className={hasMinLength ? "check-pass" : "check-neutral"}>
          {hasMinLength ? <Check size={13} strokeWidth={2.5} /> : <span className="bullet" />} At least 8 characters
        </li>
        <li className={hasNumber ? "check-pass" : "check-neutral"}>
          {hasNumber ? <Check size={13} strokeWidth={2.5} /> : <span className="bullet" />} Includes a number (0-9)
        </li>
        <li className={hasUpperOrSpecial ? "check-pass" : "check-neutral"}>
          {hasUpperOrSpecial ? <Check size={13} strokeWidth={2.5} /> : <span className="bullet" />} Includes uppercase or symbol
        </li>
        {showConfirmCheck && confirmPassword && (
          <li className={isMatch ? "check-pass" : isMismatch ? "check-fail" : "check-neutral"}>
            {isMatch ? (
              <Check size={13} strokeWidth={2.5} />
            ) : isMismatch ? (
              <X size={13} strokeWidth={2.5} />
            ) : (
              <span className="bullet" />
            )}
            {isMatch ? "Passwords match" : isMismatch ? "Passwords do not match yet" : "Confirm matching"}
          </li>
        )}
      </ul>
    </div>
  )
}
