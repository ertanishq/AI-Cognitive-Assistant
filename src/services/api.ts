import type { PatientRegistrationState, CaregiverRegistrationState, UploadedFileItem } from "../types/signup"

export interface PatientRegistrationResult {
  success: boolean
  patientId: string
  user: {
    id: string
    fullName: string
    email: string
    mobileNumber: string
    patientId: string
  }
  message: string
}

export interface CaregiverRegistrationResult {
  success: boolean
  caregiverId: string
  user: {
    id: string
    fullName: string
    email: string
    mobileNumber: string
    caregiverId: string
  }
  connectionRequest?: {
    id: string
    patientIdentifier: string
    patientName: string
    status: "Pending" | "Approved" | "Rejected" | "Revoked"
    note: string
  } | null
  patientFound?: boolean
  message: string
}

export interface PatientLookupResult {
  found: boolean
  patientId?: string
  patientName?: string
  maskedEmail?: string
  message?: string
}

export async function registerPatientApi(state: PatientRegistrationState): Promise<PatientRegistrationResult> {
  const payload = {
    fullName: state.fullName,
    dateOfBirth: state.dateOfBirth,
    gender: state.gender,
    email: state.email,
    mobileNumber: state.mobileNumber,
    password: state.password,
    confirmPassword: state.confirmPassword,
    preferredLanguage: state.preferredLanguage,
    address: {
      houseNumber: state.houseNumber,
      streetArea: state.streetArea,
      city: state.city,
      state: state.state,
      country: state.country,
      pinCode: state.pinCode,
    },
    emergencyContact: {
      name: state.emergencyName,
      phone: state.emergencyPhone,
      relationship: state.emergencyRelationship,
    },
    medical: {
      diagnosisStatus: state.diagnosisStatus,
      diseaseType: state.diseaseType,
      diagnosisDate: state.diagnosisDate,
      currentSymptoms: state.currentSymptoms,
      existingConditions: state.existingConditions,
      currentMedications: state.currentMedications,
      allergies: state.allergies,
      treatingDoctorName: state.treatingDoctorName,
      doctorContact: state.doctorContact,
    },
    profilePhoto: state.profilePhoto,
    medicalPrescriptions: state.medicalPrescriptions,
    medicalReports: state.medicalReports,
    previousAssessments: state.previousAssessments,
    familyMemories: state.familyMemories,
    voiceSample: state.voiceSample,
    preferences: {
      textSize: state.textSize,
      audioInstructions: state.audioInstructions,
      accessibilityRequirements: state.accessibilityRequirements,
      dailyRoutines: {
        wakeUpTime: state.wakeUpTime,
        reminderFrequency: state.reminderFrequency,
        preferredActivityTime: state.preferredActivityTime,
      },
    },
    consents: {
      medicalDataConsent: state.medicalConsent,
      medicalDocumentConsent: state.documentConsent,
      familyPhotosConsent: state.familyPhotosConsent,
      voiceRecordingConsent: state.voiceConsent,
    },
  }

  const res = await fetch("/api/register/patient", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Failed to register patient.")
  }

  return data
}

export async function registerCaregiverApi(state: CaregiverRegistrationState): Promise<CaregiverRegistrationResult> {
  const payload = {
    fullName: state.fullName,
    profilePhoto: state.profilePhoto,
    dateOfBirth: state.dateOfBirth,
    gender: state.gender,
    email: state.email,
    mobileNumber: state.mobileNumber,
    address: {
      houseNumber: state.houseNumber,
      streetArea: state.streetArea,
      city: state.city,
      state: state.state,
      country: state.country,
      pinCode: state.pinCode,
    },
    preferredLanguage: state.preferredLanguage,
    relationshipWithPatient: state.relationshipWithPatient,
    occupation: state.occupation,
    caregivingExperience: state.caregivingExperience,
    emergencyContactNumber: state.emergencyContactNumber,
    shortBio: state.shortBio,
    connectionMode: state.connectionChoice === "connect_now" ? "connect_existing" : "register_later",
    targetPatientIdentifier: state.connectionChoice === "connect_now" ? state.patientIdentifier : "",
    password: state.password,
    confirmPassword: state.confirmPassword,
    consents: {
      termsConsent: state.termsConsent,
      privacyConsent: state.privacyConsent,
      confidentialityConsent: state.confidentialityConsent,
    },
  }

  const res = await fetch("/api/register/caregiver", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Failed to register caregiver.")
  }

  return data
}

export async function lookupPatientApi(identifier: string): Promise<PatientLookupResult> {
  const res = await fetch(`/api/patients/lookup?identifier=${encodeURIComponent(identifier)}`)
  const data = await res.json()
  if (!res.ok) {
    return { found: false, message: data.error || "Patient not found" }
  }
  return data
}

export async function processClientFileUpload(file: File): Promise<UploadedFileItem> {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error("File exceeds 10MB limit."))
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || "Upload validation failed.")
        }

        resolve({
          id: data.file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
        })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file."))
    reader.readAsDataURL(file)
  })
}
