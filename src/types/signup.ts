export type SignUpRole = "user" | "caregiver"

export interface UploadedFileItem {
  id: string
  name: string
  size: number
  type: string
  dataUrl?: string
}

export interface FamilyMemoryEntry {
  id: string
  personName: string
  relationship: string
  description: string
  photo?: UploadedFileItem
}

export interface VoiceSampleItem {
  audioDataUrl: string
  durationSeconds: number
  sentenceRead: string
  recordedAt: string
}

export interface PatientRegistrationState {
  // Account Security
  password: string
  confirmPassword: string

  // Step 1: Basic Information
  fullName: string
  dateOfBirth: string // mandatory
  age: number // auto-calculated
  gender: string
  email: string
  mobileNumber: string
  preferredLanguage: string
  houseNumber: string
  streetArea: string
  city: string
  state: string
  country: string
  pinCode: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelationship: string

  // Step 2: Medical Information
  diagnosisStatus: "Diagnosed" | "Suspected" | "Under Evaluation" | "Not Diagnosed"
  diseaseType: string
  diagnosisDate: string
  currentSymptoms: string[]
  existingConditions: string
  currentMedications: string
  allergies: string
  treatingDoctorName: string
  doctorContact: string

  // Step 3: Document Uploads
  profilePhoto: UploadedFileItem | null
  medicalPrescriptions: UploadedFileItem[]
  medicalReports: UploadedFileItem[]
  previousAssessments: UploadedFileItem[]

  // Step 4: Family Memory Collection
  familyMemories: FamilyMemoryEntry[]

  // Step 5: Voice Sample Collection (Optional)
  voiceSample: VoiceSampleItem | null
  voiceSampleSkipped: boolean

  // Step 6: Additional Patient Preferences
  textSize: "standard" | "larger" | "extra-large"
  audioInstructions: boolean
  accessibilityRequirements: string[]
  wakeUpTime: string
  reminderFrequency: string
  preferredActivityTime: string

  // Step 7: Consent & Final Review
  medicalConsent: boolean
  documentConsent: boolean
  familyPhotosConsent: boolean
  voiceConsent: boolean
  termsConsent: boolean
}

export interface CaregiverRegistrationState {
  // Step 1: Personal Information
  fullName: string
  profilePhoto: UploadedFileItem | null
  dateOfBirth: string // optional
  gender: string
  email: string
  mobileNumber: string
  houseNumber: string
  streetArea: string
  city: string
  state: string
  country: string
  pinCode: string
  preferredLanguage: string

  // Step 2: Caregiver Information
  relationshipWithPatient: string
  occupation: string
  caregivingExperience: string
  emergencyContactNumber: string
  shortBio: string

  // Step 3: Patient Connection
  connectionChoice: "connect_now" | "register_later"
  patientIdentifier: string // Patient ID or Email
  patientVerificationName?: string // verified lookup name
  connectionRelationship: string
  connectionNote: string

  // Step 4: Account Security & Consent
  password: string
  confirmPassword: string
  termsConsent: boolean
  privacyConsent: boolean
  confidentialityConsent: boolean
}
