"use client"

import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Image as ImageIcon,
  Info,
  Mic,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Square,
  Trash2,
  Upload,
  User,
  Volume2,
} from "lucide-react"
import { StepProgress } from "./StepProgress"
import { PasswordStrengthMeter } from "./PasswordStrengthMeter"
import { registerPatientApi, processClientFileUpload } from "@/src/services/api"
import type {
  PatientRegistrationState,
  UploadedFileItem,
  FamilyMemoryEntry,
} from "@/src/types/signup"

const STEP_LABELS = [
  "Basic Info",
  "Medical Info",
  "Documents",
  "Family Memories",
  "Voice Sample",
  "Preferences",
  "Consent & Review",
]

const SAMPLE_READING_SENTENCE =
  "The morning sun shines through the window, bringing warmth and a peaceful start to a new day."

const INITIAL_PATIENT_STATE: PatientRegistrationState = {
  password: "",
  confirmPassword: "",

  fullName: "",
  dateOfBirth: "",
  age: 0,
  gender: "Prefer not to say",
  email: "",
  mobileNumber: "",
  preferredLanguage: "English",
  houseNumber: "",
  streetArea: "",
  city: "",
  state: "",
  country: "United States",
  pinCode: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelationship: "",

  diagnosisStatus: "Not Diagnosed",
  diseaseType: "",
  diagnosisDate: "",
  currentSymptoms: [],
  existingConditions: "",
  currentMedications: "",
  allergies: "",
  treatingDoctorName: "",
  doctorContact: "",

  profilePhoto: null,
  medicalPrescriptions: [],
  medicalReports: [],
  previousAssessments: [],

  familyMemories: [],

  voiceSample: null,
  voiceSampleSkipped: false,

  textSize: "standard",
  audioInstructions: true,
  accessibilityRequirements: ["Clear step-by-step layout"],
  wakeUpTime: "07:30 AM",
  reminderFrequency: "Morning & Afternoon",
  preferredActivityTime: "Morning",

  medicalConsent: false,
  documentConsent: false,
  familyPhotosConsent: false,
  voiceConsent: false,
  termsConsent: false,
}

export function PatientRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [highestStepReached, setHighestStepReached] = useState(1)
  const [state, setState] = useState<PatientRegistrationState>(INITIAL_PATIENT_STATE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [registeredPatientId, setRegisteredPatientId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Helper: auto calculate age when DOB changes
  function handleDobChange(dobString: string) {
    if (!dobString) {
      setState((prev) => ({ ...prev, dateOfBirth: "", age: 0 }))
      return
    }

    const birthDate = new Date(dobString)
    if (!isNaN(birthDate.getTime())) {
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      setState((prev) => ({ ...prev, dateOfBirth: dobString, age: Math.max(0, age) }))
      if (errors.dateOfBirth) {
        setErrors((prev) => {
          const next = { ...prev }
          delete next.dateOfBirth
          return next
        })
      }
    } else {
      setState((prev) => ({ ...prev, dateOfBirth: dobString }))
    }
  }

  function updateField<K extends keyof PatientRegistrationState>(key: K, value: PatientRegistrationState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key as string]
        return next
      })
    }
  }

  // --- Voice Recording Handlers ---
  async function startRecording() {
    try {
      setSubmitError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          const base64Audio = reader.result as string
          updateField("voiceSample", {
            audioDataUrl: base64Audio,
            durationSeconds: recordingSeconds || 5,
            sentenceRead: SAMPLE_READING_SENTENCE,
            recordedAt: new Date().toISOString(),
          })
          updateField("voiceConsent", true)
        }
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1)
      }, 1000)
    } catch {
      setSubmitError("Microphone access could not be granted. You may skip this optional step.")
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }

  function resetRecording() {
    stopRecording()
    setAudioUrl(null)
    setRecordingSeconds(0)
    updateField("voiceSample", null)
  }

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
  }, [])

  // --- File Upload Handlers ---
  async function handleGenericFileUpload(
    e: ChangeEvent<HTMLInputElement>,
    field: "profilePhoto" | "medicalPrescriptions" | "medicalReports" | "previousAssessments"
  ) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setSubmitError(null)
    try {
      if (field === "profilePhoto") {
        const file = files[0]
        const uploaded = await processClientFileUpload(file)
        updateField("profilePhoto", uploaded)
      } else {
        const uploadedItems: UploadedFileItem[] = []
        for (let i = 0; i < files.length; i++) {
          const item = await processClientFileUpload(files[i])
          uploadedItems.push(item)
        }
        updateField(field, [...(state[field] as UploadedFileItem[]), ...uploadedItems])
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "File upload failed.")
    }
    e.target.value = ""
  }

  function removeFileItem(
    field: "medicalPrescriptions" | "medicalReports" | "previousAssessments",
    index: number
  ) {
    const nextList = [...state[field]]
    nextList.splice(index, 1)
    updateField(field, nextList)
  }

  // --- Family Memories Handlers ---
  const [newMemoryName, setNewMemoryName] = useState("")
  const [newMemoryRel, setNewMemoryRel] = useState("")
  const [newMemoryDesc, setNewMemoryDesc] = useState("")
  const [newMemoryPhoto, setNewMemoryPhoto] = useState<UploadedFileItem | null>(null)

  async function handleMemoryPhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    try {
      const uploaded = await processClientFileUpload(files[0])
      setNewMemoryPhoto(uploaded)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to upload memory photo.")
    }
    e.target.value = ""
  }

  function addFamilyMemory() {
    if (!newMemoryName.trim() || !newMemoryRel.trim()) {
      setSubmitError("Please provide at least the family member's name and relationship.")
      return
    }

    const newEntry: FamilyMemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      personName: newMemoryName.trim(),
      relationship: newMemoryRel.trim(),
      description: newMemoryDesc.trim(),
      photo: newMemoryPhoto || undefined,
    }

    updateField("familyMemories", [...state.familyMemories, newEntry])
    updateField("familyPhotosConsent", true)
    setNewMemoryName("")
    setNewMemoryRel("")
    setNewMemoryDesc("")
    setNewMemoryPhoto(null)
    setSubmitError(null)
  }

  function removeFamilyMemory(id: string) {
    updateField(
      "familyMemories",
      state.familyMemories.filter((m) => m.id !== id)
    )
  }

  // --- Step Validation ---
  function validateCurrentStep(step: number): boolean {
    const nextErrors: Record<string, string> = {}

    if (step === 1) {
      if (!state.fullName.trim()) nextErrors.fullName = "Full Name is required."
      if (!state.dateOfBirth) nextErrors.dateOfBirth = "Date of Birth is mandatory."
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
      if (!state.emergencyName.trim()) nextErrors.emergencyName = "Emergency Contact Name is required."
      if (!state.emergencyPhone.trim()) nextErrors.emergencyPhone = "Emergency Contact Number is required."
      if (!state.emergencyRelationship.trim()) nextErrors.emergencyRelationship = "Relationship is required."
    } else if (step === 2) {
      if (!state.diagnosisStatus) nextErrors.diagnosisStatus = "Please select diagnosis status."
      if (state.diagnosisStatus === "Diagnosed" && !state.diseaseType) {
        nextErrors.diseaseType = "Please specify the diagnosed dementia / Alzheimer's type."
      }
    } else if (step === 7) {
      if (!state.password) {
        nextErrors.password = "Please create a password for your account."
      } else if (state.password.length < 8) {
        nextErrors.password = "Password must be at least 8 characters long."
      }
      if (state.password !== state.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match."
      }
      if (!state.medicalConsent) {
        nextErrors.medicalConsent = "Consent for processing medical information is required."
      }
      if (!state.documentConsent) {
        nextErrors.documentConsent = "Consent for storing medical documents is required."
      }
      if (!state.termsConsent) {
        nextErrors.termsConsent = "You must accept the Terms and Conditions to proceed."
      }
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError("Please fill out all required fields highlighted below before continuing.")
      return false
    }

    setSubmitError(null)
    return true
  }

  function handleNext() {
    if (!validateCurrentStep(currentStep)) return
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
    if (!validateCurrentStep(7)) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const result = await registerPatientApi(state)
      setRegisteredPatientId(result.patientId)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function copyPatientId() {
    if (registeredPatientId) {
      navigator.clipboard.writeText(registeredPatientId)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2500)
    }
  }

  // --- Success Screen with Generated Patient ID ---
  if (registeredPatientId) {
    return (
      <section className="registration-success" aria-labelledby="patient-success-heading">
        <div className="registration-success__card">
          <div className="registration-success__icon-wrap">
            <CheckCircle2 size={48} strokeWidth={2.2} />
          </div>

          <span className="badge badge--success">Patient Profile Created Successfully</span>

          <h2 id="patient-success-heading">Welcome, {state.fullName || "Friend"}!</h2>

          <p className="registration-success__lead">
            Your patient health &amp; memory profile has been registered in the Daymark Care cognitive system.
          </p>

          {/* Prominent Unique Patient ID Display */}
          <div className="patient-id-showcase">
            <span className="patient-id-showcase__label">Your Unique Patient ID</span>
            <div className="patient-id-showcase__badge">
              <code>{registeredPatientId}</code>
              <button
                type="button"
                className="patient-id-copy-btn"
                onClick={copyPatientId}
                aria-label="Copy Patient ID"
              >
                {copiedId ? (
                  <>
                    <Check size={16} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Copy ID
                  </>
                )}
              </button>
            </div>
            <p className="patient-id-showcase__hint">
              Save this ID. When a caregiver or family member registers, they can enter this Patient ID to request a connection. <strong>You will always have full control to approve or decline any caregiver request.</strong>
            </p>
          </div>

          <div className="registration-summary-box">
            <h3>Registered Profile Summary</h3>
            <dl className="summary-list">
              <div>
                <dt>Full Name:</dt>
                <dd>{state.fullName}</dd>
              </div>
              <div>
                <dt>Age / DOB:</dt>
                <dd>{state.age} years ({state.dateOfBirth})</dd>
              </div>
              <div>
                <dt>Email Address:</dt>
                <dd>{state.email}</dd>
              </div>
              <div>
                <dt>Diagnosis Status:</dt>
                <dd>{state.diagnosisStatus} {state.diseaseType ? `(${state.diseaseType})` : ""}</dd>
              </div>
              <div>
                <dt>Uploaded Documents:</dt>
                <dd>
                  {state.medicalPrescriptions.length + state.medicalReports.length + state.previousAssessments.length} files
                </dd>
              </div>
              <div>
                <dt>Family Memories:</dt>
                <dd>{state.familyMemories.length} photographs recorded</dd>
              </div>
              <div>
                <dt>Voice Sample:</dt>
                <dd>{state.voiceSample ? "Baseline sample secured" : "Skipped"}</dd>
              </div>
              <div>
                <dt>Display Mode:</dt>
                <dd style={{ textTransform: "capitalize" }}>{state.textSize} text</dd>
              </div>
            </dl>
          </div>

          <div className="registration-success__actions">
            <Link className="button button--primary" href="/login/user">
              Proceed to Patient Login <ArrowRight size={17} />
            </Link>
            <Link className="button button--portal" href="/">
              Return to Homepage
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // --- Dynamic Class for Text Size Accessibility ---
  const textSizeClass =
    state.textSize === "extra-large"
      ? "registration-flow--extra-large"
      : state.textSize === "larger"
      ? "registration-flow--large-text"
      : ""

  return (
    <div className={`registration-flow ${textSizeClass}`}>
      {/* Intro Header */}
      <div className="registration-hero-intro">
        <div className="registration-hero-intro__pill">
          <Brain size={16} /> Patient Health &amp; Memory Profile
        </div>
        <h1>Personalize your cognitive care journey</h1>
        <p className="registration-hero-intro__desc">
          Take your time through each step. All information is handled with clinical privacy and empathy.
        </p>
      </div>

      {/* 7-Step Stepper Progress */}
      <StepProgress
        currentStep={currentStep}
        stepLabels={STEP_LABELS}
        highestStepReached={highestStepReached}
        onStepClick={jumpToStep}
      />

      {/* Error Feedback Banner */}
      {submitError && (
        <div className="form-feedback form-feedback--error registration-banner" role="alert">
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {/* Registration Card Form */}
      <div className="registration-card">
        {/* STEP 1: BASIC PATIENT INFORMATION */}
        {currentStep === 1 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><User size={22} /></span>
              <div>
                <h2>Step 1: Basic Patient Information</h2>
                <p>Enter your primary contact details. Age is automatically calculated from your Date of Birth.</p>
              </div>
            </legend>

            <div className="step-field-group">
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="patient-fullname">
                    Full Name <span className="field-required">*</span>
                  </label>
                  <input
                    id="patient-fullname"
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={state.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                  />
                  {errors.fullName && <p className="field-error">{errors.fullName}</p>}
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="patient-dob">
                      Date of Birth <span className="field-required">*</span>
                    </label>
                    <input
                      id="patient-dob"
                      type="date"
                      value={state.dateOfBirth}
                      onChange={(e) => handleDobChange(e.target.value)}
                    />
                    {errors.dateOfBirth && <p className="field-error">{errors.dateOfBirth}</p>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="patient-age">
                      Age <span className="field-optional">(Auto-Calculated)</span>
                    </label>
                    <input
                      id="patient-age"
                      type="text"
                      readOnly
                      className="form-input-readonly"
                      value={state.dateOfBirth ? `${state.age} years old` : "—"}
                      aria-label="Calculated Age"
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label htmlFor="patient-gender">Gender</label>
                  <select
                    id="patient-gender"
                    className="form-select"
                    value={state.gender}
                    onChange={(e) => updateField("gender", e.target.value)}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="patient-email">
                    Email Address <span className="field-required">*</span>
                  </label>
                  <input
                    id="patient-email"
                    type="email"
                    placeholder="e.g. eleanor@example.com"
                    value={state.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                  {errors.email && <p className="field-error">{errors.email}</p>}
                </div>

                <div className="form-field">
                  <label htmlFor="patient-mobile">
                    Mobile Number <span className="field-required">*</span>
                  </label>
                  <input
                    id="patient-mobile"
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={state.mobileNumber}
                    onChange={(e) => updateField("mobileNumber", e.target.value)}
                  />
                  {errors.mobileNumber && <p className="field-error">{errors.mobileNumber}</p>}
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="patient-language">Preferred Language <span className="field-required">*</span></label>
                <select
                  id="patient-language"
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

              {/* Address Details */}
              <div className="sub-section-card">
                <div className="sub-section-card__header">
                  <User size={18} />
                  <div>
                    <h3>Residential Address</h3>
                    <p className="sub-section-card__desc">Used for localized routine support and emergency care.</p>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="patient-house">House / Flat Number <span className="field-optional">(optional)</span></label>
                    <input
                      id="patient-house"
                      type="text"
                      placeholder="e.g. Apt 4B, Sunflower Manor"
                      value={state.houseNumber}
                      onChange={(e) => updateField("houseNumber", e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="patient-street">Street / Area <span className="field-optional">(optional)</span></label>
                    <input
                      id="patient-street"
                      type="text"
                      placeholder="e.g. 142 Meadowview Lane"
                      value={state.streetArea}
                      onChange={(e) => updateField("streetArea", e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-3" style={{ marginTop: "12px" }}>
                  <div className="form-field">
                    <label htmlFor="patient-city">City <span className="field-required">*</span></label>
                    <input
                      id="patient-city"
                      type="text"
                      placeholder="e.g. Portland"
                      value={state.city}
                      onChange={(e) => updateField("city", e.target.value)}
                    />
                    {errors.city && <p className="field-error">{errors.city}</p>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="patient-state">State / Province <span className="field-required">*</span></label>
                    <input
                      id="patient-state"
                      type="text"
                      placeholder="e.g. Oregon"
                      value={state.state}
                      onChange={(e) => updateField("state", e.target.value)}
                    />
                    {errors.state && <p className="field-error">{errors.state}</p>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="patient-pincode">PIN / Postal Code <span className="field-required">*</span></label>
                    <input
                      id="patient-pincode"
                      type="text"
                      placeholder="e.g. 97201"
                      value={state.pinCode}
                      onChange={(e) => updateField("pinCode", e.target.value)}
                    />
                    {errors.pinCode && <p className="field-error">{errors.pinCode}</p>}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="sub-section-card">
                <div className="sub-section-card__header">
                  <Phone size={18} />
                  <div>
                    <h3>Emergency Contact Details</h3>
                    <p className="sub-section-card__desc">Primary relative or caregiver to notify in case of need.</p>
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-field">
                    <label htmlFor="patient-em-name">Contact Full Name <span className="field-required">*</span></label>
                    <input
                      id="patient-em-name"
                      type="text"
                      placeholder="e.g. Robert Vance"
                      value={state.emergencyName}
                      onChange={(e) => updateField("emergencyName", e.target.value)}
                    />
                    {errors.emergencyName && <p className="field-error">{errors.emergencyName}</p>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="patient-em-phone">Phone Number <span className="field-required">*</span></label>
                    <input
                      id="patient-em-phone"
                      type="tel"
                      placeholder="e.g. +1 (555) 019-3344"
                      value={state.emergencyPhone}
                      onChange={(e) => updateField("emergencyPhone", e.target.value)}
                    />
                    {errors.emergencyPhone && <p className="field-error">{errors.emergencyPhone}</p>}
                  </div>

                  <div className="form-field">
                    <label htmlFor="patient-em-rel">Relationship <span className="field-required">*</span></label>
                    <input
                      id="patient-em-rel"
                      type="text"
                      placeholder="e.g. Son, Daughter, Spouse"
                      value={state.emergencyRelationship}
                      onChange={(e) => updateField("emergencyRelationship", e.target.value)}
                    />
                    {errors.emergencyRelationship && <p className="field-error">{errors.emergencyRelationship}</p>}
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* STEP 2: MEDICAL INFORMATION */}
        {currentStep === 2 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><Brain size={22} /></span>
              <div>
                <h2>Step 2: Medical &amp; Health Context</h2>
                <p>Provide current clinical context. Additional fields appear conditionally based on your diagnosis status.</p>
              </div>
            </legend>

            <div className="step-field-group">
              <div className="form-callout-note">
                <Info size={18} className="form-callout-note__icon" />
                <p>
                  <strong>Clinical Notice:</strong> Daymark Care is an assistive wellbeing platform. This profile is not a clinical assessment or medical diagnosis.
                </p>
              </div>

              {/* Diagnosis Status Selection */}
              <div className="form-field">
                <label className="field-label-prominent">
                  Alzheimer&apos;s / Dementia Diagnosis Status <span className="field-required">*</span>
                </label>
                <div className="choice-cards-grid">
                  {[
                    { id: "Diagnosed", desc: "Formally diagnosed by a physician or neurologist" },
                    { id: "Suspected", desc: "Experiencing symptoms and planning a consultation" },
                    { id: "Under Evaluation", desc: "Currently undergoing tests or neurological review" },
                    { id: "Not Diagnosed", desc: "Using for general cognitive wellness and memory maintenance" },
                  ].map(({ id, desc }) => (
                    <label
                      key={id}
                      className={`choice-card ${state.diagnosisStatus === id ? "choice-card--selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="diagnosisStatus"
                        value={id}
                        checked={state.diagnosisStatus === id}
                        onChange={() =>
                          updateField(
                            "diagnosisStatus",
                            id as PatientRegistrationState["diagnosisStatus"]
                          )
                        }
                      />
                      <span className="choice-card__indicator" />
                      <div>
                        <strong className="choice-card__title">{id}</strong>
                        <p className="choice-card__subtext">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Conditional Fields: If Diagnosed */}
              {state.diagnosisStatus === "Diagnosed" && (
                <div className="sub-section-card sub-section-card--highlight">
                  <div className="sub-section-card__header">
                    <ShieldAlert size={19} />
                    <div>
                      <h3>Diagnosis Details</h3>
                      <p className="sub-section-card__desc">Helps customize memory exercise complexity and daily guidance.</p>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-field">
                      <label htmlFor="disease-type">
                        Disease / Condition Type <span className="field-required">*</span>
                      </label>
                      <select
                        id="disease-type"
                        className="form-select"
                        value={state.diseaseType}
                        onChange={(e) => updateField("diseaseType", e.target.value)}
                      >
                        <option value="">Select condition type</option>
                        <option value="Early-Onset Alzheimer's">Early-Onset Alzheimer&apos;s</option>
                        <option value="Late-Onset Alzheimer's">Late-Onset Alzheimer&apos;s</option>
                        <option value="Vascular Dementia">Vascular Dementia</option>
                        <option value="Lewy Body Dementia">Lewy Body Dementia</option>
                        <option value="Frontotemporal Dementia">Frontotemporal Dementia</option>
                        <option value="Mild Cognitive Impairment (MCI)">Mild Cognitive Impairment (MCI)</option>
                        <option value="Mixed Dementia">Mixed Dementia</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.diseaseType && <p className="field-error">{errors.diseaseType}</p>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="diagnosis-date">Approximate Diagnosis Date</label>
                      <input
                        id="diagnosis-date"
                        type="date"
                        value={state.diagnosisDate}
                        onChange={(e) => updateField("diagnosisDate", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Current Symptoms Multi-Select */}
              <div className="form-field">
                <label className="field-label-prominent">Current Symptoms Observed</label>
                <div className="choice-cards-grid">
                  {[
                    "Short-term memory lapses",
                    "Disorientation in familiar places",
                    "Difficulty managing medications",
                    "Word-finding or communication pauses",
                    "Mood or anxiety changes",
                    "Trouble with daily planning",
                  ].map((symptom) => {
                    const isChecked = state.currentSymptoms.includes(symptom)
                    return (
                      <label
                        key={symptom}
                        className={`choice-card ${isChecked ? "choice-card--selected" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateField("currentSymptoms", [...state.currentSymptoms, symptom])
                            } else {
                              updateField(
                                "currentSymptoms",
                                state.currentSymptoms.filter((s) => s !== symptom)
                              )
                            }
                          }}
                        />
                        <span className="choice-card__indicator" />
                        <span className="choice-card__text">{symptom}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Existing Conditions & Medications */}
              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="existing-conditions">Existing Medical Conditions</label>
                  <input
                    id="existing-conditions"
                    type="text"
                    placeholder="e.g. Hypertension, Type 2 Diabetes"
                    value={state.existingConditions}
                    onChange={(e) => updateField("existingConditions", e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="current-medications">Current Medications</label>
                  <input
                    id="current-medications"
                    type="text"
                    placeholder="e.g. Donepezil 5mg, Multivitamin"
                    value={state.currentMedications}
                    onChange={(e) => updateField("currentMedications", e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label htmlFor="allergies">Known Allergies</label>
                  <input
                    id="allergies"
                    type="text"
                    placeholder="e.g. Penicillin, Peanuts, None"
                    value={state.allergies}
                    onChange={(e) => updateField("allergies", e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="doctor-name">Treating Doctor&apos;s Name</label>
                  <input
                    id="doctor-name"
                    type="text"
                    placeholder="e.g. Dr. Catherine Hayes"
                    value={state.treatingDoctorName}
                    onChange={(e) => updateField("treatingDoctorName", e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="doctor-contact">Doctor&apos;s Contact Details</label>
                  <input
                    id="doctor-contact"
                    type="text"
                    placeholder="e.g. (555) 012-4400 / Portland Clinic"
                    value={state.doctorContact}
                    onChange={(e) => updateField("doctorContact", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* STEP 3: DOCUMENT UPLOAD */}
        {currentStep === 3 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><Upload size={22} /></span>
              <div>
                <h2>Step 3: Document &amp; Photo Upload</h2>
                <p>Upload profile pictures and medical documentation. Supported formats: JPG, PNG, PDF (up to 10MB each).</p>
              </div>
            </legend>

            <div className="step-field-group">
              {/* Profile Photo Upload */}
              <div className="upload-box-card">
                <div className="upload-box-card__header">
                  <Camera size={20} />
                  <div>
                    <h3>Patient Profile Photograph</h3>
                    <p>Helps caregivers, family, and care teams identify the patient profile.</p>
                  </div>
                </div>

                <div className="upload-dropzone">
                  {state.profilePhoto ? (
                    <div className="uploaded-preview-item">
                      <img
                        src={state.profilePhoto.dataUrl}
                        alt="Profile preview"
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
                        aria-label="Remove profile photo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="upload-dropzone__label">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleGenericFileUpload(e, "profilePhoto")}
                      />
                      <Upload size={26} />
                      <span>Click to upload or drag profile photograph here</span>
                      <small>JPG, PNG, or WebP up to 10MB</small>
                    </label>
                  )}
                </div>
              </div>

              {/* Medical Prescriptions Upload */}
              <div className="upload-box-card">
                <div className="upload-box-card__header">
                  <FileText size={20} />
                  <div>
                    <h3>Medical Prescriptions</h3>
                    <p>Upload doctor prescriptions for routine reminders and medication tracking.</p>
                  </div>
                </div>

                <div className="upload-dropzone">
                  <label className="upload-dropzone__label">
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => handleGenericFileUpload(e, "medicalPrescriptions")}
                    />
                    <Upload size={24} />
                    <span>Upload Prescriptions (PDF or Image)</span>
                  </label>
                </div>

                {state.medicalPrescriptions.length > 0 && (
                  <ul className="uploaded-files-list">
                    {state.medicalPrescriptions.map((file, idx) => (
                      <li key={file.id || idx} className="uploaded-file-row">
                        <FileText size={18} />
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                        <button
                          type="button"
                          className="button-icon-remove"
                          onClick={() => removeFileItem("medicalPrescriptions", idx)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Medical Reports & Previous Assessments */}
              <div className="form-grid-2">
                <div className="upload-box-card">
                  <div className="upload-box-card__header">
                    <FileText size={18} />
                    <div>
                      <h4>Medical Reports</h4>
                      <p>Brain MRI, CT scans, blood work (optional).</p>
                    </div>
                  </div>
                  <label className="upload-dropzone__label upload-dropzone__label--compact">
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => handleGenericFileUpload(e, "medicalReports")}
                    />
                    <Plus size={18} /> Add Reports (PDF/Image)
                  </label>
                  {state.medicalReports.length > 0 && (
                    <ul className="uploaded-files-list">
                      {state.medicalReports.map((file, idx) => (
                        <li key={file.id || idx} className="uploaded-file-row">
                          <span className="file-name">{file.name}</span>
                          <button
                            type="button"
                            className="button-icon-remove"
                            onClick={() => removeFileItem("medicalReports", idx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="upload-box-card">
                  <div className="upload-box-card__header">
                    <FileText size={18} />
                    <div>
                      <h4>Previous Assessments</h4>
                      <p>MMSE, MoCA, or cognitive tests (optional).</p>
                    </div>
                  </div>
                  <label className="upload-dropzone__label upload-dropzone__label--compact">
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,image/jpeg,image/png"
                      onChange={(e) => handleGenericFileUpload(e, "previousAssessments")}
                    />
                    <Plus size={18} /> Add Assessments (PDF/Image)
                  </label>
                  {state.previousAssessments.length > 0 && (
                    <ul className="uploaded-files-list">
                      {state.previousAssessments.map((file, idx) => (
                        <li key={file.id || idx} className="uploaded-file-row">
                          <span className="file-name">{file.name}</span>
                          <button
                            type="button"
                            className="button-icon-remove"
                            onClick={() => removeFileItem("previousAssessments", idx)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* STEP 4: FAMILY MEMORY COLLECTION */}
        {currentStep === 4 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><Heart size={22} /></span>
              <div>
                <h2>Step 4: Family Memory Collection</h2>
                <p>
                  Add photographs of cherished family members (spouse, parents, children, grandchildren). These will be gently incorporated into personalized memory exercises.
                </p>
              </div>
            </legend>

            <div className="step-field-group">
              {/* Add Memory Card Form */}
              <div className="sub-section-card sub-section-card--highlight">
                <div className="sub-section-card__header">
                  <ImageIcon size={19} />
                  <div>
                    <h3>Add a Family Member Photograph &amp; Memory</h3>
                    <p className="sub-section-card__desc">Attach a photograph, person&apos;s name, and a short sweet memory.</p>
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-field">
                    <label htmlFor="mem-name">Person&apos;s Full Name</label>
                    <input
                      id="mem-name"
                      type="text"
                      placeholder="e.g. Thomas Vance"
                      value={newMemoryName}
                      onChange={(e) => setNewMemoryName(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="mem-rel">Relationship</label>
                    <select
                      id="mem-rel"
                      className="form-select"
                      value={newMemoryRel}
                      onChange={(e) => setNewMemoryRel(e.target.value)}
                    >
                      <option value="">Select relationship</option>
                      <option value="Spouse">Spouse / Partner</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Parent">Parent</option>
                      <option value="Brother / Sister">Brother / Sister</option>
                      <option value="Grandchild">Grandchild</option>
                      <option value="Relative">Relative</option>
                      <option value="Close Friend">Close Friend</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label>Photograph</label>
                    <label className="button button--portal upload-btn-inline">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleMemoryPhotoSelected}
                      />
                      <Camera size={16} /> {newMemoryPhoto ? "Photo Attached" : "Choose Photo"}
                    </label>
                  </div>
                </div>

                <div className="form-field" style={{ marginTop: "12px" }}>
                  <label htmlFor="mem-desc">Short Description or Cherished Memory</label>
                  <textarea
                    id="mem-desc"
                    className="form-textarea"
                    rows={2}
                    placeholder="e.g. Taken during our summer picnic by the coast in 1995. Thomas loves woodworking."
                    value={newMemoryDesc}
                    onChange={(e) => setNewMemoryDesc(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={addFamilyMemory}
                  >
                    <Plus size={16} /> Save Memory Photograph
                  </button>
                </div>
              </div>

              {/* Display Added Memories */}
              {state.familyMemories.length === 0 ? (
                <div className="empty-memories-state">
                  <ImageIcon size={32} />
                  <p>No family memories added yet. You can add as many as you wish, or add them later from your profile.</p>
                </div>
              ) : (
                <div className="family-memories-grid">
                  {state.familyMemories.map((item) => (
                    <article key={item.id} className="family-memory-card">
                      {item.photo?.dataUrl ? (
                        <img
                          src={item.photo.dataUrl}
                          alt={item.personName}
                          className="family-memory-card__img"
                        />
                      ) : (
                        <div className="family-memory-card__placeholder">
                          <User size={32} />
                        </div>
                      )}
                      <div className="family-memory-card__content">
                        <h4>{item.personName}</h4>
                        <span className="family-memory-card__rel">{item.relationship}</span>
                        {item.description && (
                          <p className="family-memory-card__desc">{item.description}</p>
                        )}
                        <button
                          type="button"
                          className="button-icon-remove family-memory-card__delete"
                          onClick={() => removeFamilyMemory(item.id)}
                          aria-label={`Remove memory of ${item.personName}`}
                        >
                          <Trash2 size={15} /> Remove
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </fieldset>
        )}

        {/* STEP 5: VOICE SAMPLE COLLECTION */}
        {currentStep === 5 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><Mic size={22} /></span>
              <div>
                <h2>Step 5: Voice Sample Baseline (Optional)</h2>
                <p>
                  Record a brief voice reading. This provides a baseline for speech cadence and clarity assistance.
                </p>
              </div>
            </legend>

            <div className="step-field-group">
              <div className="form-callout-note form-callout-note--warning">
                <ShieldAlert size={19} className="form-callout-note__icon" />
                <div>
                  <strong>Important Scientific &amp; Ethical Notice:</strong>
                  <p>
                    Voice patterns do <strong>not</strong> diagnose Alzheimer&apos;s or detect dementia. No clinical claims are made. This sample is strictly preserved as an initial baseline for speech rhythm clarity and assistive research. Participation is entirely voluntary.
                  </p>
                </div>
              </div>

              {/* Reading Card */}
              <div className="voice-prompt-card">
                <span className="voice-prompt-card__badge">Sentence to read aloud:</span>
                <blockquote className="voice-prompt-sentence">
                  &ldquo;{SAMPLE_READING_SENTENCE}&rdquo;
                </blockquote>
              </div>

              {/* Voice Recorder Controls */}
              <div className="voice-recorder-widget">
                <div className="voice-recorder-widget__status">
                  {isRecording ? (
                    <span className="voice-recording-indicator">
                      <span className="recording-dot" /> Recording in progress ({recordingSeconds}s)...
                    </span>
                  ) : audioUrl ? (
                    <span className="voice-recorded-ready">
                      <CheckCircle2 size={16} /> Sample recorded ({recordingSeconds || 5}s)
                    </span>
                  ) : (
                    <span>Ready to record when you are. Speak in your normal tone.</span>
                  )}
                </div>

                <div className="voice-recorder-widget__buttons">
                  {!isRecording ? (
                    <button
                      type="button"
                      className="button button--primary button--mic"
                      onClick={startRecording}
                    >
                      <Mic size={18} /> {audioUrl ? "Record Again" : "Start Recording"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button button--destructive button--mic"
                      onClick={stopRecording}
                    >
                      <Square size={18} /> Stop Recording
                    </button>
                  )}

                  {audioUrl && !isRecording && (
                    <button
                      type="button"
                      className="button button--portal"
                      onClick={resetRecording}
                    >
                      <RotateCcw size={16} /> Reset
                    </button>
                  )}
                </div>

                {/* Audio Playback Element */}
                {audioUrl && !isRecording && (
                  <div className="audio-playback-box">
                    <audio controls src={audioUrl} className="audio-element" />
                  </div>
                )}
              </div>

              <div className="voice-skip-option">
                <p>Don&apos;t wish to record a voice sample right now?</p>
                <button
                  type="button"
                  className="button button--portal button--small"
                  onClick={() => {
                    updateField("voiceSampleSkipped", true)
                    updateField("voiceSample", null)
                    handleNext()
                  }}
                >
                  Skip Voice Sample &amp; Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </fieldset>
        )}

        {/* STEP 6: ADDITIONAL PATIENT PREFERENCES */}
        {currentStep === 6 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><Volume2 size={22} /></span>
              <div>
                <h2>Step 6: Accessibility &amp; Routine Preferences</h2>
                <p>Customize your text size, spoken instructions, and daily schedule preferences.</p>
              </div>
            </legend>

            <div className="step-field-group">
              {/* Text Size with Live Applied Effect */}
              <div className="form-field">
                <label className="field-label-prominent">
                  Text Size Preference (Applies immediately to this screen)
                </label>
                <div className="choice-cards-grid choice-cards-grid--3col">
                  {[
                    { id: "standard", label: "Standard Display", sub: "Default readable text" },
                    { id: "larger", label: "Larger Text", sub: "Enhanced readability" },
                    { id: "extra-large", label: "Extra Large Text", sub: "Maximum visual clarity" },
                  ].map(({ id, label, sub }) => (
                    <label
                      key={id}
                      className={`choice-card ${state.textSize === id ? "choice-card--selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="textSize"
                        value={id}
                        checked={state.textSize === id}
                        onChange={() =>
                          updateField(
                            "textSize",
                            id as PatientRegistrationState["textSize"]
                          )
                        }
                      />
                      <span className="choice-card__indicator" />
                      <div>
                        <strong className="choice-card__title">{label}</strong>
                        <p className="choice-card__subtext">{sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Audio Instructions Toggle */}
              <div className="sub-section-card">
                <div className="sub-section-card__header">
                  <Volume2 size={20} />
                  <div>
                    <h3>Audio Instruction Prompts</h3>
                    <p className="sub-section-card__desc">Gentle spoken voice reading prompts aloud.</p>
                  </div>
                </div>

                <label className="checkbox-item checkbox-item--prominent">
                  <input
                    type="checkbox"
                    checked={state.audioInstructions}
                    onChange={(e) => updateField("audioInstructions", e.target.checked)}
                  />
                  <span>
                    <strong>Enable Spoken Audio Prompts:</strong> Read exercises and daily reminders out loud in a comforting tone.
                  </span>
                </label>
              </div>

              {/* Daily Routines Preference */}
              <div className="sub-section-card">
                <div className="sub-section-card__header">
                  <Heart size={20} />
                  <div>
                    <h3>Daily Routine &amp; Reminders Schedule</h3>
                    <p className="sub-section-card__desc">When should gentle cognitive check-ins occur?</p>
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-field">
                    <label htmlFor="wake-time">Typical Wake-Up Time</label>
                    <select
                      id="wake-time"
                      className="form-select"
                      value={state.wakeUpTime}
                      onChange={(e) => updateField("wakeUpTime", e.target.value)}
                    >
                      <option value="06:30 AM">06:30 AM</option>
                      <option value="07:00 AM">07:00 AM</option>
                      <option value="07:30 AM">07:30 AM</option>
                      <option value="08:00 AM">08:00 AM</option>
                      <option value="08:30 AM">08:30 AM</option>
                      <option value="09:00 AM">09:00 AM</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="reminder-freq">Reminder Frequency</label>
                    <select
                      id="reminder-freq"
                      className="form-select"
                      value={state.reminderFrequency}
                      onChange={(e) => updateField("reminderFrequency", e.target.value)}
                    >
                      <option value="Morning Only">Morning Only</option>
                      <option value="Morning & Afternoon">Morning &amp; Afternoon</option>
                      <option value="Morning, Afternoon & Evening">Morning, Afternoon &amp; Evening</option>
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="pref-time">Preferred Activity Time</label>
                    <select
                      id="pref-time"
                      className="form-select"
                      value={state.preferredActivityTime}
                      onChange={(e) => updateField("preferredActivityTime", e.target.value)}
                    >
                      <option value="Morning (Calm focus)">Morning (Calm focus)</option>
                      <option value="Afternoon (Post-lunch)">Afternoon (Post-lunch)</option>
                      <option value="Early Evening">Early Evening</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* STEP 7: CONSENT AND FINAL REVIEW */}
        {currentStep === 7 && (
          <fieldset className="registration-step">
            <legend className="registration-step__header">
              <span className="registration-step__icon"><ShieldCheck size={22} /></span>
              <div>
                <h2>Step 7: Consent &amp; Final Review</h2>
                <p>Create your login credentials, review all entered details, and submit your registration.</p>
              </div>
            </legend>

            <div className="step-field-group">
              {/* Login Credentials Box */}
              <div className="sub-section-card sub-section-card--highlight">
                <div className="sub-section-card__header">
                  <ShieldCheck size={20} />
                  <div>
                    <h3>Create Account Password</h3>
                    <p className="sub-section-card__desc">Used to sign in to your patient dashboard along with your email.</p>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="patient-new-pw">
                      Create Password <span className="field-required">*</span>
                    </label>
                    <div className="password-control">
                      <input
                        id="patient-new-pw"
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
                    <label htmlFor="patient-new-pw-confirm">
                      Confirm Password <span className="field-required">*</span>
                    </label>
                    <div className="password-control">
                      <input
                        id="patient-new-pw-confirm"
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
              </div>

              {/* Complete Review Summary */}
              <div className="review-container">
                <div className="review-section-header">
                  <h3>Complete Information Review</h3>
                  <span className="review-section-header__hint">Click &quot;Edit&quot; on any section to modify</span>
                </div>

                <div className="review-cards-list">
                  {/* Step 1 Review */}
                  <div className="review-card">
                    <div className="review-card__top">
                      <h4>1. Basic Information</h4>
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
                        <span className="review-label">DOB &amp; Age:</span>
                        <span className="review-value">{state.dateOfBirth} ({state.age} yrs)</span>
                      </div>
                      <div>
                        <span className="review-label">Email:</span>
                        <span className="review-value">{state.email || "—"}</span>
                      </div>
                      <div>
                        <span className="review-label">Emergency Contact:</span>
                        <span className="review-value">{state.emergencyName} ({state.emergencyRelationship}) - {state.emergencyPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Review */}
                  <div className="review-card">
                    <div className="review-card__top">
                      <h4>2. Medical Information</h4>
                      <button type="button" className="button-edit-step" onClick={() => jumpToStep(2)}>
                        <Pencil size={13} /> Edit
                      </button>
                    </div>
                    <div className="review-card__grid">
                      <div>
                        <span className="review-label">Diagnosis Status:</span>
                        <span className="review-value">{state.diagnosisStatus}</span>
                      </div>
                      <div>
                        <span className="review-label">Disease Type:</span>
                        <span className="review-value">{state.diseaseType || "N/A"}</span>
                      </div>
                      <div>
                        <span className="review-label">Doctor:</span>
                        <span className="review-value">{state.treatingDoctorName || "None listed"}</span>
                      </div>
                      <div>
                        <span className="review-label">Allergies:</span>
                        <span className="review-value">{state.allergies || "None"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3, 4, 5, 6 Review */}
                  <div className="review-card">
                    <div className="review-card__top">
                      <h4>3-6. Documents, Memories &amp; Preferences</h4>
                      <button type="button" className="button-edit-step" onClick={() => jumpToStep(3)}>
                        <Pencil size={13} /> Edit
                      </button>
                    </div>
                    <div className="review-card__grid">
                      <div>
                        <span className="review-label">Uploaded Documents:</span>
                        <span className="review-value">
                          {state.medicalPrescriptions.length + state.medicalReports.length + state.previousAssessments.length} files
                        </span>
                      </div>
                      <div>
                        <span className="review-label">Family Memories:</span>
                        <span className="review-value">{state.familyMemories.length} photograph memories</span>
                      </div>
                      <div>
                        <span className="review-label">Voice Sample:</span>
                        <span className="review-value">{state.voiceSample ? "Sample Recorded" : "Skipped"}</span>
                      </div>
                      <div>
                        <span className="review-label">Text Size Mode:</span>
                        <span className="review-value" style={{ textTransform: "capitalize" }}>{state.textSize} text</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explicit Consents Box */}
              <div className="consent-box">
                <h3>Mandatory &amp; Voluntary Consents</h3>
                <p className="consent-box__intro">
                  Carefully review each declaration before completing your profile registration.
                </p>

                <div className="consent-checkbox-list">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={state.medicalConsent}
                      onChange={(e) => updateField("medicalConsent", e.target.checked)}
                    />
                    <span>
                      <strong>Medical Information Consent <span className="field-required">*</span>:</strong> I consent to the processing of my personal and health-related wellbeing data for personalized cognitive activities.
                    </span>
                  </label>
                  {errors.medicalConsent && <p className="field-error">{errors.medicalConsent}</p>}

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={state.documentConsent}
                      onChange={(e) => updateField("documentConsent", e.target.checked)}
                    />
                    <span>
                      <strong>Document Storage Consent <span className="field-required">*</span>:</strong> I consent to storing medical prescriptions and reports for assistive care coordination.
                    </span>
                  </label>
                  {errors.documentConsent && <p className="field-error">{errors.documentConsent}</p>}

                  <label className="checkbox-item checkbox-item--subtle">
                    <input
                      type="checkbox"
                      checked={state.familyPhotosConsent}
                      onChange={(e) => updateField("familyPhotosConsent", e.target.checked)}
                    />
                    <span>
                      <strong>Family Photographs (Optional):</strong> I consent to preserving family photographs for personalized memory recall exercises.
                    </span>
                  </label>

                  <label className="checkbox-item checkbox-item--subtle">
                    <input
                      type="checkbox"
                      checked={state.voiceConsent}
                      onChange={(e) => updateField("voiceConsent", e.target.checked)}
                    />
                    <span>
                      <strong>Voice Recording (Optional):</strong> I consent to storing my baseline voice sample for speech clarity analysis and assistive research.
                    </span>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={state.termsConsent}
                      onChange={(e) => updateField("termsConsent", e.target.checked)}
                    />
                    <span>
                      I have read and agree to the <strong>Terms and Conditions</strong> and <strong>Privacy Policy</strong>. <span className="field-required">*</span>
                    </span>
                  </label>
                  {errors.termsConsent && <p className="field-error">{errors.termsConsent}</p>}
                </div>
              </div>
            </div>
          </fieldset>
        )}

        {/* Navigation Action Buttons */}
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

          {currentStep < 7 ? (
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
                  Generating Patient Profile...
                </>
              ) : (
                <>
                  Submit Registration <Check size={18} />
                </>
              )}
            </button>
          )}
        </div>

        <div className="registration-footer-note">
          <p>
            Already have an account? <Link href="/login/user">Sign in as Patient</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
