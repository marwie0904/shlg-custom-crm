import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==========================================
  // CONTACTS - Root Table
  // ==========================================
  contacts: defineTable({
    // Basic Information
    prefix: v.optional(v.string()), // "Mr.", "Mrs.", "Dr.", etc.
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    suffix: v.optional(v.string()), // "Jr.", "Sr.", "III", etc.
    email: v.optional(v.string()),
    secondaryEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    secondaryPhone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    avatar: v.optional(v.string()), // URL to profile picture

    // Source & Tags
    source: v.optional(v.string()), // "Website", "Referral", "Google Ads", "Social Media", "Walk-in", etc.
    referralSource: v.optional(v.string()), // Specific referral source
    referralOther: v.optional(v.string()), // Custom referral source
    tags: v.optional(v.array(v.string())), // ["VIP", "Urgent", "New Lead", etc.]

    // Contact Preferences
    preferredContactMethod: v.optional(v.string()), // "phone", "email", "sms", "messenger"
    doNotContact: v.optional(v.boolean()),
    lastContactedAt: v.optional(v.number()),

    // General Notes
    notes: v.optional(v.string()),

    // Address
    streetAddress: v.optional(v.string()),
    streetAddress2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),

    // Spouse Information
    spouseFirstName: v.optional(v.string()),
    spouseLastName: v.optional(v.string()),
    spouseEmail: v.optional(v.string()),
    spousePhone: v.optional(v.string()),
    maritalStatus: v.optional(v.string()), // "Single", "Married", "Divorced", "Widowed"
    planningTogether: v.optional(v.string()), // "Yes", "No"

    // Florida Residency
    floridaResident: v.optional(v.string()), // "Yes", "No", "Planning to become resident"

    // Children
    hasChildren: v.optional(v.string()),
    numberOfChildren: v.optional(v.string()),
    childrenAges: v.optional(v.string()),

    // Existing Documents
    hasExistingDocs: v.optional(v.string()),
    existingDocuments: v.optional(v.string()),
    isTrustFunded: v.optional(v.string()),

    // Beneficiary Section
    beneficiary_name: v.optional(v.string()),
    beneficiary_dateOfBirth: v.optional(v.string()),
    beneficiary_occupation: v.optional(v.string()),
    beneficiary_phone: v.optional(v.string()),
    beneficiary_sex: v.optional(v.string()),
    beneficiary_relationship: v.optional(v.string()),
    beneficiary_specialNeeds: v.optional(v.string()),
    beneficiary_potentialProblems: v.optional(v.string()),
    beneficiary_address: v.optional(v.string()),
    beneficiary_city: v.optional(v.string()),
    beneficiary_state: v.optional(v.string()),
    beneficiary_zipCode: v.optional(v.string()),
    beneficiary_spouseName: v.optional(v.string()),
    beneficiary_relationshipStatus: v.optional(v.string()),
    beneficiary_howManyChildren: v.optional(v.string()),
    beneficiary_agesOfChildren: v.optional(v.string()),

    // Finances Section
    finances_name: v.optional(v.string()),
    finances_representative: v.optional(v.string()),
    finances_accountType: v.optional(v.string()),
    finances_currentOwners: v.optional(v.string()),
    finances_approxValue: v.optional(v.string()),

    // DLM Section
    dlm_statement: v.optional(v.string()),
    dlm_webinarTitle: v.optional(v.string()),
    dlm_eventTitle: v.optional(v.string()),
    dlm_eventVenue: v.optional(v.string()),
    dlm_guestName: v.optional(v.string()),

    // Instagram DM Fields
    instagram_howDidYouHear: v.optional(v.string()),
    instagram_message: v.optional(v.string()),
    instagram_preferredOffice: v.optional(v.string()),
    instagram_workshopSelection: v.optional(v.string()),

    // Medicaid - Intake Form Fields
    medicaid_primaryConcern: v.optional(v.string()),
    medicaid_assetsInvolved: v.optional(v.string()),

    // Estate Planning - Intake Form Fields
    ep_goals: v.optional(v.string()),
    ep_callerScheduling: v.optional(v.string()),
    ep_clientJoinMeeting: v.optional(v.string()),
    ep_clientSoundMind: v.optional(v.string()),
    ep_callerFirstName: v.optional(v.string()),
    ep_callerLastName: v.optional(v.string()),
    ep_callerPhone: v.optional(v.string()),
    ep_callerEmail: v.optional(v.string()),
    ep_updateOrStartFresh: v.optional(v.string()),

    // PBTA - Intake Form Fields
    pbta_beneficiaryDisagreements: v.optional(v.string()),
    pbta_assetOwnership: v.optional(v.string()),
    pbta_allAssetsOwnership: v.optional(v.string()),
    pbta_hasWill: v.optional(v.string()),
    pbta_accessToWill: v.optional(v.string()),
    pbta_assetsForProbate: v.optional(v.string()),
    pbta_decedentFirstName: v.optional(v.string()),
    pbta_decedentLastName: v.optional(v.string()),
    pbta_dateOfDeath: v.optional(v.string()),
    pbta_relationshipToDecedent: v.optional(v.string()),

    // Deed - Intake Form Fields
    deed_concern: v.optional(v.string()),
    deed_needsTrustCounsel: v.optional(v.string()),

    // Doc Review - Intake Form Fields
    docReview_floridaResident: v.optional(v.string()),
    docReview_legalAdvice: v.optional(v.string()),
    docReview_recentLifeChanges: v.optional(v.string()),
    docReview_isDocumentOwner: v.optional(v.string()),
    docReview_relationshipWithOwners: v.optional(v.string()),
    docReview_isBeneficiaryOrTrustee: v.optional(v.string()),
    docReview_hasPOA: v.optional(v.string()),
    docReview_documents: v.optional(v.array(v.string())),
    docReview_pendingLitigation: v.optional(v.string()),

    // Call Details
    callTranscript: v.optional(v.string()),
    callSummary: v.optional(v.string()),

    // GHL Integration
    ghlContactId: v.optional(v.string()),

    // Intake Reference (tracks which intake created this contact)
    intakeId: v.optional(v.id("intake")),

    // Meta/Facebook Integration
    metaPsid: v.optional(v.string()), // Facebook Page-Scoped ID (for Messenger)
    metaIgsid: v.optional(v.string()), // Instagram-Scoped ID (for Instagram DMs)

    // Contact Relationships (links contacts together)
    primaryContactId: v.optional(v.id("contacts")), // Links sub-contact to their primary contact
    relationshipType: v.optional(v.string()), // "Spouse", "Child", "Parent", "Sibling", "Grandparent", "Grandchild", "Caregiver", "Power of Attorney", "Trustee", "Beneficiary", "Guardian", "Business Partner", "Other"

    // Lead Status (for leads page review)
    leadStatus: v.optional(v.string()), // "pending", "accepted", "ignored" - default is "pending" (or undefined)

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_ghlContactId", ["ghlContactId"])
    .index("by_intakeId", ["intakeId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_source", ["source"])
    .index("by_lastName", ["lastName"])
    .index("by_metaPsid", ["metaPsid"])
    .index("by_metaIgsid", ["metaIgsid"])
    .index("by_primaryContactId", ["primaryContactId"])
    .index("by_leadStatus", ["leadStatus"]),

  // ==========================================
  // PIPELINE STAGES
  // ==========================================
  pipelineStages: defineTable({
    name: v.string(),
    pipeline: v.string(), // "Main Lead Flow" | "Did Not Hire"
    order: v.number(),
    color: v.optional(v.string()),
  })
    .index("by_pipeline", ["pipeline"])
    .index("by_pipeline_order", ["pipeline", "order"]),

  // ==========================================
  // OPPORTUNITY CONTACTS (Related Contacts)
  // ==========================================
  opportunityContacts: defineTable({
    opportunityId: v.id("opportunities"),
    contactId: v.id("contacts"),
    relationship: v.string(), // "Spouse", "Child", "Parent", "Sibling", "Attorney", "Trustee", "Beneficiary", "POA", "Other"
    notes: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
  })
    .index("by_opportunityId", ["opportunityId"])
    .index("by_contactId", ["contactId"])
    .index("by_opportunityId_contactId", ["opportunityId", "contactId"]),

  // ==========================================
  // OPPORTUNITIES - Second Root Table
  // ==========================================
  opportunities: defineTable({
    title: v.string(),
    contactId: v.id("contacts"),

    // Pipeline & Stage
    pipelineId: v.string(), // "Main Lead Flow" | "Did Not Hire"
    stageId: v.string(),

    // Value
    estimatedValue: v.number(),

    // Practice Area
    practiceArea: v.optional(v.string()), // "Estate Planning", "PBTA", "Medicaid", "Deed", "Doc Review", etc.

    // Source & Tags
    source: v.optional(v.string()), // "Website", "Referral", "Workshop", "Social Media", "Messenger", "Instagram", etc.
    tags: v.optional(v.array(v.string())), // Tags synced from contact or added directly

    // Responsible Attorney
    responsibleAttorneyId: v.optional(v.id("users")),
    responsibleAttorneyName: v.optional(v.string()),

    // Notes
    notes: v.optional(v.string()),

    // Calendar Appointment Reference
    calendarAppointmentDate: v.optional(v.number()),
    calendarAppointmentType: v.optional(v.string()),

    // Did Not Hire Tracking
    didNotHireAt: v.optional(v.number()), // Timestamp when marked as Did Not Hire
    didNotHireReason: v.optional(v.string()), // Stage name/reason for Did Not Hire
    didNotHirePoint: v.optional(v.string()), // Closure point: "pre_contact", "pre_intake", "pre_iv", "post_iv"

    // GHL Integration
    ghlOpportunityId: v.optional(v.string()),

    // Lead Status (for leads page review)
    leadStatus: v.optional(v.string()), // "pending", "accepted", "ignored", "duplicate" - default is "pending" (or undefined)

    // Duplicate Detection
    duplicateOfContactId: v.optional(v.id("contacts")), // Reference to existing contact that matches
    duplicateOfOpportunityId: v.optional(v.id("opportunities")), // Reference to existing opportunity that matches
    duplicateMatchType: v.optional(v.string()), // "email", "phone", "both"

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_contactId", ["contactId"])
    .index("by_pipeline", ["pipelineId"])
    .index("by_stage", ["stageId"])
    .index("by_practiceArea", ["practiceArea"])
    .index("by_source", ["source"])
    .index("by_responsibleAttorneyId", ["responsibleAttorneyId"])
    .index("by_ghlOpportunityId", ["ghlOpportunityId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_leadStatus", ["leadStatus"]),

  // ==========================================
  // CONVERSATIONS
  // ==========================================
  conversations: defineTable({
    contactId: v.id("contacts"),
    source: v.string(), // "messenger" | "instagram" | "sms" | "email"
    unreadCount: v.number(),
    lastMessageAt: v.number(),

    // Meta/Facebook Integration
    metaSenderId: v.optional(v.string()), // PSID or IGSID for this conversation

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_contactId", ["contactId"])
    .index("by_source", ["source"])
    .index("by_lastMessageAt", ["lastMessageAt"])
    .index("by_metaSenderId", ["metaSenderId"]),

  // ==========================================
  // MESSAGES
  // ==========================================
  messages: defineTable({
    conversationId: v.id("conversations"),
    content: v.string(),
    timestamp: v.number(),
    isOutgoing: v.boolean(),
    read: v.boolean(),

    // Optional attachments
    attachments: v.optional(v.array(v.object({
      name: v.string(),
      url: v.string(),
      type: v.string(),
      size: v.optional(v.number()),
    }))),

    // Meta/Facebook Integration
    metaMessageId: v.optional(v.string()), // Mid from Meta for deduplication

    // RingCentral Integration
    ringcentralMessageId: v.optional(v.string()), // RingCentral message ID for deduplication
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_metaMessageId", ["metaMessageId"])
    .index("by_ringcentralMessageId", ["ringcentralMessageId"]),

  // ==========================================
  // INTAKE SUBMISSIONS
  // ==========================================
  intake: defineTable({
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    appointmentId: v.optional(v.id("appointments")),

    // Lead Status (pending, accepted, ignored, duplicate)
    leadStatus: v.optional(v.string()),

    // Duplicate Detection
    duplicateOfContactId: v.optional(v.id("contacts")), // Reference to existing contact that matches
    duplicateMatchType: v.optional(v.string()), // "email", "phone", "both"

    // Basic Fields
    createPdf: v.optional(v.string()),
    practiceArea: v.string(),
    callDetails: v.optional(v.string()),

    // Contact Info (may differ from contact record)
    firstName: v.string(),
    middleName: v.optional(v.string()),
    lastName: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Address
    streetAddress: v.optional(v.string()),
    streetAddress2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    country: v.optional(v.string()),

    // Referral
    referralSource: v.optional(v.string()),
    referralOther: v.optional(v.string()),

    // Estate Planning Fields
    ep_goals: v.optional(v.string()),
    ep_callerScheduling: v.optional(v.string()),
    ep_clientJoinMeeting: v.optional(v.string()),
    ep_clientSoundMind: v.optional(v.string()),
    ep_callerFirstName: v.optional(v.string()),
    ep_callerLastName: v.optional(v.string()),
    ep_callerPhone: v.optional(v.string()),
    ep_callerEmail: v.optional(v.string()),
    ep_floridaResident: v.optional(v.string()),
    ep_maritalStatus: v.optional(v.string()),
    ep_spouseFirstName: v.optional(v.string()),
    ep_spouseLastName: v.optional(v.string()),
    ep_spouseEmail: v.optional(v.string()),
    ep_spousePhone: v.optional(v.string()),
    ep_spousePlanningTogether: v.optional(v.string()),
    ep_hasChildren: v.optional(v.string()),
    ep_hasExistingDocs: v.optional(v.string()),
    ep_documents: v.optional(v.string()),
    ep_isTrustFunded: v.optional(v.string()),
    ep_updateOrStartFresh: v.optional(v.string()),

    // PBTA Fields
    pbta_beneficiaryDisagreements: v.optional(v.string()),
    pbta_assetOwnership: v.optional(v.string()),
    pbta_allAssetsOwnership: v.optional(v.string()),
    pbta_hasWill: v.optional(v.string()),
    pbta_accessToWill: v.optional(v.string()),
    pbta_assetsForProbate: v.optional(v.string()),
    pbta_decedentFirstName: v.optional(v.string()),
    pbta_decedentLastName: v.optional(v.string()),
    pbta_dateOfDeath: v.optional(v.string()),
    pbta_relationshipToDecedent: v.optional(v.string()),

    // Medicaid Fields
    medicaid_primaryConcern: v.optional(v.string()),
    medicaid_assetsInvolved: v.optional(v.string()),

    // Deed Fields
    deed_concern: v.optional(v.string()),
    deed_needsTrustCounsel: v.optional(v.string()),

    // Doc Review Fields
    docReview_floridaResident: v.optional(v.string()),
    docReview_legalAdvice: v.optional(v.string()),
    docReview_recentLifeChanges: v.optional(v.string()),
    docReview_isDocumentOwner: v.optional(v.string()),
    docReview_relationshipWithOwners: v.optional(v.string()),
    docReview_isBeneficiaryOrTrustee: v.optional(v.string()),
    docReview_hasPOA: v.optional(v.string()),
    docReview_documents: v.optional(v.array(v.string())),
    docReview_pendingLitigation: v.optional(v.string()),

    // Appointment Info
    appointmentStaffId: v.optional(v.string()),
    appointmentStaffName: v.optional(v.string()),
    appointmentMeetingType: v.optional(v.string()),
    appointmentLocation: v.optional(v.string()),
    appointmentDate: v.optional(v.string()),
    appointmentTime: v.optional(v.string()),

    // Status
    status: v.optional(v.string()), // "pending", "complete", "incomplete"
    missingFields: v.optional(v.array(v.string())),

    // GHL Integration
    ghlContactId: v.optional(v.string()),
    ghlOpportunityId: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_contactId", ["contactId"])
    .index("by_opportunityId", ["opportunityId"])
    .index("by_appointmentId", ["appointmentId"])
    .index("by_practiceArea", ["practiceArea"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_leadStatus", ["leadStatus"]),

  // ==========================================
  // CALENDARS / APPOINTMENTS
  // ==========================================
  appointments: defineTable({
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    intakeId: v.optional(v.id("intake")),

    title: v.string(),
    type: v.string(), // "Discovery Call", "Consultation", "Workshop", etc.
    practiceArea: v.optional(v.string()), // From intake submission

    // Date & Time
    date: v.number(), // Timestamp
    time: v.string(), // "10:00 AM"
    duration: v.optional(v.number()), // Duration in minutes

    // Location
    location: v.optional(v.string()),

    // Staff
    staffId: v.optional(v.string()),
    staffName: v.optional(v.string()),

    // Participant Info (from intake)
    participantFirstName: v.optional(v.string()),
    participantLastName: v.optional(v.string()),
    participantEmail: v.optional(v.string()),
    participantPhone: v.optional(v.string()),

    // Calendar Info
    calendarId: v.optional(v.string()),
    calendarName: v.optional(v.string()),

    // Status
    status: v.string(), // "Scheduled", "Confirmed", "Cancelled", "Completed", "No Show"

    // Notes
    notes: v.optional(v.string()),

    // GHL Integration
    ghlAppointmentId: v.optional(v.string()),
    ghlCalendarId: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_contactId", ["contactId"])
    .index("by_opportunityId", ["opportunityId"])
    .index("by_intakeId", ["intakeId"])
    .index("by_date", ["date"])
    .index("by_staffId", ["staffId"])
    .index("by_status", ["status"]),

  // ==========================================
  // PRODUCTS / SERVICES CATALOG
  // ==========================================
  products: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(), // Price in dollars
    category: v.optional(v.string()), // "Legal Service", "Filing Fee", "Consultation", etc.
    isActive: v.boolean(),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"])
    .index("by_isActive", ["isActive"]),

  // ==========================================
  // INVOICES
  // ==========================================
  invoices: defineTable({
    contactId: v.id("contacts"),
    opportunityId: v.optional(v.id("opportunities")),

    name: v.string(),
    invoiceNumber: v.string(),

    // Amounts
    amount: v.number(), // Total amount due
    amountPaid: v.optional(v.number()), // Amount paid so far
    currency: v.optional(v.string()), // Default "USD"

    // Dates
    issueDate: v.number(),
    dueDate: v.optional(v.number()),
    paidDate: v.optional(v.number()),

    // Status
    status: v.string(), // "Draft", "Sent", "Pending", "Paid", "Overdue", "Cancelled"

    // Payment
    paymentLink: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),

    // Line Items (with product reference)
    lineItems: v.optional(v.array(v.object({
      productId: v.optional(v.id("products")),
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number(),
    }))),

    // Notes
    notes: v.optional(v.string()),

    // Confido Integration
    confidoInvoiceId: v.optional(v.string()), // Confido PaymentLink ID
    confidoClientId: v.optional(v.string()), // Confido Client ID
    confidoMatterId: v.optional(v.string()), // Confido Matter ID

    // GHL Integration (legacy)
    ghlInvoiceId: v.optional(v.string()),

    // Document reference (PDF)
    documentId: v.optional(v.id("documents")),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_contactId", ["contactId"])
    .index("by_opportunityId", ["opportunityId"])
    .index("by_invoiceNumber", ["invoiceNumber"])
    .index("by_status", ["status"])
    .index("by_issueDate", ["issueDate"])
    .index("by_confidoInvoiceId", ["confidoInvoiceId"]),

  // ==========================================
  // WORKSHOPS
  // ==========================================
  workshops: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    notes: v.optional(v.string()),

    // Location & Address
    location: v.optional(v.string()), // Formatted full address or location name
    streetAddress: v.optional(v.string()),
    streetAddress2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    postalCode: v.optional(v.string()),

    // Date & Time
    date: v.number(), // Timestamp
    time: v.string(), // "10:00 AM"

    // Status
    status: v.string(), // "Draft", "Open", "Upcoming", "Completed", "Cancelled", "Full"

    // Capacity
    maxCapacity: v.number(),
    currentCapacity: v.number(),

    // Type
    type: v.optional(v.string()), // "seminar", "webinar"

    // Files (stored as document references)
    fileIds: v.optional(v.array(v.id("documents"))),

    // GHL Integration
    ghlEventId: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  // ==========================================
  // WORKSHOP REGISTRATIONS
  // ==========================================
  workshopRegistrations: defineTable({
    workshopId: v.id("workshops"),
    contactId: v.id("contacts"),
    opportunityId: v.optional(v.id("opportunities")),

    // Status
    status: v.string(), // "registered", "attended", "no-show", "cancelled"

    // Notes
    notes: v.optional(v.string()),

    // Metadata
    registeredAt: v.number(),
    attendedAt: v.optional(v.number()),
  })
    .index("by_workshopId", ["workshopId"])
    .index("by_contactId", ["contactId"])
    .index("by_status", ["status"]),

  // ==========================================
  // TASK TEMPLATES (Auto-generated tasks per stage)
  // ==========================================
  taskTemplates: defineTable({
    stageName: v.string(), // Pipeline stage name this template applies to
    pipelineId: v.optional(v.string()), // Optional: specific pipeline
    taskNumber: v.number(), // Order of task execution
    taskName: v.string(), // Task title
    taskDescription: v.optional(v.string()), // Task body/details
    assigneeId: v.optional(v.string()), // User ID to assign to
    assigneeName: v.optional(v.string()), // User name for display
    dueDateValue: v.number(), // Duration value (e.g., 3)
    dueDateUnit: v.string(), // Unit: "minutes", "hours", "days", "weeks"
    priority: v.optional(v.string()), // "Low", "Medium", "High", "Urgent"
    isActive: v.boolean(), // Enable/disable template

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stageName", ["stageName"])
    .index("by_pipelineId", ["pipelineId"])
    .index("by_isActive", ["isActive"]),

  // ==========================================
  // STAGE COMPLETION MAPPINGS (Final task → Did Not Hire)
  // ==========================================
  stageCompletionMappings: defineTable({
    sourceStageName: v.string(), // Current stage name
    sourceStageId: v.optional(v.string()), // Current stage ID (for reference)
    sourcePipelineId: v.optional(v.string()), // Source pipeline
    targetPipelineId: v.string(), // Target pipeline (e.g., "Did Not Hire")
    targetPipelineName: v.string(), // Target pipeline name
    targetStageName: v.string(), // Target stage name
    isActive: v.boolean(),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sourceStageName", ["sourceStageName"])
    .index("by_isActive", ["isActive"]),

  // ==========================================
  // STAGE CHANGES (Grace period tracking)
  // ==========================================
  stageChanges: defineTable({
    opportunityId: v.id("opportunities"),
    opportunityName: v.optional(v.string()),
    previousStage: v.optional(v.string()),
    previousStageId: v.optional(v.string()),
    newStage: v.string(),
    newStageId: v.string(),
    taskIds: v.array(v.id("tasks")), // IDs of created tasks for rollback

    // Metadata
    createdAt: v.number(),
  })
    .index("by_opportunityId", ["opportunityId"])
    .index("by_createdAt", ["createdAt"]),

  // ==========================================
  // TASKS
  // ==========================================
  tasks: defineTable({
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    workshopId: v.optional(v.id("workshops")),

    title: v.string(),
    description: v.optional(v.string()),

    // Due Date
    dueDate: v.optional(v.number()),

    // Assignment
    assignedTo: v.optional(v.string()), // User ID or name
    assignedToName: v.optional(v.string()),

    // Status
    status: v.string(), // "Pending", "In Progress", "Completed", "Overdue", "Cancelled"
    completed: v.boolean(),
    completedAt: v.optional(v.number()),

    // Priority
    priority: v.optional(v.string()), // "Low", "Medium", "High", "Urgent"

    // Attempt tracking
    attempt: v.optional(v.number()), // Track attempt number (1, 2, 3, etc.)

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_contactId", ["contactId"])
    .index("by_opportunityId", ["opportunityId"])
    .index("by_workshopId", ["workshopId"])
    .index("by_assignedTo", ["assignedTo"])
    .index("by_status", ["status"])
    .index("by_dueDate", ["dueDate"])
    .index("by_completed", ["completed"]),

  // ==========================================
  // DOCUMENTS
  // ==========================================
  documents: defineTable({
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),
    intakeId: v.optional(v.id("intake")),
    workshopId: v.optional(v.id("workshops")),
    invoiceId: v.optional(v.id("invoices")),

    name: v.string(),
    type: v.optional(v.string()), // "pdf", "docx", "image", etc.
    mimeType: v.optional(v.string()), // Full MIME type
    size: v.optional(v.number()), // Size in bytes

    // Storage
    storageId: v.id("_storage"),

    // Category
    category: v.optional(v.string()), // "intake_document", "legal_document", "workshop_document", "invoice_document", "other"

    // Metadata
    uploadedAt: v.number(),
    uploadedBy: v.optional(v.string()),
  })
    .index("by_contactId", ["contactId"])
    .index("by_opportunityId", ["opportunityId"])
    .index("by_intakeId", ["intakeId"])
    .index("by_workshopId", ["workshopId"])
    .index("by_invoiceId", ["invoiceId"])
    .index("by_uploadedAt", ["uploadedAt"]),

  // ==========================================
  // USERS (Staff members)
  // ==========================================
  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.optional(v.string()), // "admin", "attorney", "paralegal", "staff"
    avatar: v.optional(v.string()),

    // Auth fields
    passwordHash: v.optional(v.string()),
    temporaryPassword: v.optional(v.string()), // Plaintext temp password (cleared after first login)
    mustChangePassword: v.boolean(), // True for new users
    emailVerified: v.boolean(),
    verificationToken: v.optional(v.string()),
    verificationTokenExpiry: v.optional(v.number()),
    status: v.string(), // "pending" | "active" | "suspended"
    lastLoginAt: v.optional(v.number()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_verificationToken", ["verificationToken"])
    .index("by_status", ["status"]),

  // ==========================================
  // SESSIONS (Auth sessions)
  // ==========================================
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"])
    .index("by_expiresAt", ["expiresAt"]),

  // ==========================================
  // META CONNECTIONS (Facebook/Instagram OAuth)
  // ==========================================
  metaConnections: defineTable({
    // Who connected this
    connectedByUserId: v.id("users"),
    connectedByName: v.string(),

    // OAuth tokens
    userAccessToken: v.string(), // User's long-lived access token
    userAccessTokenExpiresAt: v.optional(v.number()), // Expiry timestamp

    // Facebook User Info
    facebookUserId: v.string(),
    facebookUserName: v.optional(v.string()),

    // Status
    status: v.string(), // "active", "expired", "revoked"

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_connectedByUserId", ["connectedByUserId"])
    .index("by_facebookUserId", ["facebookUserId"])
    .index("by_status", ["status"]),

  // ==========================================
  // META PAGES (Connected Facebook/Instagram Pages)
  // ==========================================
  metaPages: defineTable({
    connectionId: v.id("metaConnections"),

    // Page Info
    pageId: v.string(),
    pageName: v.string(),
    pageAccessToken: v.string(), // Page-specific access token (never expires if user token is valid)

    // Platform
    platform: v.string(), // "facebook" | "instagram"

    // Instagram-specific (if linked)
    instagramBusinessAccountId: v.optional(v.string()),
    instagramUsername: v.optional(v.string()),

    // Webhook subscription status
    webhookSubscribed: v.boolean(),

    // Status
    isActive: v.boolean(), // Whether this page is actively being used

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_connectionId", ["connectionId"])
    .index("by_pageId", ["pageId"])
    .index("by_platform", ["platform"])
    .index("by_isActive", ["isActive"]),

  // ==========================================
  // FORM TEMPLATES (Drag & Drop Form Builder)
  // ==========================================
  formTemplates: defineTable({
    title: v.string(),
    description: v.optional(v.string()),

    // Form Elements (stored as JSON structure)
    elements: v.array(v.object({
      id: v.string(), // Unique ID for the element
      type: v.string(), // "text", "title", "separator", "column", "dropdown", "textInput", "largeTextInput", "singleSelect", "multipleSelect", "date", "location", "email", "phone", "number", "checkbox", "signature", "fileUpload"
      label: v.optional(v.string()), // Label for input fields
      placeholder: v.optional(v.string()), // Placeholder text
      content: v.optional(v.string()), // For text/title elements
      required: v.optional(v.boolean()), // Whether field is required
      options: v.optional(v.array(v.string())), // For dropdown/select fields
      width: v.optional(v.string()), // "full", "half", "third" for column layouts
      order: v.number(), // Position in form

      // Column-specific fields
      columnCount: v.optional(v.number()), // Number of columns (2, 3, 4)
      children: v.optional(v.array(v.string())), // Child element IDs for columns
      parentId: v.optional(v.string()), // Parent column ID
      columnIndex: v.optional(v.number()), // Which column this element belongs to (0, 1, 2, etc.)

      // Validation
      minLength: v.optional(v.number()),
      maxLength: v.optional(v.number()),
      pattern: v.optional(v.string()), // Regex pattern for validation

      // Styling
      size: v.optional(v.string()), // "sm", "md", "lg" for text sizes
      alignment: v.optional(v.string()), // "left", "center", "right"
    })),

    // Public Form Settings
    isPublic: v.boolean(),
    publicSlug: v.optional(v.string()), // URL-friendly slug for public access

    // Submission Settings
    submitButtonText: v.optional(v.string()), // Default: "Submit"
    confirmationMessage: v.optional(v.string()), // Message shown after submission
    redirectUrl: v.optional(v.string()), // Optional redirect after submission

    // Notifications
    notifyOnSubmission: v.optional(v.boolean()),
    notificationEmails: v.optional(v.array(v.string())),

    // Status
    status: v.string(), // "draft", "active", "archived"

    // Usage tracking
    submissionCount: v.optional(v.number()),
    lastSubmissionAt: v.optional(v.number()),

    // Created by
    createdByUserId: v.optional(v.id("users")),
    createdByName: v.optional(v.string()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_isPublic", ["isPublic"])
    .index("by_publicSlug", ["publicSlug"])
    .index("by_createdByUserId", ["createdByUserId"])
    .index("by_createdAt", ["createdAt"]),

  // ==========================================
  // FORM SUBMISSIONS (Filled Form Data)
  // ==========================================
  formSubmissions: defineTable({
    formTemplateId: v.id("formTemplates"),

    // Link to CRM entities (optional)
    contactId: v.optional(v.id("contacts")),
    opportunityId: v.optional(v.id("opportunities")),

    // Submission Data (key-value pairs where key is element ID)
    data: v.object({}), // Dynamic object with element IDs as keys

    // Submitter Info
    submitterEmail: v.optional(v.string()),
    submitterName: v.optional(v.string()),
    submitterPhone: v.optional(v.string()),
    submitterIp: v.optional(v.string()),

    // Status
    status: v.string(), // "pending", "reviewed", "processed", "archived"

    // Review info
    reviewedByUserId: v.optional(v.id("users")),
    reviewedByName: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),

    // Due date (for forms sent to specific contacts)
    dueDate: v.optional(v.number()),

    // Metadata
    submittedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_formTemplateId", ["formTemplateId"])
    .index("by_contactId", ["contactId"])
    .index("by_opportunityId", ["opportunityId"])
    .index("by_status", ["status"])
    .index("by_submittedAt", ["submittedAt"])
    .index("by_dueDate", ["dueDate"]),

  // ==========================================
  // FORM ASSIGNMENTS (Forms sent to contacts)
  // ==========================================
  formAssignments: defineTable({
    formTemplateId: v.id("formTemplates"),
    contactId: v.id("contacts"),
    opportunityId: v.optional(v.id("opportunities")),

    // Assignment details
    assignedByUserId: v.optional(v.id("users")),
    assignedByName: v.optional(v.string()),

    // Due date
    dueDate: v.optional(v.number()),

    // Access token for unique form link
    accessToken: v.string(),

    // Status
    status: v.string(), // "pending", "submitted", "expired", "cancelled"

    // Submission reference
    submissionId: v.optional(v.id("formSubmissions")),

    // Reminder tracking
    lastReminderSentAt: v.optional(v.number()),
    reminderCount: v.optional(v.number()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_formTemplateId", ["formTemplateId"])
    .index("by_contactId", ["contactId"])
    .index("by_opportunityId", ["opportunityId"])
    .index("by_accessToken", ["accessToken"])
    .index("by_status", ["status"])
    .index("by_dueDate", ["dueDate"])
    .index("by_createdAt", ["createdAt"]),
});
