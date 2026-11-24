import { NextResponse } from "next/server"
import { memoryStore } from "@/src/server/db/store"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 1. Validate mandatory fields
    const {
      fullName,
      dateOfBirth,
      gender,
      email,
      mobileNumber,
      password,
      confirmPassword,
      preferredLanguage,
      address,
      emergencyContact,
      medical,
      preferences,
      consents,
    } = body

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 })
    }

    if (!dateOfBirth) {
      return NextResponse.json({ error: "Date of Birth is mandatory." }, { status: 400 })
    }

    const birthDate = new Date(dateOfBirth)
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json({ error: "Invalid Date of Birth." }, { status: 400 })
    }

    // Auto-calculate age on backend to verify integrity
    const today = new Date()
    let calculatedAge = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--
    }

    if (calculatedAge < 0 || calculatedAge > 125) {
      return NextResponse.json({ error: "Calculated age is outside valid boundaries." }, { status: 400 })
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 })
    }

    if (!mobileNumber || mobileNumber.replace(/[^0-9]/g, "").length < 7) {
      return NextResponse.json({ error: "A valid mobile phone number is required." }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 })
    }

    // Check duplicate email or mobile
    if (memoryStore.findUserByEmail(email)) {
      return NextResponse.json({ error: "An account with this email address already exists." }, { status: 409 })
    }

    if (memoryStore.findUserByMobile(mobileNumber)) {
      return NextResponse.json({ error: "An account with this mobile number already exists." }, { status: 409 })
    }

    // Validate consents
    if (!consents?.medicalDataConsent) {
      return NextResponse.json({ error: "Consent for processing medical information is required." }, { status: 400 })
    }

    // Validate conditional medical information if diagnosed
    const diagnosisStatus = medical?.diagnosisStatus || "Not Diagnosed"
    if (diagnosisStatus === "Diagnosed" && !medical?.diseaseType) {
      return NextResponse.json({ error: "Disease type is required when diagnosis is confirmed." }, { status: 400 })
    }

    // 2. Perform Registration in Store
    const patientData = {
      fullName: fullName.trim(),
      dateOfBirth,
      age: calculatedAge,
      gender: gender || "Prefer not to say",
      email: email.trim().toLowerCase(),
      mobileNumber: mobileNumber.trim(),
      preferredLanguage: preferredLanguage || "English",
      address: {
        houseNumber: address?.houseNumber || "",
        streetArea: address?.streetArea || "",
        city: address?.city || "",
        state: address?.state || "",
        country: address?.country || "United States",
        pinCode: address?.pinCode || "",
      },
      emergencyContact: {
        name: emergencyContact?.name || "",
        phone: emergencyContact?.phone || "",
        relationship: emergencyContact?.relationship || "",
      },
      diagnosisStatus,
      diseaseType: medical?.diseaseType || "",
      diagnosisDate: medical?.diagnosisDate || "",
      currentSymptoms: Array.isArray(medical?.currentSymptoms) ? medical.currentSymptoms : [],
      existingConditions: medical?.existingConditions || "",
      currentMedications: medical?.currentMedications || "",
      allergies: medical?.allergies || "",
      treatingDoctorName: medical?.treatingDoctorName || "",
      doctorContact: medical?.doctorContact || "",
      profilePhoto: body.profilePhoto || undefined,
      medicalPrescriptions: Array.isArray(body.medicalPrescriptions) ? body.medicalPrescriptions : [],
      medicalReports: Array.isArray(body.medicalReports) ? body.medicalReports : [],
      previousAssessments: Array.isArray(body.previousAssessments) ? body.previousAssessments : [],
      familyMemories: Array.isArray(body.familyMemories) ? body.familyMemories : [],
      voiceSample: body.voiceSample || undefined,
      preferences: {
        textSize: preferences?.textSize || "standard",
        audioInstructions: Boolean(preferences?.audioInstructions),
        accessibilityRequirements: Array.isArray(preferences?.accessibilityRequirements)
          ? preferences.accessibilityRequirements
          : [],
        dailyRoutines: {
          wakeUpTime: preferences?.dailyRoutines?.wakeUpTime || "08:00 AM",
          reminderFrequency: preferences?.dailyRoutines?.reminderFrequency || "Morning & Evening",
          preferredActivityTime: preferences?.dailyRoutines?.preferredActivityTime || "Morning",
        },
      },
      consents: {
        medicalDataConsent: Boolean(consents.medicalDataConsent),
        medicalDocumentConsent: Boolean(consents.medicalDocumentConsent),
        familyPhotosConsent: Boolean(consents.familyPhotosConsent),
        voiceRecordingConsent: Boolean(consents.voiceRecordingConsent),
      },
    }

    const { safeUser } = memoryStore.registerPatient(patientData, password)

    return NextResponse.json({
      success: true,
      user: safeUser,
      patientId: safeUser.patientId,
      message: "Patient registered successfully.",
    }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
