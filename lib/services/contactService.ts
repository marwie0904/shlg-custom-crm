/**
 * Contact Service
 *
 * Reusable service for creating and managing contacts.
 * Maps data from various sources (intake forms, external APIs) to contact fields.
 */

import { IntakeFormData } from '@/lib/intake-constants'

// Type for contact creation data (matches Convex contacts.create args)
export interface ContactCreateData {
  // Basic Information
  prefix?: string
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  email?: string
  secondaryEmail?: string
  phone?: string
  secondaryPhone?: string
  dateOfBirth?: string
  avatar?: string
  // Source & Tags
  source?: string
  referralSource?: string
  referralOther?: string
  tags?: string[]
  // Contact Preferences
  preferredContactMethod?: string
  doNotContact?: boolean
  lastContactedAt?: number
  // General Notes
  notes?: string
  // Address
  streetAddress?: string
  streetAddress2?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  // Spouse Information
  spouseFirstName?: string
  spouseLastName?: string
  spouseEmail?: string
  spousePhone?: string
  maritalStatus?: string
  planningTogether?: string
  // Florida Residency
  floridaResident?: string
  // Children
  hasChildren?: string
  numberOfChildren?: string
  childrenAges?: string
  // Existing Documents
  hasExistingDocs?: string
  existingDocuments?: string
  isTrustFunded?: string
  // Beneficiary Section
  beneficiary_name?: string
  beneficiary_dateOfBirth?: string
  beneficiary_occupation?: string
  beneficiary_phone?: string
  beneficiary_sex?: string
  beneficiary_relationship?: string
  beneficiary_specialNeeds?: string
  beneficiary_potentialProblems?: string
  beneficiary_address?: string
  beneficiary_city?: string
  beneficiary_state?: string
  beneficiary_zipCode?: string
  beneficiary_spouseName?: string
  beneficiary_relationshipStatus?: string
  beneficiary_howManyChildren?: string
  beneficiary_agesOfChildren?: string
  // Finances Section
  finances_name?: string
  finances_representative?: string
  finances_accountType?: string
  finances_currentOwners?: string
  finances_approxValue?: string
  // DLM Section
  dlm_statement?: string
  dlm_webinarTitle?: string
  dlm_eventTitle?: string
  dlm_eventVenue?: string
  dlm_guestName?: string
  // Instagram DM Fields
  instagram_howDidYouHear?: string
  instagram_message?: string
  instagram_preferredOffice?: string
  instagram_workshopSelection?: string
  // Medicaid Intake Fields
  medicaid_primaryConcern?: string
  medicaid_assetsInvolved?: string
  // Estate Planning Intake Fields
  ep_goals?: string
  ep_callerScheduling?: string
  ep_clientJoinMeeting?: string
  ep_clientSoundMind?: string
  ep_callerFirstName?: string
  ep_callerLastName?: string
  ep_callerPhone?: string
  ep_callerEmail?: string
  ep_updateOrStartFresh?: string
  // PBTA Intake Fields
  pbta_beneficiaryDisagreements?: string
  pbta_assetOwnership?: string
  pbta_allAssetsOwnership?: string
  pbta_hasWill?: string
  pbta_accessToWill?: string
  pbta_assetsForProbate?: string
  pbta_decedentFirstName?: string
  pbta_decedentLastName?: string
  pbta_dateOfDeath?: string
  pbta_relationshipToDecedent?: string
  // Deed Intake Fields
  deed_concern?: string
  deed_needsTrustCounsel?: string
  // Doc Review Intake Fields
  docReview_floridaResident?: string
  docReview_legalAdvice?: string
  docReview_recentLifeChanges?: string
  docReview_isDocumentOwner?: string
  docReview_relationshipWithOwners?: string
  docReview_isBeneficiaryOrTrustee?: string
  docReview_hasPOA?: string
  docReview_documents?: string[]
  docReview_pendingLitigation?: string
  // Call Details
  callTranscript?: string
  callSummary?: string
  // GHL Integration
  ghlContactId?: string
}

/**
 * Maps intake form data to contact creation data.
 *
 * @param intakeData - The intake form data
 * @param options - Additional options for mapping
 * @returns ContactCreateData ready for Convex mutation
 */
export function mapIntakeToContact(
  intakeData: IntakeFormData,
  options?: {
    source?: string
    tags?: string[]
    notes?: string
  }
): ContactCreateData {
  const practiceArea = intakeData.practiceArea?.toLowerCase()

  // Build the contact data from intake fields
  const contactData: ContactCreateData = {
    // Basic Information
    firstName: intakeData.firstName || 'Unknown',
    middleName: intakeData.middleName || undefined,
    lastName: intakeData.lastName || 'Unknown',
    email: intakeData.email || undefined,
    phone: intakeData.phone || undefined,

    // Source & Tags
    source: options?.source || 'Intake Form',
    referralSource: intakeData.referralSource || undefined,
    referralOther: intakeData.referralOther || undefined,
    tags: options?.tags || [intakeData.practiceArea].filter(Boolean) as string[],

    // Notes - combine call details with any additional notes
    notes: [intakeData.callDetails, options?.notes].filter(Boolean).join('\n\n') || undefined,

    // Address
    streetAddress: intakeData.streetAddress || undefined,
    streetAddress2: intakeData.streetAddress2 || undefined,
    city: intakeData.city || undefined,
    state: intakeData.state || undefined,
    zipCode: intakeData.zipCode || undefined,
    country: intakeData.country || undefined,
  }

  // Map Estate Planning specific fields
  if (practiceArea === 'estate planning') {
    contactData.floridaResident = intakeData.ep_floridaResident || undefined
    contactData.maritalStatus = intakeData.ep_maritalStatus || undefined
    contactData.spouseFirstName = intakeData.ep_spouseFirstName || undefined
    contactData.spouseLastName = intakeData.ep_spouseLastName || undefined
    contactData.spouseEmail = intakeData.ep_spouseEmail || undefined
    contactData.spousePhone = intakeData.ep_spousePhone || undefined
    contactData.planningTogether = intakeData.ep_spousePlanningTogether || undefined
    contactData.hasChildren = intakeData.ep_hasChildren || undefined
    contactData.hasExistingDocs = intakeData.ep_hasExistingDocs || undefined
    contactData.existingDocuments = intakeData.ep_documents || undefined
    contactData.isTrustFunded = intakeData.ep_isTrustFunded || undefined
    // EP-specific fields
    contactData.ep_goals = intakeData.ep_goals || undefined
    contactData.ep_callerScheduling = intakeData.ep_callerScheduling || undefined
    contactData.ep_clientJoinMeeting = intakeData.ep_clientJoinMeeting || undefined
    contactData.ep_clientSoundMind = intakeData.ep_clientSoundMind || undefined
    contactData.ep_callerFirstName = intakeData.ep_callerFirstName || undefined
    contactData.ep_callerLastName = intakeData.ep_callerLastName || undefined
    contactData.ep_callerPhone = intakeData.ep_callerPhone || undefined
    contactData.ep_callerEmail = intakeData.ep_callerEmail || undefined
    contactData.ep_updateOrStartFresh = intakeData.ep_updateOrStartFresh || undefined
  }

  // Map Medicaid specific fields
  if (practiceArea === 'medicaid') {
    contactData.medicaid_primaryConcern = intakeData.medicaid_primaryConcern || undefined
    contactData.medicaid_assetsInvolved = intakeData.medicaid_assetsInvolved || undefined
  }

  // Map PBTA specific fields
  if (practiceArea === 'pbta') {
    contactData.pbta_beneficiaryDisagreements = intakeData.pbta_beneficiaryDisagreements || undefined
    contactData.pbta_assetOwnership = intakeData.pbta_assetOwnership || undefined
    contactData.pbta_allAssetsOwnership = intakeData.pbta_allAssetsOwnership || undefined
    contactData.pbta_hasWill = intakeData.pbta_hasWill || undefined
    contactData.pbta_accessToWill = intakeData.pbta_accessToWill || undefined
    contactData.pbta_assetsForProbate = intakeData.pbta_assetsForProbate || undefined
    contactData.pbta_decedentFirstName = intakeData.pbta_decedentFirstName || undefined
    contactData.pbta_decedentLastName = intakeData.pbta_decedentLastName || undefined
    contactData.pbta_dateOfDeath = intakeData.pbta_dateOfDeath || undefined
    contactData.pbta_relationshipToDecedent = intakeData.pbta_relationshipToDecedent || undefined
  }

  // Map Deed specific fields
  if (practiceArea === 'deed') {
    contactData.deed_concern = intakeData.deed_concern || undefined
    contactData.deed_needsTrustCounsel = intakeData.deed_needsTrustCounsel || undefined
  }

  // Map Doc Review specific fields
  if (practiceArea === 'doc review') {
    contactData.docReview_floridaResident = intakeData.docReview_floridaResident || undefined
    contactData.docReview_legalAdvice = intakeData.docReview_legalAdvice || undefined
    contactData.docReview_recentLifeChanges = intakeData.docReview_recentLifeChanges || undefined
    contactData.docReview_isDocumentOwner = intakeData.docReview_isDocumentOwner || undefined
    contactData.docReview_relationshipWithOwners = intakeData.docReview_relationshipWithOwners || undefined
    contactData.docReview_isBeneficiaryOrTrustee = intakeData.docReview_isBeneficiaryOrTrustee || undefined
    contactData.docReview_hasPOA = intakeData.docReview_hasPOA || undefined
    contactData.docReview_documents = intakeData.docReview_documents?.length > 0 ? intakeData.docReview_documents : undefined
    contactData.docReview_pendingLitigation = intakeData.docReview_pendingLitigation || undefined
    // Also map florida resident to main field if specified in doc review
    contactData.floridaResident = intakeData.docReview_floridaResident || undefined
  }

  // Clean undefined values
  return Object.fromEntries(
    Object.entries(contactData).filter(([_, value]) => value !== undefined)
  ) as ContactCreateData
}

/**
 * Check if a contact might already exist based on email or phone.
 * This is a helper to determine if we should create a new contact or link to existing.
 *
 * @param email - Email to check
 * @param phone - Phone to check
 * @returns boolean indicating if contact info is provided
 */
export function hasContactInfo(email?: string, phone?: string): boolean {
  return !!(email?.trim() || phone?.trim())
}

/**
 * Generate a display name from contact data.
 *
 * @param firstName - First name
 * @param lastName - Last name
 * @param prefix - Optional prefix
 * @param suffix - Optional suffix
 * @returns Formatted display name
 */
export function getContactDisplayName(
  firstName?: string,
  lastName?: string,
  prefix?: string,
  suffix?: string
): string {
  const parts = [prefix, firstName, lastName, suffix].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'Unknown Contact'
}
