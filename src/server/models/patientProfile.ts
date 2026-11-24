export type DiagnosisStatus = "Diagnosed" | "Suspected" | "Under Evaluation" | "Not Diagnosed"

export interface UploadedFileMeta {
  id: string
  name: string
  size: number
  type: string
  dataUrl?: string
  uploadedAt: string
}

export interface FamilyMemoryItem {
  id: string
  personName: string
  relationship: string
  description: string
  photoMeta?: UploadedFileMeta
}

export interface VoiceSampleMeta {
  id: string
  durationSeconds: number
  sentenceRead: string
  audioDataUrl?: string
  recordedAt: string
}

export interface PatientProfile {
  id: string
  userId: string
  patientId: string

  // Step 1: Basic Patient Information
  fullName: string
  dateOfBirth: string
  age: number
  gender: string
  email: string
  mobileNumber: string
  preferredLanguage: string
  address: {
    houseNumber?: string
    streetArea?: string
    city: string
    state: string
    country: string
    pinCode: string
  }
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }

  // Step 2: Medical Information
  diagnosisStatus: DiagnosisStatus
  diseaseType?: string
  diagnosisDate?: string
  currentSymptoms: string[]
  existingConditions: string
  currentMedications: string
  allergies: string
  treatingDoctorName: string
  doctorContact: string

  // Step 3: Document Uploads
  profilePhoto?: UploadedFileMeta
  medicalPrescriptions: UploadedFileMeta[]
  medicalReports: UploadedFileMeta[]
  previousAssessments: UploadedFileMeta[]

  // Step 4: Family Memory Collection
  familyMemories: FamilyMemoryItem[]

  // Step 5: Voice Sample Collection (Optional)
  voiceSample?: VoiceSampleMeta

  // Step 6: Additional Patient Preferences
  preferences: {
    textSize: "standard" | "larger" | "extra-large"
    audioInstructions: boolean
    accessibilityRequirements: string[]
    dailyRoutines: {
      wakeUpTime: string
      reminderFrequency: string
      preferredActivityTime: string
    }
  }

  // Step 7: Consents
  consents: {
    medicalDataConsent: boolean
    medicalDocumentConsent: boolean
    familyPhotosConsent: boolean
    voiceRecordingConsent: boolean
  }

  createdAt: string
  updatedAt: string
}

export interface CaregiverProfile {
  id: string
  userId: string
  caregiverId: string

  // Step 1: Personal Information
  fullName: string
  profilePhoto?: UploadedFileMeta
  dateOfBirth?: string
  gender?: string
  email: string
  mobileNumber: string
  address: {
    houseNumber?: string
    streetArea?: string
    city: string
    state: string
    country: string
    pinCode: string
  }
  preferredLanguage: string

  // Step 2: Caregiver Information
  relationshipWithPatient: string
  occupation: string
  caregivingExperience: string
  emergencyContactNumber?: string
  shortBio?: string

  // Step 3: Patient Connection Choice
  connectionMode: "connect_existing" | "register_later"
  targetPatientIdentifier?: string // Patient ID or Email

  // Step 4: Consents
  consents: {
    termsConsent: boolean
    privacyConsent: boolean
    confidentialityConsent: boolean
  }

  createdAt: string
  updatedAt: string
}
