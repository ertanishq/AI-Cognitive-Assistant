import { NextResponse } from "next/server"
import { memoryStore } from "@/src/server/db/store"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      fullName,
      profilePhoto,
      dateOfBirth,
      gender,
      email,
      mobileNumber,
      address,
      preferredLanguage,
      relationshipWithPatient,
      occupation,
      caregivingExperience,
      emergencyContactNumber,
      shortBio,
      connectionMode,
      targetPatientIdentifier,
      password,
      confirmPassword,
      consents,
    } = body

    // 1. Mandatory Validations
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 })
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 })
    }

    if (!mobileNumber || mobileNumber.replace(/[^0-9]/g, "").length < 7) {
      return NextResponse.json({ error: "A valid mobile phone number is required." }, { status: 400 })
    }

    if (!relationshipWithPatient || !relationshipWithPatient.trim()) {
      return NextResponse.json({ error: "Relationship with patient is required." }, { status: 400 })
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 })
    }

    // Duplicate account check
    if (memoryStore.findUserByEmail(email)) {
      return NextResponse.json({ error: "An account with this email address already exists." }, { status: 409 })
    }

    if (memoryStore.findUserByMobile(mobileNumber)) {
      return NextResponse.json({ error: "An account with this mobile number already exists." }, { status: 409 })
    }

    // Consents check
    if (!consents?.termsConsent || !consents?.privacyConsent || !consents?.confidentialityConsent) {
      return NextResponse.json({
        error: "Terms, Privacy Agreement, and Caregiver Confidentiality Agreement must all be accepted.",
      }, { status: 400 })
    }

    // Option A: If connecting with existing patient, check if identifier is provided
    let patientVerified = false
    let targetPatientName = ""
    if (connectionMode === "connect_existing") {
      if (!targetPatientIdentifier || !targetPatientIdentifier.trim()) {
        return NextResponse.json({
          error: "Please provide the Patient ID or registered email address.",
        }, { status: 400 })
      }

      const match = memoryStore.findPatientByIdOrEmail(targetPatientIdentifier)
      if (match) {
        patientVerified = true
        targetPatientName = match.user.fullName
      }
    }

    // 2. Register Caregiver in Store
    const caregiverData = {
      fullName: fullName.trim(),
      profilePhoto: profilePhoto || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || "Prefer not to say",
      email: email.trim().toLowerCase(),
      mobileNumber: mobileNumber.trim(),
      address: {
        houseNumber: address?.houseNumber || "",
        streetArea: address?.streetArea || "",
        city: address?.city || "",
        state: address?.state || "",
        country: address?.country || "United States",
        pinCode: address?.pinCode || "",
      },
      preferredLanguage: preferredLanguage || "English",
      relationshipWithPatient: relationshipWithPatient.trim(),
      occupation: occupation || "",
      caregivingExperience: caregivingExperience || "1-3 years",
      emergencyContactNumber: emergencyContactNumber || "",
      shortBio: shortBio || "",
      connectionMode: connectionMode === "connect_existing" ? "connect_existing" as const : "register_later" as const,
      targetPatientIdentifier: targetPatientIdentifier?.trim() || "",
      consents: {
        termsConsent: Boolean(consents.termsConsent),
        privacyConsent: Boolean(consents.privacyConsent),
        confidentialityConsent: Boolean(consents.confidentialityConsent),
      },
    }

    const { safeUser, connectionRequest } = memoryStore.registerCaregiver(caregiverData, password)

    return NextResponse.json({
      success: true,
      user: safeUser,
      caregiverId: safeUser.caregiverId,
      connectionRequest: connectionRequest ? {
        id: connectionRequest.id,
        patientIdentifier: targetPatientIdentifier,
        patientName: targetPatientName || "Identified Patient",
        status: connectionRequest.status, // Strictly Pending
        note: "Connection request submitted and is currently Pending patient authorization.",
      } : null,
      patientFound: patientVerified,
      message: "Caregiver registered successfully.",
    }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
