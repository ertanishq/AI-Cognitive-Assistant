"use client"

import { useState, type FormEvent, type ChangeEvent } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  HeartHandshake,
  Info,
  Pencil,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react"
import { StepProgress } from "./StepProgress"
import { PasswordStrengthMeter } from "./PasswordStrengthMeter"
import { registerCaregiverApi, lookupPatientApi, processClientFileUpload } from "@/src/services/api"
import type { CaregiverRegistrationState } from "@/src/types/signup"

const STEP_LABELS = [
  "Personal Info",
  "Caregiver Info",
  "Patient Link",
  "Security & Consent",
  "Review & Submit",
]

const INITIAL_CAREGIVER_STATE: CaregiverRegistrationState = {
  fullName: "",
  profilePhoto: null,
  dateOfBirth: "",
  gender: "Prefer not to say",
  email: "",
  mobileNumber: "",
  houseNumber: "",
  streetArea: "",
  city: "",
  state: "",
  country: "United States",
  pinCode: "",
  preferredLanguage: "English",

  relationshipWithPatient: "Son / Daughter",
  occupation: "",
  caregivingExperience: "1-3 years",
  emergencyContactNumber: "",
  shortBio: "",

  connectionChoice: "connect_now",
  patientIdentifier: "",
  patientVerificationName: "",
  connectionRelationship: "Son / Daughter",
  connectionNote: "",

  password: "",
  confirmPassword: "",
  termsConsent: false,
  privacyConsent: false,
  confidentialityConsent: false,
}

export function CaregiverRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [highestStepReached, setHighestStepReached] = useState(1)
  const [state, setState] = useState<CaregiverRegistrationState>(INITIAL_CAREGIVER_STATE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Patient lookup state
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupFeedback, setLookupFeedback] = useState<{ found: boolean; message: string } | null>(null)

  // Registration result state
  const [registrationSuccessData, setRegistrationSuccessData] = useState<{
    caregiverId: string
    connectionRequest?: {
      id: string
      patientIdentifier: string
      patientName: string
      status: "Pending" | "Approved" | "Rejected" | "Revoked"
      note: string
    } | null
  } | null>(null)

  function updateField<K extends keyof CaregiverRegistrationState>(
    key: K,
    value: CaregiverRegistrationState[K]
  ) {
    setState((prev) => ({ ...prev, [key]: value }))
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key as string]
        return next
      })
    }
  }

  // --- Photo Upload ---
  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setSubmitError(null)
    try {
      const uploaded = await processClientFileUpload(files[0])
      updateField("profilePhoto", uploaded)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to upload photo.")
    }
    e.target.value = ""
  }

  // --- Patient Lookup ---
  async function handleVerifyPatient() {
    if (!state.patientIdentifier.trim()) {
      setLookupFeedback({ found: false, message: "Please enter a Patient ID or email address first." })
      return
    }

    setIsLookingUp(true)
    setLookupFeedback(null)

    try {
      const res = await lookupPatientApi(state.patientIdentifier.trim())
      if (res.found && res.patientName) {
        updateField("patientVerificationName", res.patientName)
        setLookupFeedback({
          found: true,
          message: `Patient Identified: ${res.patientName} (${res.patientId || state.patientIdentifier})`,
        })
      } else {
        updateField("patientVerificationName", "")
        setLookupFeedback({
          found: false,
          message: res.message || "Patient not found in active records. Connection request will be flagged for manual review.",
        })
      }
    } catch {
      setLookupFeedback({
        found: false,
        message: "Could not reach verification service. You can still submit the request for manual linking.",
      })
    } finally {
      setIsLookingUp(false)
    }
  }

  // --- Validation ---
  function validateStep(step: number): boolean {
    const nextErrors: Record<string, string> = {}

    if (step === 1) {
      if (!state.fullName.trim()) nextErrors.fullName = "Full Name is required."
      if (!state.email.trim()) {
        nextErrors.email = "Email Address is required."
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email.trim())) {
        nextErrors.email = "Please enter a valid email address."
      }
      if (!state.mobileNumber.trim()) {
        nextErrors.mobileNumber = "Mobile Number is required."
      } else if (state.mobileNumber.replace(/[^0-9]/g, "").length < 7) {
        nextErrors.mobileNumber = "Please enter a valid mobile number."
      }
      if (!state.city.trim()) nextErrors.city = "City is required."
      if (!state.state.trim()) nextErrors.state = "State is required."
      if (!state.pinCode.trim()) nextErrors.pinCode = "PIN / Postal code is required."
    } else if (step === 2) {
      if (!state.relationshipWithPatient) nextErrors.relationshipWithPatient = "Please select your relationship."
      if (!state.caregivingExperience) nextErrors.caregivingExperience = "Please indicate experience level."
    } else if (step === 3) {
      if (state.connectionChoice === "connect_now") {
        if (!state.patientIdentifier.trim()) {
          nextErrors.patientIdentifier = "Please enter the Patient ID or registered email address."
        }
      }
    } else if (step === 4) {
      if (!state.password) {
        nextErrors.password = "Please create a password."
      } else if (state.password.length < 8) {
        nextErrors.password = "Password must be at least 8 characters long."
      }
      if (state.password !== state.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match."
      }
      if (!state.termsConsent) {
        nextErrors.termsConsent = "You must agree to the Terms and Conditions."
      }
      if (!state.privacyConsent) {
        nextErrors.privacyConsent = "You must accept the Privacy Agreement."
      }
      if (!state.confidentialityConsent) {
        nextErrors.confidentialityConsent = "The Caregiver Confidentiality Agreement is mandatory."
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError("Please fill in the required fields before proceeding.")
      return false
    }

    setSubmitError(null)
    return true
  }

  function handleNext() {
    if (!validateStep(currentStep)) return
    const next = currentStep + 1
    setCurrentStep(next)
    setHighestStepReached((prev) => Math.max(prev, next))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      setSubmitError(null)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  function jumpToStep(step: number) {
    if (step <= highestStepReached) {
      setCurrentStep(step)
      setSubmitError(null)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validateStep(4)) {
      jumpToStep(4)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await registerCaregiverApi(state)
      setRegistrationSuccessData({
        caregiverId: result.caregiverId,
        connectionRequest: result.connectionRequest,
      })
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Caregiver registration failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Success Screen with Pending Approval Display ---
  if (registrationSuccessData) {
    const hasConnection = Boolean(registrationSuccessData.connectionRequest)

    return (
      <section className="registration-success" aria-labelledby="cg-success-heading">
        <div className="registration-success__card">
          <div className="registration-success__icon-wrap">
            <CheckCircle2 size={48} strokeWidth={2.2} />
          </div>

          <span className="badge badge--success">Caregiver Account Created</span>

          <h2 id="cg-success-heading">Welcome, {state.fullName || "Caregiver"}!</h2>

          <p className="registration-success__lead">
            Your caregiver account has been registered with Daymark Care. You can now coordinate care and daily wellbeing activities.
          </p>

          {/* Connection Status Card */}
          {hasConnection ? (
            <div className="pending-connection-card">
              <div className="pending-connection-card__header">
                <span className="badge badge--pending">
                  <Clock size={14} /> Connection Request: Pending Approval
                </span>
                <h3>Patient Connection Awaiting Authorization</h3>
              </div>

              <div className="pending-connection-card__details">
                <div>
                  <span className="label">Requested Patient:</span>
                  <span className="value">
                    {registrationSuccessData.connectionRequest?.patientName || state.patientIdentifier}
                  </span>
                </div>
                <div>
                  <span className="label">Patient Identifier:</span>
                  <span className="value"><code>{state.patientIdentifier}</code></span>
                </div>
                <div>
                  <span className="label">Your Relationship:</span>
                  <span className="value">{state.relationshipWithPatient}</span>
                </div>
                <div>
                  <span className="label">Access Status:</span>
                  <span className="value status-pending">Restricted (Pending Patient Approval)</span>
                </div>
              </div>

              <div className="pending-connection-card__explainer">
                <ShieldAlert size={18} />
                <p>
                  <strong>Patient Privacy Protocol:</strong> To protect cognitive wellbeing records, patient medical profiles remain strictly confidential. Access will automatically unlock as soon as the patient or their authorized representative approves your request in their dashboard.
                </p>
              </div>
            </div>
          ) : (
            <div className="pending-connection-card">
              <div className="pending-connection-card__header">
                <span className="badge badge--success">Ready to Connect</span>
                <h3>Connect a Patient Anytime</h3>
              </div>
              <p className="sub-section-card__desc" style={{ padding: "0 16px 16px" }}>
                You chose to connect with your patient later. You can enter their Patient ID or email address anytime directly from your Caregiver Dashboard.
              </p>
            </div>
          )}

          <div className="registration-summary-box">
            <h3>Registered Account Details</h3>
            <dl className="summary-list">
              <div>
                <dt>Caregiver Name:</dt>
                <dd>{state.fullName}</dd>
              </div>
              <div>
                <dt>Caregiver ID:</dt>
                <dd><code>{registrationSuccessData.caregiverId}</code></dd>
              </div>
              <div>
                <dt>Email Address:</dt>
                <dd>{state.email}</dd>
              </div>
              <div>
                <dt>Relationship:</dt>
                <dd>{state.relationshipWithPatient}</dd>
              </div>
              <div>
                <dt>Experience Level:</dt>
                <dd>{state.caregivingExperience}</dd>
              </div>
              <div>
                <dt>Confidentiality:</dt>
                <dd>Signed &amp; Acknowledged</dd>
              </div>
            </dl>
          </div>

          <div className="registration-success__actions">
            <Link className="button button--primary" href="/login/caregiver">
              Proceed to Caregiver Login <ArrowRight size={17} />
            </Link>
            <Link className="button button--portal" href="/">
              Return to Homepage
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div className="registration-flow">
      {/* Hero Intro */}
      <div className="registration-hero-intro">
        <div className="registration-hero-intro__pill">
          <HeartHandshake size={16} /> Caregiver Portal Registration
        </div>
        <h1>Support your loved one with confidence</h1>
        <p className="registration-hero-intro__desc">
          Register to coordinate daily routines, monitor gentle cognitive activities, and stay closely connected.
        </p>
      </div>

      {/* 5-Step Stepper Progress */}
      <StepProgress
        currentStep={currentStep}
        stepLabels={STEP_LABELS}
        highestStepReached={highestStepReached}
        onStepClick={jumpToStep}
      />

      {/* Error Banner */}
      {submitError && (
        <div className="form-feedback form-feedback--error registration-banner" role="alert">
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {/* Main Registration Card */}
      <div className="registration-card">
        {/* STEP 1: PERSONAL INFORMATION */}
        {currentStep === 1 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><User size={22} /></span>
              <div>
                <h2>Step 1: Personal Information</h2>
                <p>Provide your contact details and optional profile picture.</p>
              </div>
            </legend>

            <div className="step-field-group">
              {/* Profile Photo Upload */}
              <div className="upload-box-card">
                <div className="upload-box-card__header">
                  <Camera size={19} />
                  <div>
                    <h4>Caregiver Profile Photograph <span className="field-optional">(optional)</span></h4>
                    <p>Allows patients and care teams to recognize you in their dashboard.</p>
                  </div>
                </div>

                <div className="upload-dropzone">
                  {state.profilePhoto ? (
                    <div className="uploaded-preview-item">
                      <img
                        src={state.profilePhoto.dataUrl}
                        alt="Caregiver preview"
                        className="uploaded-photo-thumbnail"
                      />
                      <div className="uploaded-file-meta">
                        <strong>{state.profilePhoto.name}</strong>
                        <span>{(state.profilePhoto.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button
                        type="button"
                        className="button-icon-remove"
                        onClick={() => updateField("profilePhoto", null)}
                        aria-label="Remove photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="upload-dropzone__label">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                      />
                      <Upload size={24} />
                      <span>Upload Profile Picture</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="cg-fullname">
                    Full Name <span className="field-required">*</span>
                  </label>
                  <input
                    id="cg-fullname"
                    type="text"
                    placeholder="e.g. Marcus Vance"
                    value={state.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                  />
                  {errors.fullName && <p className="field-error">{errors.fullName}</p>}
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="cg-dob">Date of Birth <span className="field-optional">(optional)</span></label>
                    <input
                      id="cg-dob"
                      type="date"
                      value={state.dateOfBirth}
                      onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="cg-gender">Gender</label>
                    <select
                      id="cg-gender"
                      className="form-select"
                      value={state.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label htmlFor="cg-email">
                    Email Address <span className="field-required">*</span>
                  </label>
                  <input
                    id="cg-email"
                    type="email"
                    placeholder="e.g. marcus@example.com"
                    value={state.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                  {errors.email && <p className="field-error">{errors.email}</p>}
                </div>

                <div className="form-field">
                  <label htmlFor="cg-mobile">
                    Mobile Number <span className="field-required">*</span>
                  </label>
                  <input
                    id="cg-mobile"
                    type="tel"
                    placeholder="e.g. +1 (555) 018-7722"
                    value={state.mobileNumber}
                    onChange={(e) => updateField("mobileNumber", e.target.value)}
                  />
                  {errors.mobileNumber && <p className="field-error">{errors.mobileNumber}</p>}
                </div>

                <div className="form-field">
                  <label htmlFor="cg-lang">Preferred Language</label>
                  <select
                    id="cg-lang"
                    className="form-select"
                    value={state.preferredLanguage}
                    onChange={(e) => updateField("preferredLanguage", e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Español (Spanish)</option>
                    <option value="French">Français (French)</option>
                    <option value="German">Deutsch (German)</option>
                    <option value="Hindi">हिन्दी (Hindi)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Address Fields */}
              <div className="sub-section-card">
                <div className="sub-section-card__header">
                  <User size={18} />
                  <div>
                    <h3>Residential Address</h3>
                    <p className="sub-section-card__desc">Caregiver contact and coordination address.</p>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="cg-house">House / Flat Number <span className="field-optional">(optional)</span></label>
                    <input
                      id="cg-house"
                      type="text"
                      placeholder="e.g. Suite 300 or House 12"
                      value={state.houseNumber}
                      onChange={(e) => updateField("houseNumber", e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="cg-street">Street / Area <span className="field-optional">(optional)</span></label>
                    <input
                      id="cg-street"
                      type="text"
                      placeholder="e.g. 500 Park Avenue"
                      value={state.streetArea}
                      onChange={(e) => updateField("streetArea", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-3" style={{ marginTop: "12px" }}>
                  <div className="form-field">
                    <label htmlFor="cg-city">City <span className="field-required">*</span></label>
                    <input
                      id="cg-city"
                      type="text"
                      placeholder="e.g. Seattle"
                      value={state.city}
                      onChange={(e) => updateField("city", e.target.value)}
                    />
                    {errors.city && <p className="field-error">{errors.city}</p>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="cg-state">State / Province <span className="field-required">*</span></label>
                    <input
                      id="cg-state"
                      type="text"
                      placeholder="e.g. Washington"
                      value={state.state}
                      onChange={(e) => updateField("state", e.target.value)}
                    />
                    {errors.state && <p className="field-error">{errors.state}</p>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="cg-pincode">PIN / Postal Code <span className="field-required">*</span></label>
                    <input
                      id="cg-pincode"
                      type="text"
                      placeholder="e.g. 98101"
                      value={state.pinCode}
                      onChange={(e) => updateField("pinCode", e.target.value)}
                    />
                    {errors.pinCode && <p className="field-error">{errors.pinCode}</p>}
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* STEP 2: CAREGIVER INFORMATION */}
        {currentStep === 2 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><Users size={22} /></span>
              <div>
                <h2>Step 2: Caregiver Profile &amp; Role</h2>
                <p>Specify your relationship with the patient, professional background, and care experience.</p>
              </div>
            </legend>

            <div className="step-field-group">
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="cg-rel">
                    Relationship with Patient <span className="field-required">*</span>
                  </label>
                  <select
                    id="cg-rel"
                    className="form-select"
                    value={state.relationshipWithPatient}
                    onChange={(e) => {
                      updateField("relationshipWithPatient", e.target.value)
                      updateField("connectionRelationship", e.target.value)
                    }}
                  >
                    <option value="Son / Daughter">Son / Daughter</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Brother / Sister">Brother / Sister</option>
                    <option value="Relative">Relative</option>
                    <option value="Professional Caregiver">Professional Caregiver</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="cg-exp">Caregiving Experience <span className="field-required">*</span></label>
                  <select
                    id="cg-exp"
                    className="form-select"
                    value={state.caregivingExperience}
                    onChange={(e) => updateField("caregivingExperience", e.target.value)}
                  >
                    <option value="Less than 1 year">Less than 1 year (New caregiver)</option>
                    <option value="1-3 years">1 - 3 years</option>
                    <option value="3-5 years">3 - 5 years</option>
                    <option value="5+ years">More than 5 years (Experienced)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="cg-occ">Occupation / Profession <span className="field-optional">(optional)</span></label>
                  <input
                    id="cg-occ"
                    type="text"
                    placeholder="e.g. Teacher, Nurse, Engineer, Retired"
                    value={state.occupation}
                    onChange={(e) => updateField("occupation", e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="cg-em-phone">Secondary / Emergency Phone <span className="field-optional">(optional)</span></label>
                  <input
                    id="cg-em-phone"
                    type="tel"
                    placeholder="e.g. +1 (555) 018-9944"
                    value={state.emergencyContactNumber}
                    onChange={(e) => updateField("emergencyContactNumber", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="cg-bio">Short Introduction &amp; Care Approach</label>
                <textarea
                  id="cg-bio"
                  className="form-textarea"
                  rows={3}
                  placeholder="Share a few words about your caregiving background, how you support your patient, or any special notes."
                  value={state.shortBio}
                  onChange={(e) => updateField("shortBio", e.target.value)}
                />
              </div>
            </div>
          </fieldset>
        )}

        {/* STEP 3: PATIENT CONNECTION */}
        {currentStep === 3 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><HeartHandshake size={22} /></span>
              <div>
                <h2>Step 3: Patient Connection</h2>
                <p>Choose whether to request linking with an existing patient now, or connect later.</p>
              </div>
            </legend>

            <div className="step-field-group">
              {/* Option Choice Radio Cards */}
              <div className="choice-cards-grid choice-cards-grid--2col">
                <label
                  className={`choice-card ${state.connectionChoice === "connect_now" ? "choice-card--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="connectionChoice"
                    value="connect_now"
                    checked={state.connectionChoice === "connect_now"}
                    onChange={() => updateField("connectionChoice", "connect_now")}
                  />
                  <span className="choice-card__indicator" />
                  <div>
                    <strong className="choice-card__title">Option A: Connect with an Existing Patient</strong>
                    <p className="choice-card__subtext">
                      I have the patient&apos;s registered email address or unique Patient ID.
                    </p>
                  </div>
                </label>

                <label
                  className={`choice-card ${state.connectionChoice === "register_later" ? "choice-card--selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="connectionChoice"
                    value="register_later"
                    checked={state.connectionChoice === "register_later"}
                    onChange={() => updateField("connectionChoice", "register_later")}
                  />
                  <span className="choice-card__indicator" />
                  <div>
                    <strong className="choice-card__title">Option B: Patient Will Register Later</strong>
                    <p className="choice-card__subtext">
                      Skip linking now. You can link your patient anytime from your caregiver dashboard.
                    </p>
                  </div>
                </label>
              </div>

              {/* Conditional Option A Details */}
              {state.connectionChoice === "connect_now" && (
                <div className="sub-section-card sub-section-card--highlight">
                  <div className="sub-section-card__header">
                    <Search size={19} />
                    <div>
                      <h3>Patient Linking Request</h3>
                      <p className="sub-section-card__desc">
                        Enter the unique Patient ID (e.g. <code>MC-PAT-738492</code>) or their registered email.
                      </p>
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="target-patient-id">
                      Patient ID or Registered Email <span className="field-required">*</span>
                    </label>
                    <div className="patient-lookup-group">
                      <input
                        id="target-patient-id"
                        type="text"
                        placeholder="e.g. MC-PAT-738492 or patient@example.com"
                        value={state.patientIdentifier}
                        onChange={(e) => {
                          updateField("patientIdentifier", e.target.value)
                          setLookupFeedback(null)
                        }}
                      />
                      <button
                        type="button"
                        className="button button--portal button--lookup"
                        disabled={isLookingUp}
                        onClick={handleVerifyPatient}
                      >
                        {isLookingUp ? "Verifying..." : "Verify Patient ID"}
                      </button>
                    </div>
                    {errors.patientIdentifier && <p className="field-error">{errors.patientIdentifier}</p>}

                    {lookupFeedback && (
                      <p className={`lookup-status ${lookupFeedback.found ? "lookup-status--found" : "lookup-status--not-found"}`}>
                        {lookupFeedback.found ? <Check size={15} /> : <AlertCircle size={15} />}
                        {lookupFeedback.message}
                      </p>
                    )}
                  </div>

                  <div className="form-grid-2" style={{ marginTop: "14px" }}>
                    <div className="form-field">
                      <label htmlFor="cg-conn-rel">Relationship with Patient</label>
                      <input
                        id="cg-conn-rel"
                        type="text"
                        value={state.connectionRelationship}
                        onChange={(e) => updateField("connectionRelationship", e.target.value)}
                      />
                    </div>

                    <div className="form-field">
                      <label htmlFor="cg-conn-note">Message / Note for Patient (Optional)</label>
                      <input
                        id="cg-conn-note"
                        type="text"
                        placeholder="e.g. Hi Mom, Marcus here setting up our shared care profile."
                        value={state.connectionNote}
                        onChange={(e) => updateField("connectionNote", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="connection-info-note">
                    <Info size={16} />
                    <span>
                      <strong>Important Safety Rule:</strong> Submitting a request never grants immediate access. The connection will remain in <strong>Pending</strong> status until verified and approved by the patient or authorized representative.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </fieldset>
        )}

        {/* STEP 4: ACCOUNT SECURITY AND CONSENT */}
        {currentStep === 4 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><ShieldCheck size={22} /></span>
              <div>
                <h2>Step 4: Account Security &amp; Legal Agreements</h2>
                <p>Create your password and sign the mandatory caregiver confidentiality declaration.</p>
              </div>
            </legend>

            <div className="step-field-group">
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="cg-password">
                    Create Password <span className="field-required">*</span>
                  </label>
                  <div className="password-control">
                    <input
                      id="cg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={state.password}
                      onChange={(e) => updateField("password", e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="field-error">{errors.password}</p>}
                </div>

                <div className="form-field">
                  <label htmlFor="cg-confirm-password">
                    Confirm Password <span className="field-required">*</span>
                  </label>
                  <div className="password-control">
                    <input
                      id="cg-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={state.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
                </div>
              </div>

              <PasswordStrengthMeter
                password={state.password}
                confirmPassword={state.confirmPassword}
                showConfirmCheck={Boolean(state.confirmPassword)}
              />

              {/* Mandatory Caregiver Declarations */}
              <div className="consent-box">
                <h3>Caregiver Confidentiality Agreement &amp; Consents</h3>
                <p className="consent-box__intro">
                  Caregivers have access to sensitive cognitive routines. Please review and agree to all declarations.
                </p>

                <div className="consent-checkbox-list">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={state.confidentialityConsent}
                      onChange={(e) => updateField("confidentialityConsent", e.target.checked)}
                    />
                    <span>
                      <strong>Patient Information Confidentiality Agreement <span className="field-required">*</span>:</strong> I solemnly agree to keep all patient medical records, cognitive scores, medication routines, and family photographs strictly confidential and will never disclose them without authorization.
                    </span>
                  </label>
                  {errors.confidentialityConsent && <p className="field-error">{errors.confidentialityConsent}</p>}

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={state.termsConsent}
                      onChange={(e) => updateField("termsConsent", e.target.checked)}
                    />
                    <span>
                      I have read and agree to the <strong>Terms and Conditions</strong> of Daymark Care. <span className="field-required">*</span>
                    </span>
                  </label>
                  {errors.termsConsent && <p className="field-error">{errors.termsConsent}</p>}

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={state.privacyConsent}
                      onChange={(e) => updateField("privacyConsent", e.target.checked)}
                    />
                    <span>
                      I consent to the <strong>Privacy Policy</strong> and caregiver data processing. <span className="field-required">*</span>
                    </span>
                  </label>
                  {errors.privacyConsent && <p className="field-error">{errors.privacyConsent}</p>}
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* STEP 5: FINAL REVIEW AND SUBMISSION */}
        {currentStep === 5 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><CheckCircle2 size={22} /></span>
              <div>
                <h2>Step 5: Final Review &amp; Registration</h2>
                <p>Review your information and submit your registration.</p>
              </div>
            </legend>

            <div className="step-field-group">
              <div className="review-container">
                <div className="review-section-header">
                  <h3>Caregiver Registration Summary</h3>
                  <span className="review-section-header__hint">Click "Edit" on any section to make adjustments</span>
                </div>

                <div className="review-cards-list">
                  {/* Personal Info */}
                  <div className="review-card">
                    <div className="review-card__top">
                      <h4>1. Personal Information</h4>
                      <button type="button" className="button-edit-step" onClick={() => jumpToStep(1)}>
                        <Pencil size={13} /> Edit
                      </button>
                    </div>
                    <div className="review-card__grid">
                      <div>
                        <span className="review-label">Name:</span>
                        <span className="review-value">{state.fullName || "—"}</span>
                      </div>
                      <div>
                        <span className="review-label">Email:</span>
                        <span className="review-value">{state.email || "—"}</span>
                      </div>
                      <div>
                        <span className="review-label">Phone:</span>
                        <span className="review-value">{state.mobileNumber || "—"}</span>
                      </div>
                      <div>
                        <span className="review-label">City &amp; State:</span>
                        <span className="review-value">{state.city}, {state.state}</span>
                      </div>
                    </div>
                  </div>

                  {/* Caregiver Role */}
                  <div className="review-card">
                    <div className="review-card__top">
                      <h4>2. Caregiving Profile</h4>
                      <button type="button" className="button-edit-step" onClick={() => jumpToStep(2)}>
                        <Pencil size={13} /> Edit
                      </button>
                    </div>
                    <div className="review-card__grid">
                      <div>
                        <span className="review-label">Relationship with Patient:</span>
                        <span className="review-value">{state.relationshipWithPatient}</span>
                      </div>
                      <div>
                        <span className="review-label">Experience:</span>
                        <span className="review-value">{state.caregivingExperience}</span>
                      </div>
                      <div>
                        <span className="review-label">Occupation:</span>
                        <span className="review-value">{state.occupation || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="review-label">Secondary Contact:</span>
                        <span className="review-value">{state.emergencyContactNumber || "None"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Link Status */}
                  <div className="review-card">
                    <div className="review-card__top">
                      <h4>3. Patient Connection Request</h4>
                      <button type="button" className="button-edit-step" onClick={() => jumpToStep(3)}>
                        <Pencil size={13} /> Edit
                      </button>
                    </div>
                    <div className="review-card__grid">
                      <div>
                        <span className="review-label">Mode:</span>
                        <span className="review-value">
                          {state.connectionChoice === "connect_now" ? "Connect with Existing Patient" : "Connect Later"}
                        </span>
                      </div>
                      {state.connectionChoice === "connect_now" && (
                        <>
                          <div>
                            <span className="review-label">Target Patient Identifier:</span>
                            <span className="review-value"><code>{state.patientIdentifier}</code></span>
                          </div>
                          <div>
                            <span className="review-label">Verified Name:</span>
                            <span className="review-value">{state.patientVerificationName || "Pending system verification"}</span>
                          </div>
                          <div>
                            <span className="review-label">Initial Request Status:</span>
                            <span className="review-value status-pending">Pending Approval</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* Action Buttons */}
        <div className="registration-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="button button--portal"
              onClick={handleBack}
            >
              <ArrowLeft size={17} /> Back
            </button>
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              className="button button--primary registration-action-next"
              onClick={handleNext}
            >
              Continue to Step {currentStep + 1} <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              className="button button--primary registration-action-submit"
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <span className="button-spinner" />
                  Creating Caregiver Account...
                </>
              ) : (
                <>
                  Submit Caregiver Registration <Check size={18} />
                </>
              )}
            </button>
          )}
        </div>

        <div className="registration-footer-note">
          <p>
            Already have a caregiver account? <Link href="/login/caregiver">Sign in as Caregiver</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
