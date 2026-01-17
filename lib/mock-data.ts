/**
 * MOCK DATA FILE
 * ===============
 * This file contains all mock data for development/demo purposes.
 *
 * TO RESTORE REAL DATA:
 * 1. Set NEXT_PUBLIC_USE_MOCK_DATA=false in .env.local
 * 2. Or delete the variable entirely
 *
 * The mock data provider checks this variable and returns real Convex data when false.
 */

export type MessageSource = "messenger" | "instagram" | "sms" | "email";
export type PipelineName = "Main Lead Flow" | "Did Not Hire";

// ============================================================================
// PIPELINE STAGES
// ============================================================================

export interface MockStage {
  _id: string;
  name: string;
  pipeline: PipelineName;
  order: number;
  color?: string;
}

export const mockPipelineStages: MockStage[] = [
  // Main Lead Flow
  { _id: "stage-fresh-leads", name: "Fresh Leads", pipeline: "Main Lead Flow", order: 1 },
  { _id: "stage-pending-contact", name: "Pending Contact", pipeline: "Main Lead Flow", order: 2 },
  { _id: "stage-pending-intake", name: "Pending Intake Completion", pipeline: "Main Lead Flow", order: 3 },
  { _id: "stage-scheduled-discovery", name: "Scheduled Discovery Call", pipeline: "Main Lead Flow", order: 4 },
  { _id: "stage-pending-iv", name: "Pending I/V", pipeline: "Main Lead Flow", order: 5 },
  { _id: "stage-scheduled-iv", name: "Scheduled I/V", pipeline: "Main Lead Flow", order: 6 },
  { _id: "stage-cancelled-iv", name: "Cancelled/No Show I/V", pipeline: "Main Lead Flow", order: 7 },
  { _id: "stage-pending-engagement-1", name: "Pending Engagement Lvl 1", pipeline: "Main Lead Flow", order: 8 },
  { _id: "stage-pending-engagement-2-3", name: "Pending Engagement Lvl 2 and 3", pipeline: "Main Lead Flow", order: 9 },
  { _id: "stage-scheduled-design", name: "Scheduled Design", pipeline: "Main Lead Flow", order: 10 },
  { _id: "stage-cancelled-design", name: "Cancelled/No Show Design", pipeline: "Main Lead Flow", order: 11 },
  { _id: "stage-engaged", name: "Engaged", pipeline: "Main Lead Flow", order: 12 },
  // Did Not Hire
  { _id: "stage-followup-pending-intake", name: "Follow-Up Completed: Pending Intake", pipeline: "Did Not Hire", order: 1 },
  { _id: "stage-rejected-bad-behavior", name: "Rejected Lead - due to bad behavior", pipeline: "Did Not Hire", order: 2 },
  { _id: "stage-rejected-not-qualified", name: "Rejected Lead - Not Qualified", pipeline: "Did Not Hire", order: 3 },
  { _id: "stage-outside-practice", name: "Outside Practice Area / Service Not Offered", pipeline: "Did Not Hire", order: 4 },
  { _id: "stage-not-ready", name: "Not Ready to Move Forward", pipeline: "Did Not Hire", order: 5 },
  { _id: "stage-cost-concerns", name: "Cost Concerns", pipeline: "Did Not Hire", order: 6 },
  { _id: "stage-hired-other", name: "Hired Other Attorney", pipeline: "Did Not Hire", order: 7 },
];

// ============================================================================
// CONTACT RELATIONSHIPS
// ============================================================================

export type ContactRelationshipType =
  | "Spouse"
  | "Child"
  | "Parent"
  | "Sibling"
  | "Grandparent"
  | "Grandchild"
  | "Caregiver"
  | "Power of Attorney"
  | "Trustee"
  | "Beneficiary"
  | "Guardian"
  | "Business Partner"
  | "Other";

// ============================================================================
// CONTACTS
// ============================================================================

export interface MockContact {
  _id: string;
  _creationTime: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: MessageSource;
  tags?: string[];
  // Address fields
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  company?: string;
  // Relationship fields
  primaryContactId?: string;         // If this contact is linked to a primary contact
  relationshipType?: ContactRelationshipType;  // The relationship to the primary contact
  // Joined fields (computed at runtime)
  opportunityId?: string;
  opportunityTitle?: string;
  opportunityStage?: string;
  // Relationship joined fields (computed at runtime)
  primaryContactName?: string;       // Name of the primary contact (joined)
  subContacts?: {                    // Sub-contacts linked to this contact (joined)
    _id: string;
    firstName: string;
    lastName: string;
    relationshipType: ContactRelationshipType;
  }[];
}

export const mockContacts: MockContact[] = [
  {
    _id: "contact-001",
    _creationTime: Date.now() - 86400000 * 5,
    firstName: "John",
    lastName: "Martinez",
    email: "john.martinez@email.com",
    phone: "(555) 123-4567",
    source: "messenger",
    tags: ["VIP", "New Lead"],
    streetAddress: "123 Main Street",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
    dateOfBirth: "1975-06-15",
    opportunityId: "opp-001",
    opportunityTitle: "Estate Planning Package",
    opportunityStage: "Fresh Leads",
  },
  {
    _id: "contact-002",
    _creationTime: Date.now() - 86400000 * 4,
    firstName: "Sarah",
    lastName: "Thompson",
    email: "sarah.t@gmail.com",
    phone: "(555) 987-6543",
    source: "instagram",
    tags: ["Follow Up"],
    streetAddress: "456 Oak Avenue",
    city: "San Diego",
    state: "CA",
    zipCode: "92101",
    dateOfBirth: "1982-03-22",
    company: "Thompson Consulting",
    opportunityId: "opp-002",
    opportunityTitle: "Trust Amendment",
    opportunityStage: "Pending Contact",
  },
  {
    _id: "contact-003",
    _creationTime: Date.now() - 86400000 * 3,
    firstName: "Michael",
    lastName: "Chen",
    email: "m.chen@outlook.com",
    phone: "(555) 456-7890",
    source: "sms",
    tags: ["High Value"],
    streetAddress: "789 Pine Road",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    dateOfBirth: "1968-11-08",
    opportunityId: "opp-003",
    opportunityTitle: "Medicaid Planning",
    opportunityStage: "Scheduled Discovery Call",
  },
  {
    _id: "contact-004",
    _creationTime: Date.now() - 86400000 * 7,
    firstName: "Emily",
    lastName: "Rodriguez",
    email: "emily.r@yahoo.com",
    phone: "(555) 321-0987",
    source: "email",
    tags: [],
    opportunityId: "opp-004",
    opportunityTitle: "Will Drafting",
    opportunityStage: "Pending Intake Completion",
  },
  {
    _id: "contact-005",
    _creationTime: Date.now() - 86400000 * 6,
    firstName: "David",
    lastName: "Kim",
    email: "dkim@business.com",
    phone: "(555) 654-3210",
    source: "messenger",
    tags: ["Priority"],
    opportunityId: "opp-005",
    opportunityTitle: "Power of Attorney",
    opportunityStage: "Scheduled I/V",
  },
  {
    _id: "contact-006",
    _creationTime: Date.now() - 86400000 * 8,
    firstName: "Lisa",
    lastName: "Wang",
    email: "lisa.wang@email.com",
    phone: "(555) 111-2222",
    source: "email",
    tags: [],
    opportunityId: "opp-006",
    opportunityTitle: "Deed Transfer",
    opportunityStage: "Pending Engagement Lvl 1",
  },
  {
    _id: "contact-007",
    _creationTime: Date.now() - 86400000 * 10,
    firstName: "Robert",
    lastName: "Johnson",
    email: "r.johnson@email.com",
    phone: "(555) 333-4444",
    source: "email",
    tags: ["VIP", "High Value"],
    opportunityId: "opp-007",
    opportunityTitle: "Full Estate Plan",
    opportunityStage: "Scheduled Design",
  },
  {
    _id: "contact-008",
    _creationTime: Date.now() - 86400000 * 12,
    firstName: "Jennifer",
    lastName: "Lee",
    email: "jlee@email.com",
    phone: "(555) 555-6666",
    source: "instagram",
    tags: [],
    opportunityId: "opp-008",
    opportunityTitle: "Trust Review",
    opportunityStage: "Engaged",
  },
  {
    _id: "contact-009",
    _creationTime: Date.now() - 86400000 * 15,
    firstName: "Mark",
    lastName: "Davis",
    email: "mark.d@email.com",
    phone: "(555) 777-8888",
    tags: [],
    opportunityId: "opp-009",
    opportunityTitle: "Estate Planning Consultation",
    opportunityStage: "Cost Concerns",
  },
  {
    _id: "contact-010",
    _creationTime: Date.now() - 86400000 * 18,
    firstName: "Amanda",
    lastName: "Wilson",
    email: "amanda.w@email.com",
    phone: "(555) 999-0000",
    source: "sms",
    tags: ["Follow Up"],
    opportunityId: "opp-010",
    opportunityTitle: "Medicaid Application",
    opportunityStage: "Not Ready to Move Forward",
  },
  {
    _id: "contact-011",
    _creationTime: Date.now() - 86400000 * 2,
    firstName: "Nancy",
    lastName: "Taylor",
    email: "nancy.t@email.com",
    phone: "(555) 444-5555",
    source: "messenger",
    tags: ["New Lead"],
    opportunityId: "opp-011",
    opportunityTitle: "PBTA Services",
    opportunityStage: "Fresh Leads",
  },
  {
    _id: "contact-012",
    _creationTime: Date.now() - 86400000 * 3,
    firstName: "George",
    lastName: "Miller",
    email: "g.miller@email.com",
    phone: "(555) 666-7777",
    source: "email",
    tags: ["High Value", "VIP"],
    opportunityId: "opp-012",
    opportunityTitle: "Asset Protection Trust",
    opportunityStage: "Pending I/V",
  },
  // ===== SUB-CONTACTS WITH RELATIONSHIPS =====
  // John Martinez's family
  {
    _id: "contact-013",
    _creationTime: Date.now() - 86400000 * 5,
    firstName: "Maria",
    lastName: "Martinez",
    email: "maria.martinez@email.com",
    phone: "(555) 123-4568",
    streetAddress: "123 Main Street",
    city: "Los Angeles",
    state: "CA",
    zipCode: "90001",
    dateOfBirth: "1978-09-22",
    primaryContactId: "contact-001",
    relationshipType: "Spouse",
  },
  {
    _id: "contact-014",
    _creationTime: Date.now() - 86400000 * 5,
    firstName: "Carlos",
    lastName: "Martinez",
    dateOfBirth: "2005-03-15",
    primaryContactId: "contact-001",
    relationshipType: "Child",
  },
  {
    _id: "contact-015",
    _creationTime: Date.now() - 86400000 * 5,
    firstName: "Sofia",
    lastName: "Martinez",
    dateOfBirth: "2008-07-20",
    primaryContactId: "contact-001",
    relationshipType: "Child",
  },
  // Michael Chen's family (Medicaid Planning)
  {
    _id: "contact-016",
    _creationTime: Date.now() - 86400000 * 3,
    firstName: "Helen",
    lastName: "Chen",
    email: "helen.chen@email.com",
    phone: "(555) 456-7891",
    dateOfBirth: "1940-02-14",
    streetAddress: "789 Pine Road",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
    primaryContactId: "contact-003",
    relationshipType: "Parent",
  },
  {
    _id: "contact-017",
    _creationTime: Date.now() - 86400000 * 3,
    firstName: "Linda",
    lastName: "Chen",
    email: "linda.chen@email.com",
    phone: "(555) 456-7892",
    dateOfBirth: "1970-05-18",
    primaryContactId: "contact-003",
    relationshipType: "Spouse",
  },
  // Robert Johnson's estate planning contacts
  {
    _id: "contact-018",
    _creationTime: Date.now() - 86400000 * 10,
    firstName: "Patricia",
    lastName: "Johnson",
    email: "p.johnson@email.com",
    phone: "(555) 333-4445",
    dateOfBirth: "1972-08-30",
    streetAddress: "456 Oak Lane",
    city: "Beverly Hills",
    state: "CA",
    zipCode: "90210",
    primaryContactId: "contact-007",
    relationshipType: "Spouse",
  },
  {
    _id: "contact-019",
    _creationTime: Date.now() - 86400000 * 10,
    firstName: "William",
    lastName: "Johnson",
    email: "will.johnson@email.com",
    phone: "(555) 333-4446",
    dateOfBirth: "1998-12-05",
    primaryContactId: "contact-007",
    relationshipType: "Child",
  },
  {
    _id: "contact-020",
    _creationTime: Date.now() - 86400000 * 10,
    firstName: "James",
    lastName: "Mitchell",
    email: "j.mitchell@finance.com",
    phone: "(555) 333-4447",
    company: "Mitchell Financial Advisors",
    primaryContactId: "contact-007",
    relationshipType: "Trustee",
  },
  // George Miller's related contacts
  {
    _id: "contact-021",
    _creationTime: Date.now() - 86400000 * 3,
    firstName: "Barbara",
    lastName: "Miller",
    email: "b.miller@email.com",
    phone: "(555) 666-7778",
    dateOfBirth: "1958-04-12",
    primaryContactId: "contact-012",
    relationshipType: "Spouse",
  },
  {
    _id: "contact-022",
    _creationTime: Date.now() - 86400000 * 3,
    firstName: "Thomas",
    lastName: "Miller",
    email: "t.miller@email.com",
    phone: "(555) 666-7779",
    dateOfBirth: "1985-11-28",
    primaryContactId: "contact-012",
    relationshipType: "Child",
  },
  {
    _id: "contact-023",
    _creationTime: Date.now() - 86400000 * 3,
    firstName: "Susan",
    lastName: "Wright",
    email: "s.wright@email.com",
    phone: "(555) 666-7780",
    company: "Wright & Associates Law",
    primaryContactId: "contact-012",
    relationshipType: "Power of Attorney",
  },
  // Jennifer Lee's beneficiary
  {
    _id: "contact-024",
    _creationTime: Date.now() - 86400000 * 12,
    firstName: "Kevin",
    lastName: "Lee",
    email: "kevin.lee@email.com",
    phone: "(555) 555-6667",
    dateOfBirth: "2000-06-15",
    primaryContactId: "contact-008",
    relationshipType: "Child",
  },
  {
    _id: "contact-025",
    _creationTime: Date.now() - 86400000 * 12,
    firstName: "Grace",
    lastName: "Park",
    email: "grace.park@email.com",
    phone: "(555) 555-6668",
    primaryContactId: "contact-008",
    relationshipType: "Caregiver",
  },
];

// ============================================================================
// OPPORTUNITIES (for Kanban board)
// ============================================================================

export interface MockOpportunityForKanban {
  _id: string;
  title: string;
  contactId: string;
  pipelineId: PipelineName;
  stageId: string;
  estimatedValue: number;
  calendarAppointmentDate?: number;
  calendarAppointmentType?: string;
  createdAt: number;
  updatedAt: number;
  assignedToName?: string;
  notes?: string;
  contact: {
    _id: string;
    firstName: string;
    lastName: string;
    source?: string;
    email?: string;
    phone?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    dateOfBirth?: string;
    company?: string;
  } | null;
}

export const mockOpportunities: MockOpportunityForKanban[] = [
  {
    _id: "opp-001",
    title: "Estate Planning Package",
    contactId: "contact-001",
    pipelineId: "Main Lead Flow",
    stageId: "stage-fresh-leads",
    estimatedValue: 5000,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 1,
    assignedToName: "Sarah Paralegal",
    notes: "Client interested in comprehensive estate planning. Has two children and significant real estate assets.",
    contact: {
      _id: "contact-001",
      firstName: "John",
      lastName: "Martinez",
      source: "messenger",
      email: "john.martinez@email.com",
      phone: "(555) 123-4567",
      streetAddress: "123 Main Street",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      dateOfBirth: "1975-06-15",
    },
  },
  {
    _id: "opp-002",
    title: "Trust Amendment",
    contactId: "contact-002",
    pipelineId: "Main Lead Flow",
    stageId: "stage-pending-contact",
    estimatedValue: 2500,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 2,
    contact: { _id: "contact-002", firstName: "Sarah", lastName: "Thompson", source: "instagram" },
  },
  {
    _id: "opp-003",
    title: "Medicaid Planning",
    contactId: "contact-003",
    pipelineId: "Main Lead Flow",
    stageId: "stage-scheduled-discovery",
    estimatedValue: 8000,
    calendarAppointmentDate: Date.now() + 86400000 * 2,
    calendarAppointmentType: "Discovery Call",
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
    contact: { _id: "contact-003", firstName: "Michael", lastName: "Chen", source: "sms" },
  },
  {
    _id: "opp-004",
    title: "Will Drafting",
    contactId: "contact-004",
    pipelineId: "Main Lead Flow",
    stageId: "stage-pending-intake",
    estimatedValue: 1500,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 3,
    contact: { _id: "contact-004", firstName: "Emily", lastName: "Rodriguez", source: "email" },
  },
  {
    _id: "opp-005",
    title: "Power of Attorney",
    contactId: "contact-005",
    pipelineId: "Main Lead Flow",
    stageId: "stage-scheduled-iv",
    estimatedValue: 800,
    calendarAppointmentDate: Date.now() + 86400000 * 1,
    calendarAppointmentType: "Initial Visit",
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 2,
    contact: { _id: "contact-005", firstName: "David", lastName: "Kim", source: "messenger" },
  },
  {
    _id: "opp-006",
    title: "Deed Transfer",
    contactId: "contact-006",
    pipelineId: "Main Lead Flow",
    stageId: "stage-pending-engagement-1",
    estimatedValue: 1200,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 4,
    contact: { _id: "contact-006", firstName: "Lisa", lastName: "Wang" },
  },
  {
    _id: "opp-007",
    title: "Full Estate Plan",
    contactId: "contact-007",
    pipelineId: "Main Lead Flow",
    stageId: "stage-scheduled-design",
    estimatedValue: 12000,
    calendarAppointmentDate: Date.now() + 86400000 * 3,
    calendarAppointmentType: "Design Meeting",
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 1,
    contact: { _id: "contact-007", firstName: "Robert", lastName: "Johnson", source: "email" },
  },
  {
    _id: "opp-008",
    title: "Trust Review",
    contactId: "contact-008",
    pipelineId: "Main Lead Flow",
    stageId: "stage-engaged",
    estimatedValue: 3500,
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 2,
    contact: { _id: "contact-008", firstName: "Jennifer", lastName: "Lee", source: "instagram" },
  },
  {
    _id: "opp-009",
    title: "Estate Planning Consultation",
    contactId: "contact-009",
    pipelineId: "Did Not Hire",
    stageId: "stage-cost-concerns",
    estimatedValue: 2000,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 10,
    contact: { _id: "contact-009", firstName: "Mark", lastName: "Davis" },
  },
  {
    _id: "opp-010",
    title: "Medicaid Application",
    contactId: "contact-010",
    pipelineId: "Did Not Hire",
    stageId: "stage-not-ready",
    estimatedValue: 6000,
    createdAt: Date.now() - 86400000 * 18,
    updatedAt: Date.now() - 86400000 * 12,
    contact: { _id: "contact-010", firstName: "Amanda", lastName: "Wilson", source: "sms" },
  },
  {
    _id: "opp-011",
    title: "PBTA Services",
    contactId: "contact-011",
    pipelineId: "Main Lead Flow",
    stageId: "stage-fresh-leads",
    estimatedValue: 4500,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 1,
    contact: { _id: "contact-011", firstName: "Nancy", lastName: "Taylor", source: "messenger" },
  },
  {
    _id: "opp-012",
    title: "Asset Protection Trust",
    contactId: "contact-012",
    pipelineId: "Main Lead Flow",
    stageId: "stage-pending-iv",
    estimatedValue: 15000,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 1,
    contact: { _id: "contact-012", firstName: "George", lastName: "Miller", source: "email" },
  },
];

// ============================================================================
// TASKS
// ============================================================================

export interface MockTask {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string;
  dueDate?: number;
  assignedTo?: string;
  assignedToName?: string;
  status?: string;
  completed: boolean;
  completedAt?: number;
  priority?: string;
  attempt?: number;
  contactId?: string;
  opportunityId?: string;
  workshopId?: string;
  contactName: string | null;
  opportunityTitle: string | null;
  workshopTitle: string | null;
}

export const mockTasks: MockTask[] = [
  // Jacqui Calma's tasks
  {
    _id: "task-001",
    _creationTime: Date.now() - 86400000 * 2,
    title: "Send welcome email to John Martinez",
    description: "Send initial welcome email with intake form link",
    dueDate: Date.now() + 86400000 * 1, // Tomorrow
    assignedToName: "Jacqui Calma",
    status: "Pending",
    completed: false,
    priority: "High",
    attempt: 1,
    contactId: "contact-001",
    opportunityId: "opp-001",
    contactName: "John Martinez",
    opportunityTitle: "Estate Planning Package",
    workshopTitle: null,
  },
  {
    _id: "task-002",
    _creationTime: Date.now() - 86400000 * 3,
    title: "Follow up call - Michael Chen",
    description: "Second attempt to reach client about Medicaid planning",
    dueDate: Date.now(), // Today
    assignedToName: "Jacqui Calma",
    status: "In Progress",
    completed: false,
    priority: "High",
    attempt: 2,
    contactId: "contact-003",
    opportunityId: "opp-003",
    contactName: "Michael Chen",
    opportunityTitle: "Medicaid Planning",
    workshopTitle: null,
  },
  {
    _id: "task-003",
    _creationTime: Date.now() - 86400000 * 1,
    title: "Schedule discovery call with Nancy Taylor",
    description: "New lead needs discovery call scheduled",
    dueDate: Date.now() + 86400000 * 2, // In 2 days
    assignedToName: "Jacqui Calma",
    status: "Pending",
    completed: false,
    priority: "Medium",
    attempt: 1,
    contactId: "contact-011",
    opportunityId: "opp-011",
    contactName: "Nancy Taylor",
    opportunityTitle: "PBTA Services",
    workshopTitle: null,
  },
  // Andy Baker's tasks
  {
    _id: "task-004",
    _creationTime: Date.now() - 86400000 * 5,
    title: "Review intake form submission",
    description: "Review Emily Rodriguez's intake form for completeness",
    dueDate: Date.now() - 86400000 * 1, // Yesterday (overdue)
    assignedToName: "Andy Baker",
    status: "Overdue",
    completed: false,
    priority: "High",
    attempt: 1,
    contactId: "contact-004",
    opportunityId: "opp-004",
    contactName: "Emily Rodriguez",
    opportunityTitle: "Will Drafting",
    workshopTitle: null,
  },
  {
    _id: "task-005",
    _creationTime: Date.now() - 86400000 * 1,
    title: "Prepare design meeting materials",
    description: "Prepare trust documents for Robert Johnson's design meeting",
    dueDate: Date.now() + 86400000 * 3, // In 3 days
    assignedToName: "Andy Baker",
    status: "Pending",
    completed: false,
    priority: "High",
    attempt: 1,
    contactId: "contact-007",
    opportunityId: "opp-007",
    contactName: "Robert Johnson",
    opportunityTitle: "Full Estate Plan",
    workshopTitle: null,
  },
  {
    _id: "task-006",
    _creationTime: Date.now() - 86400000 * 7,
    title: "Final follow-up - George Miller",
    description: "Third attempt to get signed engagement letter",
    dueDate: Date.now() + 86400000 * 1, // Tomorrow
    assignedToName: "Andy Baker",
    status: "Pending",
    completed: false,
    priority: "Medium",
    attempt: 3,
    contactId: "contact-012",
    opportunityId: "opp-012",
    contactName: "George Miller",
    opportunityTitle: "Asset Protection Trust",
    workshopTitle: null,
  },
  // Gabriella Ang's tasks
  {
    _id: "task-007",
    _creationTime: Date.now() - 86400000 * 7,
    title: "Follow up with Lisa Wang on invoice",
    description: "Send reminder about outstanding invoice payment",
    dueDate: Date.now() + 86400000 * 5, // In 5 days
    assignedToName: "Gabriella Ang",
    status: "Pending",
    completed: false,
    priority: "Medium",
    attempt: 2,
    contactId: "contact-006",
    opportunityId: "opp-006",
    contactName: "Lisa Wang",
    opportunityTitle: "Deed Transfer",
    workshopTitle: null,
  },
  {
    _id: "task-008",
    _creationTime: Date.now() - 86400000 * 10,
    title: "Prepare workshop materials",
    description: "Create presentation slides for Estate Planning 101 workshop",
    dueDate: Date.now() + 86400000 * 7, // In 7 days
    assignedToName: "Gabriella Ang",
    status: "Pending",
    completed: false,
    priority: "Low",
    attempt: 1,
    workshopId: "workshop-001",
    contactName: null,
    opportunityTitle: null,
    workshopTitle: "Estate Planning 101",
  },
  {
    _id: "task-009",
    _creationTime: Date.now() - 86400000 * 2,
    title: "Send intake form to Sarah Thompson",
    description: "Client needs to complete intake for trust amendment",
    dueDate: Date.now(), // Today
    assignedToName: "Gabriella Ang",
    status: "In Progress",
    completed: false,
    priority: "High",
    attempt: 1,
    contactId: "contact-002",
    opportunityId: "opp-002",
    contactName: "Sarah Thompson",
    opportunityTitle: "Trust Amendment",
    workshopTitle: null,
  },
  // Mar Wie Ang's tasks
  {
    _id: "task-010",
    _creationTime: Date.now() - 86400000 * 4,
    title: "Confirm I/V appointment - David Kim",
    description: "Call to confirm initial visit scheduled for tomorrow",
    dueDate: Date.now(), // Today
    assignedToName: "Mar Wie Ang",
    status: "Pending",
    completed: false,
    priority: "High",
    attempt: 1,
    contactId: "contact-005",
    opportunityId: "opp-005",
    contactName: "David Kim",
    opportunityTitle: "Power of Attorney",
    workshopTitle: null,
  },
  {
    _id: "task-011",
    _creationTime: Date.now() - 86400000 * 6,
    title: "Review workshop registrations",
    description: "Check attendee list for Medicaid Planning Seminar",
    dueDate: Date.now() + 86400000 * 10, // In 10 days
    assignedToName: "Mar Wie Ang",
    status: "Pending",
    completed: false,
    priority: "Low",
    attempt: 1,
    workshopId: "workshop-002",
    contactName: null,
    opportunityTitle: null,
    workshopTitle: "Medicaid Planning Seminar",
  },
  {
    _id: "task-012",
    _creationTime: Date.now() - 86400000 * 3,
    title: "Follow up - Amanda Wilson",
    description: "Fourth attempt - final follow up before closing",
    dueDate: Date.now() - 86400000 * 2, // 2 days ago (overdue)
    assignedToName: "Mar Wie Ang",
    status: "Overdue",
    completed: false,
    priority: "Medium",
    attempt: 4,
    contactId: "contact-010",
    opportunityId: "opp-010",
    contactName: "Amanda Wilson",
    opportunityTitle: "Medicaid Application",
    workshopTitle: null,
  },
  // Completed tasks
  {
    _id: "task-013",
    _creationTime: Date.now() - 86400000 * 15,
    title: "Complete trust funding checklist",
    description: "Completed all trust funding steps for Jennifer Lee",
    dueDate: Date.now() - 86400000 * 3,
    assignedToName: "Jacqui Calma",
    status: "Completed",
    completed: true,
    completedAt: Date.now() - 86400000 * 3,
    priority: "High",
    attempt: 1,
    contactId: "contact-008",
    opportunityId: "opp-008",
    contactName: "Jennifer Lee",
    opportunityTitle: "Trust Review",
    workshopTitle: null,
  },
  {
    _id: "task-014",
    _creationTime: Date.now() - 86400000 * 12,
    title: "Send engagement letter",
    description: "Engagement letter sent and signed",
    dueDate: Date.now() - 86400000 * 5,
    assignedToName: "Andy Baker",
    status: "Completed",
    completed: true,
    completedAt: Date.now() - 86400000 * 5,
    priority: "High",
    attempt: 2,
    contactId: "contact-008",
    opportunityId: "opp-008",
    contactName: "Jennifer Lee",
    opportunityTitle: "Trust Review",
    workshopTitle: null,
  },
  {
    _id: "task-015",
    _creationTime: Date.now() - 86400000 * 8,
    title: "Initial contact - Mark Davis",
    description: "First outreach completed",
    dueDate: Date.now() - 86400000 * 7,
    assignedToName: "Gabriella Ang",
    status: "Completed",
    completed: true,
    completedAt: Date.now() - 86400000 * 7,
    priority: "Medium",
    attempt: 1,
    contactId: "contact-009",
    opportunityId: "opp-009",
    contactName: "Mark Davis",
    opportunityTitle: "Estate Planning Consultation",
    workshopTitle: null,
  },
  {
    _id: "task-016",
    _creationTime: Date.now() - 86400000 * 10,
    title: "Schedule design meeting",
    description: "Design meeting scheduled successfully",
    dueDate: Date.now() - 86400000 * 8,
    assignedToName: "Mar Wie Ang",
    status: "Completed",
    completed: true,
    completedAt: Date.now() - 86400000 * 8,
    priority: "High",
    attempt: 1,
    contactId: "contact-007",
    opportunityId: "opp-007",
    contactName: "Robert Johnson",
    opportunityTitle: "Full Estate Plan",
    workshopTitle: null,
  },
];

// ============================================================================
// INVOICES
// ============================================================================

export interface MockInvoice {
  _id: string;
  _creationTime: number;
  contactId: string;
  opportunityId?: string;
  name: string;
  invoiceNumber: string;
  amount: number;
  amountPaid?: number;
  issueDate: number;
  dueDate?: number;
  paidDate?: number;
  status: string;
  paymentLink?: string;
  paymentMethod?: string;
  lineItems?: { description: string; quantity: number; unitPrice: number; total: number }[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
  // Joined fields
  contactName?: string;
  opportunityTitle?: string;
}

export const mockInvoices: MockInvoice[] = [
  {
    _id: "inv-001",
    _creationTime: Date.now() - 86400000 * 8,
    contactId: "contact-006",
    opportunityId: "opp-006",
    name: "Deed Transfer - Initial Payment",
    invoiceNumber: "INV-2025-001",
    amount: 600,
    issueDate: Date.now() - 86400000 * 8,
    dueDate: Date.now() + 86400000 * 7,
    status: "Sent",
    paymentLink: "https://pay.confido.com/inv-001",
    lineItems: [{ description: "Deed Transfer Services - Initial", quantity: 1, unitPrice: 600, total: 600 }],
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 8,
    contactName: "Lisa Wang",
    opportunityTitle: "Deed Transfer",
  },
  {
    _id: "inv-002",
    _creationTime: Date.now() - 86400000 * 15,
    contactId: "contact-007",
    opportunityId: "opp-007",
    name: "Full Estate Plan - Retainer",
    invoiceNumber: "INV-2025-002",
    amount: 3000,
    amountPaid: 3000,
    issueDate: Date.now() - 86400000 * 15,
    dueDate: Date.now() - 86400000 * 8,
    paidDate: Date.now() - 86400000 * 10,
    status: "Paid",
    paymentMethod: "Credit Card",
    lineItems: [{ description: "Estate Planning Retainer", quantity: 1, unitPrice: 3000, total: 3000 }],
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 10,
    contactName: "Robert Johnson",
    opportunityTitle: "Full Estate Plan",
  },
  {
    _id: "inv-003",
    _creationTime: Date.now() - 86400000 * 20,
    contactId: "contact-008",
    opportunityId: "opp-008",
    name: "Trust Review Services",
    invoiceNumber: "INV-2025-003",
    amount: 3500,
    amountPaid: 3500,
    issueDate: Date.now() - 86400000 * 20,
    dueDate: Date.now() - 86400000 * 13,
    paidDate: Date.now() - 86400000 * 15,
    status: "Paid",
    paymentMethod: "Bank Transfer",
    lineItems: [{ description: "Annual Trust Review", quantity: 1, unitPrice: 3500, total: 3500 }],
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 15,
    contactName: "Jennifer Lee",
    opportunityTitle: "Trust Review",
  },
  {
    _id: "inv-004",
    _creationTime: Date.now() - 86400000 * 5,
    contactId: "contact-003",
    opportunityId: "opp-003",
    name: "Medicaid Planning Consultation",
    invoiceNumber: "INV-2025-004",
    amount: 500,
    issueDate: Date.now() - 86400000 * 5,
    dueDate: Date.now() + 86400000 * 10,
    status: "Pending",
    lineItems: [{ description: "Initial Consultation - Medicaid Planning", quantity: 1, unitPrice: 500, total: 500 }],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
    contactName: "Michael Chen",
    opportunityTitle: "Medicaid Planning",
  },
  {
    _id: "inv-005",
    _creationTime: Date.now() - 86400000 * 30,
    contactId: "contact-009",
    opportunityId: "opp-009",
    name: "Estate Planning Consultation",
    invoiceNumber: "INV-2024-045",
    amount: 250,
    issueDate: Date.now() - 86400000 * 30,
    dueDate: Date.now() - 86400000 * 16,
    status: "Overdue",
    lineItems: [{ description: "Initial Consultation", quantity: 1, unitPrice: 250, total: 250 }],
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 30,
    contactName: "Mark Davis",
    opportunityTitle: "Estate Planning Consultation",
  },
];

// ============================================================================
// INTAKE SUBMISSIONS
// ============================================================================

export interface MockIntake {
  _id: string;
  _creationTime: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  practiceArea: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status: "complete" | "incomplete";
  createdAt: number;
}

export const mockIntakeSubmissions: MockIntake[] = [
  {
    _id: "intake-001",
    _creationTime: Date.now() - 86400000 * 2,
    firstName: "John",
    lastName: "Martinez",
    email: "john.martinez@email.com",
    phone: "(555) 123-4567",
    practiceArea: "Estate Planning",
    appointmentDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    appointmentTime: "10:00 AM",
    status: "complete",
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    _id: "intake-002",
    _creationTime: Date.now() - 86400000 * 4,
    firstName: "Sarah",
    lastName: "Thompson",
    email: "sarah.t@gmail.com",
    phone: "(555) 987-6543",
    practiceArea: "Trust Administration",
    status: "incomplete",
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    _id: "intake-003",
    _creationTime: Date.now() - 86400000 * 1,
    firstName: "Michael",
    lastName: "Chen",
    email: "m.chen@outlook.com",
    phone: "(555) 456-7890",
    practiceArea: "Medicaid Planning",
    appointmentDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    appointmentTime: "2:00 PM",
    status: "complete",
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    _id: "intake-004",
    _creationTime: Date.now() - 86400000 * 7,
    firstName: "Emily",
    lastName: "Rodriguez",
    email: "emily.r@yahoo.com",
    phone: "(555) 321-0987",
    practiceArea: "Probate",
    status: "incomplete",
    createdAt: Date.now() - 86400000 * 7,
  },
  {
    _id: "intake-005",
    _creationTime: Date.now() - 86400000 * 3,
    firstName: "George",
    lastName: "Miller",
    email: "g.miller@email.com",
    phone: "(555) 666-7777",
    practiceArea: "Asset Protection",
    appointmentDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    appointmentTime: "11:00 AM",
    status: "complete",
    createdAt: Date.now() - 86400000 * 3,
  },
];

// ============================================================================
// APPOINTMENTS
// ============================================================================

export interface MockAppointment {
  _id: string;
  _creationTime: number;
  title: string;
  type: string;
  date: number;
  time: string;
  status: string;
  notes?: string;
  contactId?: string;
  staffId?: string;
  staffName?: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantEmail?: string;
  participantPhone?: string;
  calendarId?: string;
  calendarName?: string;
  location?: string;
}

export const mockAppointments: MockAppointment[] = [
  {
    _id: "apt-001",
    _creationTime: Date.now() - 86400000 * 5,
    title: "Discovery Call - Michael Chen",
    type: "Discovery Call",
    date: Date.now() + 86400000 * 2,
    time: "10:00 AM",
    status: "Confirmed",
    contactId: "contact-003",
    staffName: "Attorney James Wilson",
    participantFirstName: "Michael",
    participantLastName: "Chen",
    participantEmail: "m.chen@outlook.com",
    participantPhone: "(555) 456-7890",
    calendarName: "Main Office",
    location: "Video Call",
  },
  {
    _id: "apt-002",
    _creationTime: Date.now() - 86400000 * 3,
    title: "Initial Visit - David Kim",
    type: "Initial Visit",
    date: Date.now() + 86400000 * 1,
    time: "2:00 PM",
    status: "Confirmed",
    contactId: "contact-005",
    staffName: "Attorney Maria Garcia",
    participantFirstName: "David",
    participantLastName: "Kim",
    participantEmail: "dkim@business.com",
    participantPhone: "(555) 654-3210",
    calendarName: "Main Office",
    location: "123 Main St, Suite 200",
  },
  {
    _id: "apt-003",
    _creationTime: Date.now() - 86400000 * 7,
    title: "Design Meeting - Robert Johnson",
    type: "Design Meeting",
    date: Date.now() + 86400000 * 3,
    time: "11:00 AM",
    status: "Confirmed",
    contactId: "contact-007",
    staffName: "Attorney James Wilson",
    participantFirstName: "Robert",
    participantLastName: "Johnson",
    participantEmail: "r.johnson@email.com",
    participantPhone: "(555) 333-4444",
    calendarName: "Main Office",
    location: "123 Main St, Suite 200",
  },
  {
    _id: "apt-004",
    _creationTime: Date.now() - 86400000 * 10,
    title: "Trust Signing - Jennifer Lee",
    type: "Signing",
    date: Date.now() + 86400000 * 5,
    time: "3:00 PM",
    status: "Pending",
    contactId: "contact-008",
    staffName: "Attorney Maria Garcia",
    participantFirstName: "Jennifer",
    participantLastName: "Lee",
    participantEmail: "jlee@email.com",
    participantPhone: "(555) 555-6666",
    calendarName: "Main Office",
    location: "123 Main St, Suite 200",
  },
  {
    _id: "apt-005",
    _creationTime: Date.now() - 86400000 * 2,
    title: "Intake Call - George Miller",
    type: "Intake Call",
    date: Date.now() + 86400000 * 4,
    time: "9:00 AM",
    status: "Confirmed",
    contactId: "contact-012",
    staffName: "Sarah Johnson",
    participantFirstName: "George",
    participantLastName: "Miller",
    participantEmail: "g.miller@email.com",
    participantPhone: "(555) 666-7777",
    calendarName: "Main Office",
    location: "Video Call",
  },
];

// ============================================================================
// WORKSHOPS
// ============================================================================

export interface MockWorkshop {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string;
  location?: string;
  date: number;
  time: string;
  status: string;
  notes?: string;
  maxCapacity: number;
  currentCapacity: number;
}

export const mockWorkshops: MockWorkshop[] = [
  {
    _id: "workshop-001",
    _creationTime: Date.now() - 86400000 * 14,
    title: "Estate Planning 101",
    description: "Introduction to estate planning basics for families",
    location: "Community Center, Room A",
    date: Date.now() + 86400000 * 7,
    time: "2:00 PM",
    status: "Open",
    maxCapacity: 25,
    currentCapacity: 18,
  },
  {
    _id: "workshop-002",
    _creationTime: Date.now() - 86400000 * 21,
    title: "Medicaid Planning Seminar",
    description: "Understanding Medicaid eligibility and planning strategies",
    location: "Library Conference Room",
    date: Date.now() + 86400000 * 14,
    time: "10:00 AM",
    status: "Open",
    maxCapacity: 30,
    currentCapacity: 12,
  },
  {
    _id: "workshop-003",
    _creationTime: Date.now() - 86400000 * 30,
    title: "Trust Funding Workshop",
    description: "How to properly fund your revocable living trust",
    location: "Online Webinar",
    date: Date.now() - 86400000 * 5,
    time: "3:00 PM",
    status: "Completed",
    maxCapacity: 50,
    currentCapacity: 42,
  },
  {
    _id: "workshop-004",
    _creationTime: Date.now() - 86400000 * 7,
    title: "Healthcare Directives Overview",
    description: "Understanding advance healthcare directives and powers of attorney",
    location: "Community Center, Room B",
    date: Date.now() + 86400000 * 21,
    time: "1:00 PM",
    status: "Upcoming",
    maxCapacity: 20,
    currentCapacity: 5,
  },
];

// ============================================================================
// CONVERSATIONS
// ============================================================================

export interface MockMessage {
  _id: string;
  conversationId: string;
  content: string;
  timestamp: number;
  isOutgoing: boolean;
  read: boolean;
}

export interface MockConversation {
  _id: string;
  contactId: string;
  source: MessageSource;
  unreadCount: number;
  lastMessageAt: number;
  contact?: MockContact | null;
  messages?: MockMessage[];
}

export const mockConversations: MockConversation[] = [
  {
    _id: "conv-001",
    contactId: "contact-001",
    source: "messenger",
    unreadCount: 2,
    lastMessageAt: Date.now() - 3600000,
    contact: mockContacts.find(c => c._id === "contact-001"),
    messages: [
      { _id: "msg-001", conversationId: "conv-001", content: "Hi, I was referred by a friend. I need help with estate planning.", timestamp: Date.now() - 86400000, isOutgoing: false, read: true },
      { _id: "msg-002", conversationId: "conv-001", content: "Hello John! Thank you for reaching out. I'd be happy to help. Can you tell me a bit about your situation?", timestamp: Date.now() - 86400000 + 1800000, isOutgoing: true, read: true },
      { _id: "msg-003", conversationId: "conv-001", content: "I'm looking to set up a trust for my kids. We have some real estate and retirement accounts.", timestamp: Date.now() - 7200000, isOutgoing: false, read: false },
      { _id: "msg-004", conversationId: "conv-001", content: "What's the best way to get started?", timestamp: Date.now() - 3600000, isOutgoing: false, read: false },
    ],
  },
  {
    _id: "conv-002",
    contactId: "contact-002",
    source: "instagram",
    unreadCount: 0,
    lastMessageAt: Date.now() - 86400000 * 2,
    contact: mockContacts.find(c => c._id === "contact-002"),
    messages: [
      { _id: "msg-005", conversationId: "conv-002", content: "I saw your post about trust amendments. I have some questions.", timestamp: Date.now() - 86400000 * 3, isOutgoing: false, read: true },
      { _id: "msg-006", conversationId: "conv-002", content: "Of course, Sarah! What would you like to know?", timestamp: Date.now() - 86400000 * 3 + 3600000, isOutgoing: true, read: true },
      { _id: "msg-007", conversationId: "conv-002", content: "My situation has changed since I created my trust. Can we update beneficiaries?", timestamp: Date.now() - 86400000 * 2, isOutgoing: false, read: true },
    ],
  },
  {
    _id: "conv-003",
    contactId: "contact-003",
    source: "sms",
    unreadCount: 1,
    lastMessageAt: Date.now() - 7200000,
    contact: mockContacts.find(c => c._id === "contact-003"),
    messages: [
      { _id: "msg-008", conversationId: "conv-003", content: "Confirming our discovery call for Tuesday at 10am", timestamp: Date.now() - 86400000, isOutgoing: true, read: true },
      { _id: "msg-009", conversationId: "conv-003", content: "Yes, confirmed! Looking forward to it.", timestamp: Date.now() - 86400000 + 3600000, isOutgoing: false, read: true },
      { _id: "msg-010", conversationId: "conv-003", content: "Should I bring any documents?", timestamp: Date.now() - 7200000, isOutgoing: false, read: false },
    ],
  },
  {
    _id: "conv-004",
    contactId: "contact-007",
    source: "email",
    unreadCount: 0,
    lastMessageAt: Date.now() - 86400000 * 1,
    contact: mockContacts.find(c => c._id === "contact-007"),
    messages: [
      { _id: "msg-011", conversationId: "conv-004", content: "Thank you for the design meeting today. The proposed plan looks great.", timestamp: Date.now() - 86400000 * 1, isOutgoing: false, read: true },
      { _id: "msg-012", conversationId: "conv-004", content: "You're welcome, Robert! I'll have the draft documents ready by next week.", timestamp: Date.now() - 86400000 * 1 + 3600000, isOutgoing: true, read: true },
    ],
  },
  // Additional SMS Conversations
  {
    _id: "conv-005",
    contactId: "contact-005",
    source: "sms",
    unreadCount: 0,
    lastMessageAt: Date.now() - 3600000 * 4,
    contact: mockContacts.find(c => c._id === "contact-005"),
    messages: [
      { _id: "msg-013", conversationId: "conv-005", content: "Hi David, this is Safe Harbor Law. Just a reminder about your Initial Visit tomorrow at 2pm.", timestamp: Date.now() - 86400000, isOutgoing: true, read: true },
      { _id: "msg-014", conversationId: "conv-005", content: "Thanks for the reminder! I'll be there.", timestamp: Date.now() - 86400000 + 1800000, isOutgoing: false, read: true },
      { _id: "msg-015", conversationId: "conv-005", content: "Please bring a valid ID and any existing estate planning documents if you have them.", timestamp: Date.now() - 86400000 + 3600000, isOutgoing: true, read: true },
      { _id: "msg-016", conversationId: "conv-005", content: "Will do. Can I also bring my spouse?", timestamp: Date.now() - 3600000 * 4, isOutgoing: false, read: true },
    ],
  },
  {
    _id: "conv-006",
    contactId: "contact-010",
    source: "sms",
    unreadCount: 2,
    lastMessageAt: Date.now() - 1800000,
    contact: mockContacts.find(c => c._id === "contact-010"),
    messages: [
      { _id: "msg-017", conversationId: "conv-006", content: "Hi Amanda, following up on our Medicaid planning consultation. Have you had a chance to review the documents we sent?", timestamp: Date.now() - 86400000 * 3, isOutgoing: true, read: true },
      { _id: "msg-018", conversationId: "conv-006", content: "Yes, I looked them over. Still trying to decide.", timestamp: Date.now() - 86400000 * 2, isOutgoing: false, read: true },
      { _id: "msg-019", conversationId: "conv-006", content: "Take your time. Let me know if you have any questions.", timestamp: Date.now() - 86400000 * 2 + 3600000, isOutgoing: true, read: true },
      { _id: "msg-020", conversationId: "conv-006", content: "I talked with my daughter and we have some concerns about the spend-down requirements.", timestamp: Date.now() - 3600000, isOutgoing: false, read: false },
      { _id: "msg-021", conversationId: "conv-006", content: "Can we schedule another call to discuss options?", timestamp: Date.now() - 1800000, isOutgoing: false, read: false },
    ],
  },
  {
    _id: "conv-007",
    contactId: "contact-011",
    source: "sms",
    unreadCount: 0,
    lastMessageAt: Date.now() - 86400000 * 1,
    contact: mockContacts.find(c => c._id === "contact-011"),
    messages: [
      { _id: "msg-022", conversationId: "conv-007", content: "Hello! I received your intake form. Thank you for choosing Safe Harbor Law.", timestamp: Date.now() - 86400000 * 2, isOutgoing: true, read: true },
      { _id: "msg-023", conversationId: "conv-007", content: "Thank you! When can I expect to hear about scheduling?", timestamp: Date.now() - 86400000 * 2 + 7200000, isOutgoing: false, read: true },
      { _id: "msg-024", conversationId: "conv-007", content: "We have availability next week. Would Tuesday or Thursday work better for you?", timestamp: Date.now() - 86400000 * 1, isOutgoing: true, read: true },
    ],
  },
  // Additional Email Conversations
  {
    _id: "conv-008",
    contactId: "contact-004",
    source: "email",
    unreadCount: 1,
    lastMessageAt: Date.now() - 3600000 * 2,
    contact: mockContacts.find(c => c._id === "contact-004"),
    messages: [
      { _id: "msg-025", conversationId: "conv-008", content: "Dear Safe Harbor Law Team,\n\nI'm writing to follow up on my intake form submission from last week. I submitted all the requested information but haven't heard back yet about next steps.\n\nPlease let me know if there's anything else you need from me.\n\nBest regards,\nEmily Rodriguez", timestamp: Date.now() - 86400000 * 2, isOutgoing: false, read: true },
      { _id: "msg-026", conversationId: "conv-008", content: "Dear Emily,\n\nThank you for your patience. We've received your intake form and are reviewing the information. A team member will reach out within 1-2 business days to schedule your consultation.\n\nBest,\nSafe Harbor Law Team", timestamp: Date.now() - 86400000 * 2 + 14400000, isOutgoing: true, read: true },
      { _id: "msg-027", conversationId: "conv-008", content: "Thank you for the update. I forgot to mention that I'll be traveling from January 25-30, so please avoid scheduling during that time if possible.\n\nEmily", timestamp: Date.now() - 3600000 * 2, isOutgoing: false, read: false },
    ],
  },
  {
    _id: "conv-009",
    contactId: "contact-006",
    source: "email",
    unreadCount: 0,
    lastMessageAt: Date.now() - 86400000 * 3,
    contact: mockContacts.find(c => c._id === "contact-006"),
    messages: [
      { _id: "msg-028", conversationId: "conv-009", content: "Hi Lisa,\n\nI hope this email finds you well. I wanted to follow up on the deed transfer documents we discussed in our last meeting.\n\nAttached you'll find the draft quitclaim deed for your review. Please let me know if you have any questions or if any changes need to be made.\n\nBest regards,\nAttorney Maria Garcia\nSafe Harbor Law Firm", timestamp: Date.now() - 86400000 * 5, isOutgoing: true, read: true },
      { _id: "msg-029", conversationId: "conv-009", content: "Dear Attorney Garcia,\n\nThank you for sending the draft. I reviewed it with my husband and everything looks correct. We're ready to proceed with the signing.\n\nWhat are the next steps?\n\nLisa Wang", timestamp: Date.now() - 86400000 * 4, isOutgoing: false, read: true },
      { _id: "msg-030", conversationId: "conv-009", content: "Great news, Lisa!\n\nI'll coordinate with our office to schedule a signing appointment. You'll both need to bring valid photo ID. The recording fee will be $85.\n\nExpect a call from our scheduling team within the next day or two.\n\nBest,\nMaria Garcia", timestamp: Date.now() - 86400000 * 3, isOutgoing: true, read: true },
    ],
  },
  {
    _id: "conv-010",
    contactId: "contact-012",
    source: "email",
    unreadCount: 3,
    lastMessageAt: Date.now() - 1800000,
    contact: mockContacts.find(c => c._id === "contact-012"),
    messages: [
      { _id: "msg-031", conversationId: "conv-010", content: "Dear Safe Harbor Law,\n\nI've been researching asset protection trusts and have several questions about the process. My accountant recommended your firm.\n\nSpecifically, I'd like to understand:\n1. How does an irrevocable trust protect assets from creditors?\n2. What are the tax implications?\n3. How long does the process typically take?\n\nI have significant assets I'm looking to protect. Please advise on next steps.\n\nGeorge Miller", timestamp: Date.now() - 86400000 * 4, isOutgoing: false, read: true },
      { _id: "msg-032", conversationId: "conv-010", content: "Dear Mr. Miller,\n\nThank you for reaching out. These are excellent questions that we can address in detail during a consultation.\n\nIn brief:\n1. Properly structured irrevocable trusts can provide asset protection after a look-back period\n2. Tax implications vary - this is best discussed with your accountant in conjunction with our planning\n3. Typical timeline is 4-6 weeks from initial consultation to trust funding\n\nI'd recommend scheduling a comprehensive consultation. Would you have availability next week?\n\nBest regards,\nJames Wilson, Esq.\nSafe Harbor Law Firm", timestamp: Date.now() - 86400000 * 3, isOutgoing: true, read: true },
      { _id: "msg-033", conversationId: "conv-010", content: "Mr. Wilson,\n\nYes, next week works. I'm available Tuesday afternoon or Thursday morning.\n\nAlso, I've attached a summary of my current assets for your review before we meet. Let me know if you need anything else to prepare.\n\nGeorge", timestamp: Date.now() - 86400000 * 1, isOutgoing: false, read: false },
      { _id: "msg-034", conversationId: "conv-010", content: "One more thing - my wife Barbara will be joining the meeting. We want to coordinate our planning together.\n\nGeorge", timestamp: Date.now() - 3600000, isOutgoing: false, read: false },
      { _id: "msg-035", conversationId: "conv-010", content: "Also, should we involve our financial advisor in this conversation? He's been asking about the trust structure.\n\nGeorge", timestamp: Date.now() - 1800000, isOutgoing: false, read: false },
    ],
  },
  {
    _id: "conv-011",
    contactId: "contact-008",
    source: "sms",
    unreadCount: 0,
    lastMessageAt: Date.now() - 86400000 * 2,
    contact: mockContacts.find(c => c._id === "contact-008"),
    messages: [
      { _id: "msg-036", conversationId: "conv-011", content: "Hi Jennifer, your trust signing is confirmed for next Friday at 3pm. Please remember to bring two forms of ID.", timestamp: Date.now() - 86400000 * 3, isOutgoing: true, read: true },
      { _id: "msg-037", conversationId: "conv-011", content: "Got it! Will my son Kevin need to be present?", timestamp: Date.now() - 86400000 * 3 + 3600000, isOutgoing: false, read: true },
      { _id: "msg-038", conversationId: "conv-011", content: "No, Kevin doesn't need to attend. Only you as the trustor need to sign.", timestamp: Date.now() - 86400000 * 2, isOutgoing: true, read: true },
    ],
  },
  {
    _id: "conv-012",
    contactId: "contact-009",
    source: "email",
    unreadCount: 0,
    lastMessageAt: Date.now() - 86400000 * 5,
    contact: mockContacts.find(c => c._id === "contact-009"),
    messages: [
      { _id: "msg-039", conversationId: "conv-012", content: "Dear Safe Harbor Law,\n\nI wanted to reach out regarding the estate planning consultation invoice I received. While I found the consultation valuable, I'm currently facing some unexpected expenses and was hoping to discuss payment options.\n\nIs there any possibility of a payment plan?\n\nThank you,\nMark Davis", timestamp: Date.now() - 86400000 * 7, isOutgoing: false, read: true },
      { _id: "msg-040", conversationId: "conv-012", content: "Dear Mr. Davis,\n\nThank you for reaching out. We understand that financial situations can change, and we're happy to work with you.\n\nWe can offer a 3-month payment plan for the consultation fee. Please contact our billing department at billing@safeharbor.com to set this up.\n\nBest regards,\nSafe Harbor Law Team", timestamp: Date.now() - 86400000 * 6, isOutgoing: true, read: true },
      { _id: "msg-041", conversationId: "conv-012", content: "Thank you so much for understanding. I'll contact billing to set up the payment plan. I'm still very interested in moving forward with the estate planning once my finances stabilize.\n\nMark", timestamp: Date.now() - 86400000 * 5, isOutgoing: false, read: true },
    ],
  },
];

// ============================================================================
// USERS (for staff/assignees)
// ============================================================================

export interface MockUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const mockUsers: MockUser[] = [
  { _id: "user-001", name: "James Wilson", email: "james@safeharbor.com", role: "attorney" },
  { _id: "user-002", name: "Maria Garcia", email: "maria@safeharbor.com", role: "attorney" },
  { _id: "user-003", name: "Sarah Johnson", email: "sarah@safeharbor.com", role: "paralegal" },
  { _id: "user-004", name: "Admin User", email: "admin@safeharbor.com", role: "admin" },
];

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface MockDashboardStats {
  totalContacts: number;
  activeOpportunities: number;
  pendingTasks: number;
  totalRevenue: number;
  conversionRate: number;
  appointmentsThisWeek: number;
}

export const mockDashboardStats: MockDashboardStats = {
  totalContacts: mockContacts.length,
  activeOpportunities: mockOpportunities.filter(o => o.pipelineId === "Main Lead Flow").length,
  pendingTasks: mockTasks.filter(t => !t.completed).length,
  totalRevenue: mockInvoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.amount, 0),
  conversionRate: 42,
  appointmentsThisWeek: mockAppointments.filter(a => a.date <= Date.now() + 86400000 * 7 && a.date >= Date.now()).length,
};

// ============================================================================
// FRESH LEADS (for Leads page - awaiting accept/ignore)
// ============================================================================

export type LeadSource = "Call From CallRail" | "Website Form" | "Facebook Ads" | "Google Ads" | "Referral" | "Workshop" | "Instagram";

export interface MockLead {
  _id: string;
  _creationTime: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  message: string;
  createdAt: number;
}

export const mockLeads: MockLead[] = [
  {
    _id: "lead-001",
    _creationTime: Date.now() - 3600000 * 2,
    firstName: "DAVIDSON",
    lastName: "PHELPS",
    email: undefined,
    phone: "407-474-8376",
    source: "Call From CallRail",
    message: "Call From CallRail | Elizabeth Davison called Safe Harbor Law Firm regarding an insurance claim dispute related to a recent accident. Agent Mina informed her that the firm specializes exclusively in estate planning (wills, trusts, power of attorney, healthcare directives) and cannot handle litigation or disputes. The agent referred her to Kelleher Law at 833-546-3675 for assistance with her case, and the caller agreed to contact them for a free consultation.",
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    _id: "lead-002",
    _creationTime: Date.now() - 3600000 * 3,
    firstName: "SCHMITT",
    lastName: "DIETER",
    email: undefined,
    phone: "239-292-2101",
    source: "Call From CallRail",
    message: "Call From CallRail | Sue Hoivadich called Safe Harbor's law firm in Bonita Springs to reach Brittany regarding an upcoming appointment on the 20th. She wants to discuss changing her estate planning strategy from a trust to a will instead. Sue left her callback number as 239-292-2101 and requested that Brittany return her call to discuss the modification to her plans.",
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    _id: "lead-003",
    _creationTime: Date.now() - 3600000 * 5,
    firstName: "MARGARET",
    lastName: "HENDERSON",
    email: "margaret.h@gmail.com",
    phone: "561-445-7823",
    source: "Website Form",
    message: "Submitted via website contact form: I'm interested in setting up a revocable living trust for my family. We have a primary residence, vacation home in the Keys, and several investment accounts. My husband and I would like to ensure our assets pass smoothly to our three children while avoiding probate. Please contact me to schedule a consultation.",
    createdAt: Date.now() - 3600000 * 5,
  },
  {
    _id: "lead-004",
    _creationTime: Date.now() - 3600000 * 8,
    firstName: "ROBERT",
    lastName: "NAKAMURA",
    email: "rnakamura@outlook.com",
    phone: "305-889-4521",
    source: "Facebook Ads",
    message: "Clicked on Facebook ad for 'Free Estate Planning Guide'. User downloaded the guide and requested a callback. Notes from form: Looking to update existing will and potentially convert to a trust. Has questions about Medicaid planning for elderly parent.",
    createdAt: Date.now() - 3600000 * 8,
  },
  {
    _id: "lead-005",
    _creationTime: Date.now() - 86400000 * 1,
    firstName: "PATRICIA",
    lastName: "MORALES",
    email: "patricia.morales@email.com",
    phone: "239-556-3344",
    source: "Referral",
    message: "Referred by existing client Jennifer Lee. Patricia is interested in estate planning services. She recently became a widow and needs to update her estate documents. Has significant assets including a business and multiple properties.",
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    _id: "lead-006",
    _creationTime: Date.now() - 86400000 * 1 - 3600000 * 4,
    firstName: "WILLIAM",
    lastName: "CHANG",
    email: undefined,
    phone: "954-223-8890",
    source: "Call From CallRail",
    message: "Call From CallRail | William Chang called inquiring about power of attorney documents. His mother is 85 and in declining health. He needs to get POA set up urgently as she may need to go into assisted living soon. Requested a same-week appointment if possible.",
    createdAt: Date.now() - 86400000 * 1 - 3600000 * 4,
  },
  {
    _id: "lead-007",
    _creationTime: Date.now() - 86400000 * 2,
    firstName: "SANDRA",
    lastName: "OCONNELL",
    email: "sandra.oconnell@yahoo.com",
    phone: "813-445-2299",
    source: "Workshop",
    message: "Attended 'Estate Planning 101' workshop on January 10th. Signed up for free consultation. Notes from registration: Interested in basic estate planning, currently has no will or trust. Single with no children, wants to ensure assets go to siblings and charity.",
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    _id: "lead-008",
    _creationTime: Date.now() - 86400000 * 2 - 3600000 * 6,
    firstName: "ANTHONY",
    lastName: "RUSSO",
    email: "arusso@business.net",
    phone: "786-334-9012",
    source: "Google Ads",
    message: "Clicked on Google ad for 'Estate Planning Attorney Near Me'. Submitted contact form: I own a small construction business and need to plan for succession. Also interested in asset protection strategies. Available for consultation most afternoons.",
    createdAt: Date.now() - 86400000 * 2 - 3600000 * 6,
  },
  {
    _id: "lead-009",
    _creationTime: Date.now() - 86400000 * 3,
    firstName: "MELISSA",
    lastName: "THOMPSON",
    email: "melissa.t@gmail.com",
    phone: undefined,
    source: "Instagram",
    message: "Sent DM via Instagram: Hi! I saw your post about the importance of healthcare directives. My husband and I are in our 40s with two young kids. We've been putting off estate planning for too long. Can you send me info about your services and pricing?",
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    _id: "lead-010",
    _creationTime: Date.now() - 86400000 * 3 - 3600000 * 2,
    firstName: "CHARLES",
    lastName: "BRENNAN",
    email: "cbrennan@lawfirm.com",
    phone: "239-887-4455",
    source: "Referral",
    message: "Attorney referral from Charles Brennan at Brennan & Associates (personal injury firm). Referring client who received settlement and needs estate planning. Client is Maria Santos, phone 239-556-0098. Settlement amount is substantial, client interested in special needs trust for disabled adult child.",
    createdAt: Date.now() - 86400000 * 3 - 3600000 * 2,
  },
];
