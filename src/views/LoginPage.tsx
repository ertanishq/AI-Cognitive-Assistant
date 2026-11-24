"use client"

import { useState, type FormEvent } from "react"
import {
  ArrowLeft,
  Eye,
  EyeOff,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { Brand } from "../components/SiteHeader"

export type LoginRole = "user" | "caregiver" | "admin"
type Feedback = { kind: "error" | "info"; message: string } | null

type LoginCopy = {
  title: string
  subtitle: string
  identifierLabel: string
  identifierPlaceholder: string
  identifierType: "text" | "email"
  icon: typeof UserRound
  forgotPassword: string
  recoveryHelp: string
  rememberMe?: boolean
  visualHeading?: string
  visualCopy?: string
}

const loginCopy: Record<LoginRole, LoginCopy> = {
  user: {
    title: "Welcome back",
    subtitle: "Let’s continue with your daily activities.",
    identifierLabel: "Email or registered username",
    identifierPlaceholder: "Enter your email or username",
    identifierType: "text",
    icon: UserRound,
    forgotPassword: "Forgot your password?",
    recoveryHelp: "Please ask your caregiver or care team to help reset your password.",
  },
  caregiver: {
    title: "Welcome back, caregiver",
    subtitle: "Sign in to stay connected with the people you care for.",
    identifierLabel: "Email address",
    identifierPlaceholder: "you@example.com",
    identifierType: "email",
    icon: HeartHandshake,
    forgotPassword: "Forgot your password?",
    recoveryHelp: "Please contact your platform administrator to reset your password.",
    rememberMe: true,
    visualHeading: "Care is a team effort.",
    visualCopy: "Stay connected to the people and routines that matter, in one thoughtful place.",
  },
  admin: {
    title: "Administrator login",
    subtitle: "Secure access to platform administration.",
    identifierLabel: "Registered email",
    identifierPlaceholder: "you@example.com",
    identifierType: "email",
    icon: ShieldCheck,
    forgotPassword: "Forgot your password?",
    recoveryHelp: "Please contact your platform owner to restore administrator access.",
  },
}

export function LoginPage({ role }: { role: LoginRole }) {
  const copy = loginCopy[role]
  const Icon = copy.icon
  const [showPassword, setShowPassword] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [identifierError, setIdentifierError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const identifier = String(formData.get("identifier") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const isEmailRole = role !== "user"
    const validEmail = !isEmailRole || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    const nextIdentifierError = !identifier
      ? "Enter your email address or username."
      : !validEmail
        ? "Enter a valid email address."
        : ""
    const nextPasswordError = password ? "" : "Enter your password."

    setIdentifierError(nextIdentifierError)
    setPasswordError(nextPasswordError)
    if (nextIdentifierError || nextPasswordError) {
      setFeedback({ kind: "error", message: "Check the information below and try again." })
      return
    }

    setFeedback({
      kind: "info",
      message: "Sign-in is not connected yet. Your details have not been sent or saved.",
    })
  }

  function showRecoveryHelp() {
    setFeedback({ kind: "info", message: copy.recoveryHelp })
  }

  return (
    <main className={`login-page login-page--${role}`}>
      <div className="login-topbar">
        <Brand />
        <Link className="login-back-link" href="/">
          <ArrowLeft size={17} aria-hidden="true" /> Back to home
        </Link>
      </div>
      <div className={`login-layout${role === "caregiver" ? " login-layout--caregiver" : ""}`}>
        <section className="login-panel" aria-labelledby="login-heading">
          <div className="login-panel__mark" aria-hidden="true"><Icon size={23} strokeWidth={1.8} /></div>
          <p className="eyebrow">{role === "admin" ? "Platform administration" : role === "caregiver" ? "Caregiver portal" : "Your personal space"}</p>
          <h1 id="login-heading">{copy.title}</h1>
          <p className="login-panel__subtitle">{copy.subtitle}</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {feedback && (
              <div className={`form-feedback form-feedback--${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>
                {feedback.message}
              </div>
            )}
            <div className="form-field">
              <label htmlFor="identifier">{copy.identifierLabel}</label>
              <input
                id="identifier"
                name="identifier"
                type={copy.identifierType}
                autoComplete="username"
                inputMode={role === "user" ? "email" : undefined}
                placeholder={copy.identifierPlaceholder}
                aria-invalid={Boolean(identifierError)}
                aria-describedby={identifierError ? "identifier-error" : undefined}
                onChange={() => {
                  if (identifierError) setIdentifierError("")
                }}
              />
              {identifierError && <p className="field-error" id="identifier-error">{identifierError}</p>}
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="password-control">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={role === "admin" ? "current-password" : "current-password"}
                  placeholder="Enter your password"
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  onChange={() => {
                    if (passwordError) setPasswordError("")
                  }}
                />
                <button
                  className="password-toggle"
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {passwordError && <p className="field-error" id="password-error">{passwordError}</p>}
            </div>

            <div className="login-form__options">
              {copy.rememberMe && (
                <label className="remember-option">
                  <input type="checkbox" name="remember" />
                  <span>Remember me</span>
                </label>
              )}
              <button className="forgot-link" type="button" onClick={showRecoveryHelp}>
                {copy.forgotPassword}
              </button>
            </div>
            <button className="button button--primary login-submit" type="submit">Sign in</button>
          </form>
          {role === "user" && (
            <p className="login-signup-prompt">
              Don&apos;t have an account yet?{" "}
              <Link href="/signup/user">Sign up as Patient</Link>
            </p>
          )}
          {role === "caregiver" && (
            <p className="login-signup-prompt">
              Don&apos;t have an account yet?{" "}
              <Link href="/signup/caregiver">Sign up as Caregiver</Link>
            </p>
          )}
          <p className="login-privacy-note">
            <ShieldCheck size={16} aria-hidden="true" /> This preview does not store or send your sign-in details.
          </p>
          {role === "admin" && <p className="admin-access-note">Administrator accounts are created privately. Public registration is not available.</p>}
        </section>
        {role === "caregiver" && (
          <aside className="login-visual" aria-label="Caregiver support">
            <img src="/daymark-about.png" alt="A caregiver and an older adult planning their day together" />
            <div className="login-visual__caption">
              <span className="login-visual__icon" aria-hidden="true"><Leaf size={18} /></span>
              <h2>{copy.visualHeading}</h2>
              <p>{copy.visualCopy}</p>
            </div>
          </aside>
        )}
      </div>
      <p className="login-footer">Daymark Care · A supportive tool for everyday wellbeing</p>
    </main>
  )
}
