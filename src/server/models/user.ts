export type UserRole = "patient" | "caregiver" | "admin"

export interface User {
  id: string
  fullName: string
  email: string
  mobileNumber: string
  passwordHash: string
  salt: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface PatientUser extends User {
  role: "patient"
  patientId: string // Unique backend-generated ID (e.g. MC-PAT-948123)
}

export interface CaregiverUser extends User {
  role: "caregiver"
  caregiverId: string // Unique backend-generated ID (e.g. MC-CG-482915)
}

export interface SafeUser {
  id: string
  fullName: string
  email: string
  mobileNumber: string
  role: UserRole
  patientId?: string
  caregiverId?: string
  createdAt: string
}
