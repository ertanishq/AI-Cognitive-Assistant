import crypto from "node:crypto"
import type { User, PatientUser, CaregiverUser, SafeUser } from "../models/user"
import type { PatientProfile, CaregiverProfile } from "../models/patientProfile"
import type { PatientCaregiverConnection, ConnectionStatus } from "../models/connection"

/**
 * In-Memory Database Store for MemoryCare Development.
 * 
 * NOTE: This is an in-memory data store for local development and demonstration.
 * Data is retained during application runtime and will be reset if the server restarts.
 * The architecture and interfaces are modular to ensure seamless future MongoDB / Mongoose integration.
 */
class MemoryStore {
  private users = new Map<string, User>()
  private patientProfiles = new Map<string, PatientProfile>()
  private caregiverProfiles = new Map<string, CaregiverProfile>()
  private connections = new Map<string, PatientCaregiverConnection>()

  constructor() {
    this.seedInitialData()
  }

  // Pre-seed mock accounts for testing and verification
  private seedInitialData() {
    // Demo Patient
    const demoPatientId = "MC-PAT-738492"
    const patientSalt = crypto.randomBytes(16).toString("hex")
    const patientPasswordHash = this.hashPassword("Password123!", patientSalt)

    const demoPatientUser: PatientUser = {
      id: "usr_pat_demo_01",
      patientId: demoPatientId,
      fullName: "Eleanor Vance",
      email: "eleanor.vance@example.com",
      mobileNumber: "+1 (555) 019-2834",
      passwordHash: patientPasswordHash,
      salt: patientSalt,
      role: "patient",
      createdAt: new Date("2026-01-15").toISOString(),
      updatedAt: new Date("2026-01-15").toISOString(),
    }
    this.users.set(demoPatientUser.id, demoPatientUser)

    const demoPatientProfile: PatientProfile = {
      id: "prof_pat_demo_01",
      userId: demoPatientUser.id,
      patientId: demoPatientId,
      fullName: "Eleanor Vance",
      dateOfBirth: "1952-04-12",
      age: 74,
      gender: "Female",
      email: demoPatientUser.email,
      mobileNumber: demoPatientUser.mobileNumber,
      preferredLanguage: "English",
      address: {
        houseNumber: "Apt 4B",
        streetArea: "Sunflower Manor",
        city: "Portland",
        state: "Oregon",
        country: "United States",
        pinCode: "97201",
      },
      emergencyContact: {
        name: "Robert Vance",
        phone: "+1 (555) 019-3344",
        relationship: "Son",
      },
      diagnosisStatus: "Diagnosed",
      diseaseType: "Early-Onset Alzheimer's",
      diagnosisDate: "2024-06-18",
      currentSymptoms: ["Short-term memory lapses", "Occasional word-finding pauses"],
      existingConditions: "Mild hypertension",
      currentMedications: "Donepezil 5mg, Lisinopril 10mg",
      allergies: "Penicillin",
      treatingDoctorName: "Dr. Catherine Hayes",
      doctorContact: "Portland Memory Clinic (555) 012-4400",
      medicalPrescriptions: [],
      medicalReports: [],
      previousAssessments: [],
      familyMemories: [],
      preferences: {
        textSize: "larger",
        audioInstructions: true,
        accessibilityRequirements: ["Clear step-by-step layout"],
        dailyRoutines: {
          wakeUpTime: "07:30 AM",
          reminderFrequency: "Morning & Afternoon",
          preferredActivityTime: "Morning",
        },
      },
      consents: {
        medicalDataConsent: true,
        medicalDocumentConsent: true,
        familyPhotosConsent: true,
        voiceRecordingConsent: true,
      },
      createdAt: new Date("2026-01-15").toISOString(),
      updatedAt: new Date("2026-01-15").toISOString(),
    }
    this.patientProfiles.set(demoPatientProfile.patientId, demoPatientProfile)
  }

  // --- Security & Hashing Helpers ---

  public hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString("hex")
  }

  public verifyPassword(password: string, salt: string, hash: string): boolean {
    const computed = crypto.scryptSync(password, salt, 64).toString("hex")
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))
  }

  public toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      patientId: (user as PatientUser).patientId,
      caregiverId: (user as CaregiverUser).caregiverId,
      createdAt: user.createdAt,
    }
  }

  // Generate unique, non-sequential Patient ID (e.g. MC-PAT-938214)
  public generatePatientId(): string {
    let candidate = ""
    let exists = true
    while (exists) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000).toString()
      candidate = `MC-PAT-${randomDigits}`
      exists = Array.from(this.users.values()).some(
        (u) => (u as PatientUser).patientId === candidate
      )
    }
    return candidate
  }

  // Generate unique Caregiver ID (e.g. MC-CG-482915)
  public generateCaregiverId(): string {
    let candidate = ""
    let exists = true
    while (exists) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000).toString()
      candidate = `MC-CG-${randomDigits}`
      exists = Array.from(this.users.values()).some(
        (u) => (u as CaregiverUser).caregiverId === candidate
      )
    }
    return candidate
  }

  // --- Lookup Methods ---

  public findUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase()
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === normalized
    )
  }

  public findUserByMobile(mobile: string): User | undefined {
    const cleanNumber = mobile.replace(/[^0-9]/g, "")
    return Array.from(this.users.values()).find((u) => {
      const storedClean = u.mobileNumber.replace(/[^0-9]/g, "")
      return storedClean.length > 5 && storedClean === cleanNumber
    })
  }

  public findPatientByIdOrEmail(identifier: string): { user: PatientUser; profile?: PatientProfile } | null {
    const trimmed = identifier.trim()
    const isEmail = trimmed.includes("@")

    let foundUser: PatientUser | undefined

    if (isEmail) {
      foundUser = Array.from(this.users.values()).find(
        (u): u is PatientUser => u.role === "patient" && u.email.toLowerCase() === trimmed.toLowerCase()
      )
    } else {
      foundUser = Array.from(this.users.values()).find(
        (u): u is PatientUser =>
          u.role === "patient" && (u as PatientUser).patientId?.toUpperCase() === trimmed.toUpperCase()
      )
    }

    if (!foundUser) return null

    const profile = this.patientProfiles.get(foundUser.patientId)
    return { user: foundUser, profile }
  }

  // --- Registration Operations ---

  public registerPatient(
    patientData: Omit<PatientProfile, "id" | "userId" | "patientId" | "createdAt" | "updatedAt">,
    passwordPlain: string
  ): { safeUser: SafeUser; patientProfile: PatientProfile } {
    // Generate IDs and secure credentials
    const userId = `usr_pat_${crypto.randomUUID()}`
    const patientId = this.generatePatientId()
    const salt = crypto.randomBytes(16).toString("hex")
    const passwordHash = this.hashPassword(passwordPlain, salt)
    const now = new Date().toISOString()

    const newUser: PatientUser = {
      id: userId,
      patientId,
      fullName: patientData.fullName,
      email: patientData.email,
      mobileNumber: patientData.mobileNumber,
      passwordHash,
      salt,
      role: "patient",
      createdAt: now,
      updatedAt: now,
    }

    const newProfile: PatientProfile = {
      ...patientData,
      id: `prof_pat_${crypto.randomUUID()}`,
      userId,
      patientId,
      createdAt: now,
      updatedAt: now,
    }

    this.users.set(userId, newUser)
    this.patientProfiles.set(patientId, newProfile)

    return {
      safeUser: this.toSafeUser(newUser),
      patientProfile: newProfile,
    }
  }

  public registerCaregiver(
    caregiverData: Omit<CaregiverProfile, "id" | "userId" | "caregiverId" | "createdAt" | "updatedAt">,
    passwordPlain: string
  ): {
    safeUser: SafeUser
    caregiverProfile: CaregiverProfile
    connectionRequest?: PatientCaregiverConnection
  } {
    const userId = `usr_cg_${crypto.randomUUID()}`
    const caregiverId = this.generateCaregiverId()
    const salt = crypto.randomBytes(16).toString("hex")
    const passwordHash = this.hashPassword(passwordPlain, salt)
    const now = new Date().toISOString()

    const newUser: CaregiverUser = {
      id: userId,
      caregiverId,
      fullName: caregiverData.fullName,
      email: caregiverData.email,
      mobileNumber: caregiverData.mobileNumber,
      passwordHash,
      salt,
      role: "caregiver",
      createdAt: now,
      updatedAt: now,
    }

    const newProfile: CaregiverProfile = {
      ...caregiverData,
      id: `prof_cg_${crypto.randomUUID()}`,
      userId,
      caregiverId,
      createdAt: now,
      updatedAt: now,
    }

    this.users.set(userId, newUser)
    this.caregiverProfiles.set(caregiverId, newProfile)

    let connectionRequest: PatientCaregiverConnection | undefined

    // If caregiver requested connection during registration
    if (
      caregiverData.connectionMode === "connect_existing" &&
      caregiverData.targetPatientIdentifier
    ) {
      const match = this.findPatientByIdOrEmail(caregiverData.targetPatientIdentifier)
      const connId = `conn_${crypto.randomUUID()}`

      connectionRequest = {
        id: connId,
        patientId: match ? match.user.patientId : "PENDING_LOOKUP",
        patientEmail: match ? match.user.email : caregiverData.targetPatientIdentifier,
        patientName: match ? match.user.fullName : "Requested Patient",
        caregiverId,
        caregiverEmail: newUser.email,
        caregiverName: newUser.fullName,
        relationship: caregiverData.relationshipWithPatient,
        status: "Pending", // Strictly Pending until verified and approved
        requestedBy: "caregiver",
        createdAt: now,
        updatedAt: now,
      }

      this.connections.set(connId, connectionRequest)
    }

    return {
      safeUser: this.toSafeUser(newUser),
      caregiverProfile: newProfile,
      connectionRequest,
    }
  }

  // --- Patient-Caregiver Connection Management ---

  public createConnectionRequest(
    caregiverId: string,
    targetPatientIdentifier: string,
    relationship: string,
    additionalNote?: string
  ): PatientCaregiverConnection {
    const caregiver = Array.from(this.users.values()).find(
      (u): u is CaregiverUser => (u as CaregiverUser).caregiverId === caregiverId
    )
    if (!caregiver) {
      throw new Error("Caregiver account not found.")
    }

    const patientMatch = this.findPatientByIdOrEmail(targetPatientIdentifier)
    if (!patientMatch) {
      throw new Error("No patient found with the provided Patient ID or registered email address.")
    }

    const now = new Date().toISOString()
    const connId = `conn_${crypto.randomUUID()}`

    const newConnection: PatientCaregiverConnection = {
      id: connId,
      patientId: patientMatch.user.patientId,
      patientEmail: patientMatch.user.email,
      patientName: patientMatch.user.fullName,
      caregiverId,
      caregiverEmail: caregiver.email,
      caregiverName: caregiver.fullName,
      relationship,
      additionalNote,
      status: "Pending",
      requestedBy: "caregiver",
      createdAt: now,
      updatedAt: now,
    }

    this.connections.set(connId, newConnection)
    return newConnection
  }

  public updateConnectionStatus(connectionId: string, newStatus: ConnectionStatus): PatientCaregiverConnection {
    const conn = this.connections.get(connectionId)
    if (!conn) {
      throw new Error("Connection request not found.")
    }

    conn.status = newStatus
    conn.updatedAt = new Date().toISOString()
    if (newStatus !== "Pending") {
      conn.resolvedAt = conn.updatedAt
    }

    this.connections.set(connectionId, conn)
    return conn
  }

  public getConnectionsForPatient(patientId: string): PatientCaregiverConnection[] {
    return Array.from(this.connections.values()).filter((c) => c.patientId === patientId)
  }

  public getConnectionsForCaregiver(caregiverId: string): PatientCaregiverConnection[] {
    return Array.from(this.connections.values()).filter((c) => c.caregiverId === caregiverId)
  }
}

// Global Singleton Instance across Next.js module reloads
const globalForStore = globalThis as unknown as { __memoryCareStore?: MemoryStore }
export const memoryStore = globalForStore.__memoryCareStore || new MemoryStore()
if (process.env.NODE_ENV !== "production") globalForStore.__memoryCareStore = memoryStore
