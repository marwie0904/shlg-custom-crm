// Intake Form Constants

export const practiceAreaOptions = [
  'Estate Planning',
  'PBTA',
  'Medicaid',
  'Deed',
  'Other/Out of Practice Area',
  'Doc Review',
] as const

export const referralSourceOptions = [
  'AAA',
  'BNI',
  'Bonita Senior Center',
  'DLM - Seminar',
  'DLM - Webinar',
  'Facebook',
  'Foot Traffic',
  'Google',
  'Google - Local Service Ads',
  'Google - LSA Bonita Springs',
  'Google - LSA Fort Myers',
  'Google - LSA Naples',
  'Inbound Phone Call',
  'Instagram',
  'LexReception',
  'Organic Facebook Posts',
  'Radio',
  'Referral Partners: Community/Organizers',
  'Referral: Business Network',
  'Referral: Previous/Existing Client',
  'Senior Blue Book',
  'Senior Blue Book Event',
  'Website',
  'Website - Chat Widget',
  'Website - Contact Us Form',
  'Website - Estate Planning - Lead Magnet',
  'Website - Medicaid Lead Magnet',
  'Website - Pool Naples',
  'Website - Probate Lead Magnet',
  'Website - Webinar Registration',
  'Website - Workshop Registration',
  'Word Of Mouth',
  'Others',
] as const

export const defaultMeetingTypes = [
  'EP Discovery Call',
  'Deed Discovery Call',
  'Probate Discovery Call',
  'Trust Admin Meeting',
  'Initial Meeting',
  'Vision Meeting',
  'Doc Review Meeting',
  'Standalone Meeting',
] as const

export const defaultLocations = [
  { id: 'naples', name: 'Naples' },
  { id: 'bonita', name: 'Bonita Springs' },
  { id: 'zoom', name: 'Zoom' },
  { id: 'phone', name: 'Phone Call' },
] as const

export const defaultStaffOptions = [
  { id: 'jacqui', name: 'Jacqui Calma' },
  { id: 'andy', name: 'Andy Baker' },
  { id: 'gabriella', name: 'Gabriella Ang' },
  { id: 'marwie', name: 'Mar Wie Ang' },
] as const

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const

export const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export interface IntakeFormData {
  createPdf: string
  practiceArea: string
  callDetails: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
  streetAddress: string
  streetAddress2: string
  city: string
  state: string
  zipCode: string
  country: string
  referralSource: string
  referralOther: string
  // Estate Planning fields
  ep_goals: string
  ep_callerScheduling: string
  ep_clientJoinMeeting: string
  ep_clientSoundMind: string
  ep_callerFirstName: string
  ep_callerLastName: string
  ep_callerPhone: string
  ep_callerEmail: string
  ep_floridaResident: string
  ep_maritalStatus: string
  ep_spouseFirstName: string
  ep_spouseLastName: string
  ep_spouseEmail: string
  ep_spousePhone: string
  ep_spousePlanningTogether: string
  ep_hasChildren: string
  ep_hasExistingDocs: string
  ep_documents: string
  ep_isTrustFunded: string
  ep_updateOrStartFresh: string
  // PBTA fields
  pbta_beneficiaryDisagreements: string
  pbta_assetOwnership: string
  pbta_allAssetsOwnership: string
  pbta_hasWill: string
  pbta_accessToWill: string
  pbta_assetsForProbate: string
  pbta_decedentFirstName: string
  pbta_decedentLastName: string
  pbta_dateOfDeath: string
  pbta_relationshipToDecedent: string
  // Medicaid fields
  medicaid_primaryConcern: string
  medicaid_assetsInvolved: string
  // Deed fields
  deed_concern: string
  deed_needsTrustCounsel: string
  // Doc Review fields
  docReview_floridaResident: string
  docReview_legalAdvice: string
  docReview_recentLifeChanges: string
  docReview_isDocumentOwner: string
  docReview_relationshipWithOwners: string
  docReview_isBeneficiaryOrTrustee: string
  docReview_hasPOA: string
  docReview_documents: string[]
  docReview_pendingLitigation: string
}

export const initialFormData: IntakeFormData = {
  createPdf: '',
  practiceArea: '',
  callDetails: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  streetAddress: '',
  streetAddress2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
  referralSource: '',
  referralOther: '',
  // Estate Planning fields
  ep_goals: '',
  ep_callerScheduling: '',
  ep_clientJoinMeeting: '',
  ep_clientSoundMind: '',
  ep_callerFirstName: '',
  ep_callerLastName: '',
  ep_callerPhone: '',
  ep_callerEmail: '',
  ep_floridaResident: '',
  ep_maritalStatus: '',
  ep_spouseFirstName: '',
  ep_spouseLastName: '',
  ep_spouseEmail: '',
  ep_spousePhone: '',
  ep_spousePlanningTogether: '',
  ep_hasChildren: '',
  ep_hasExistingDocs: '',
  ep_documents: '',
  ep_isTrustFunded: '',
  ep_updateOrStartFresh: '',
  // PBTA fields
  pbta_beneficiaryDisagreements: '',
  pbta_assetOwnership: '',
  pbta_allAssetsOwnership: '',
  pbta_hasWill: '',
  pbta_accessToWill: '',
  pbta_assetsForProbate: '',
  pbta_decedentFirstName: '',
  pbta_decedentLastName: '',
  pbta_dateOfDeath: '',
  pbta_relationshipToDecedent: '',
  // Medicaid fields
  medicaid_primaryConcern: '',
  medicaid_assetsInvolved: '',
  // Deed fields
  deed_concern: '',
  deed_needsTrustCounsel: '',
  // Doc Review fields
  docReview_floridaResident: '',
  docReview_legalAdvice: '',
  docReview_recentLifeChanges: '',
  docReview_isDocumentOwner: '',
  docReview_relationshipWithOwners: '',
  docReview_isBeneficiaryOrTrustee: '',
  docReview_hasPOA: '',
  docReview_documents: [],
  docReview_pendingLitigation: '',
}

export function getMissingFields(formData: IntakeFormData): string[] {
  const missing: string[] = []

  // Basic required fields
  if (!formData.firstName) missing.push('First Name')
  if (!formData.lastName) missing.push('Last Name')
  if (!formData.email) missing.push('Email')
  if (!formData.phone) missing.push('Phone')
  if (!formData.practiceArea) missing.push('Practice Area')
  if (!formData.callDetails) missing.push('Call Details')

  // Practice area-specific fields
  const practiceArea = formData.practiceArea?.toLowerCase()

  if (practiceArea === 'estate planning') {
    if (!formData.ep_goals) missing.push('Estate Planning Goals')
    if (!formData.ep_callerScheduling) missing.push('Is caller scheduling on behalf?')
    if (!formData.ep_floridaResident) missing.push('Florida Resident status')
    if (!formData.ep_maritalStatus) missing.push('Marital Status')
    if (!formData.ep_hasChildren) missing.push('Has Children')
    if (!formData.ep_hasExistingDocs) missing.push('Has Existing Documents')
  }

  if (practiceArea === 'pbta') {
    if (!formData.pbta_beneficiaryDisagreements) missing.push('Beneficiary Disagreements')
    if (!formData.pbta_assetOwnership) missing.push('Asset Ownership')
    if (!formData.pbta_hasWill) missing.push('Was there a Will')
    if (!formData.pbta_decedentFirstName) missing.push('Decedent First Name')
    if (!formData.pbta_decedentLastName) missing.push('Decedent Last Name')
    if (!formData.pbta_dateOfDeath) missing.push('Date of Death')
    if (!formData.pbta_relationshipToDecedent) missing.push('Relationship to Decedent')
  }

  if (practiceArea === 'medicaid') {
    if (!formData.medicaid_primaryConcern) missing.push('Primary Concern')
  }

  if (practiceArea === 'deed') {
    if (!formData.deed_concern) missing.push('Deed Concern')
    if (!formData.deed_needsTrustCounsel) missing.push('Needs Trust Counsel')
  }

  if (practiceArea === 'doc review') {
    if (!formData.docReview_floridaResident) missing.push('Florida Resident')
    if (!formData.docReview_legalAdvice) missing.push('Legal Advice Sought')
    if (!formData.docReview_recentLifeChanges) missing.push('Recent Life Changes')
    if (!formData.docReview_isDocumentOwner) missing.push('Document Owner')
    if (!formData.docReview_isBeneficiaryOrTrustee) missing.push('Beneficiary/Trustee Status')
    if (!formData.docReview_hasPOA) missing.push('Has POA')
    if (!formData.docReview_documents || formData.docReview_documents.length === 0) missing.push('Documents')
    if (!formData.docReview_pendingLitigation) missing.push('Pending Litigation')
  }

  return missing
}
