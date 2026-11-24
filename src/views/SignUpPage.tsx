"use client"

import Link from "next/link"
import { ArrowLeft, Brain, HeartHandshake } from "lucide-react"
import { Brand } from "../components/SiteHeader"
import { PatientRegistrationForm } from "../components/Registration/PatientRegistrationForm"
import { CaregiverRegistrationForm } from "../components/Registration/CaregiverRegistrationForm"
import type { SignUpRole } from "../types/signup"

export function SignUpPage({ role }: { role: SignUpRole }) {
  const isPatient = role === "user"

  return (
    <main className={`signup-page signup-page--${role}`}>
      {/* Top Navigation Bar */}
      <div className="signup-topbar">
        <Brand />
        <div className="signup-topbar__actions">
          <div className="signup-role-switcher" role="tablist" aria-label="Registration Role">
            <Link
              href="/signup/user"
              className={`signup-role-tab ${isPatient ? "signup-role-tab--active" : ""}`}
              role="tab"
              aria-selected={isPatient}
            >
              <Brain size={16} /> Patient Sign Up
            </Link>
            <Link
              href="/signup/caregiver"
              className={`signup-role-tab ${!isPatient ? "signup-role-tab--active" : ""}`}
              role="tab"
              aria-selected={!isPatient}
            >
              <HeartHandshake size={16} /> Caregiver Sign Up
            </Link>
          </div>

          <Link className="login-back-link" href="/">
            <ArrowLeft size={17} aria-hidden="true" /> Back to home
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="signup-layout">
        {isPatient ? <PatientRegistrationForm /> : <CaregiverRegistrationForm />}
      </div>

      <footer className="signup-footer">
        <p>Daymark Care · Mindful support for cognitive wellness and everyday life</p>
      </footer>
    </main>
  )
}
