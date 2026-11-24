export type ConnectionStatus = "Pending" | "Approved" | "Rejected" | "Revoked"

export interface PatientCaregiverConnection {
  id: string
  patientId: string // e.g. MC-PAT-941823
  patientEmail: string
  patientName: string
  caregiverId: string // e.g. MC-CG-482915
  caregiverEmail: string
  caregiverName: string
  relationship: string
  additionalNote?: string
  status: ConnectionStatus
  requestedBy: "caregiver" | "patient"
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}
