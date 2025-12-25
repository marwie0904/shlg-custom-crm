export type MessageSource = "messenger" | "instagram" | "sms" | "email";

// Pipeline and Stage Types
export type PipelineName = "Main Lead Flow" | "Did Not Hire";

export interface Stage {
  id: string;
  name: string;
  pipeline: PipelineName;
  order: number;
}

export interface OpportunityContact {
  name: string;
  email: string;
  phone: string;
  source?: MessageSource;
}

export interface Appointment {
  id: string;
  title: string;
  date: Date;
  type: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: Date;
}

export interface OpportunityTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date;
  completed: boolean;
  assignee?: string;
}

export interface Workshop {
  id: string;
  title: string;
  date: Date;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  type: string;
  notes?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  contactName: string;
  contact: OpportunityContact;
  estimatedValue: number;
  stageId: string;
  pipelineId: PipelineName;
  calendarAppointment?: {
    date: Date;
    type: string;
  };
  appointments: Appointment[];
  invoices: Invoice[];
  tasks: OpportunityTask[];
  workshops: Workshop[];
  notes: string;
  createdAt: Date;
}

// Pipeline Stages
export const pipelineStages: Stage[] = [
  // Main Lead Flow
  { id: "fresh-leads", name: "Fresh Leads", pipeline: "Main Lead Flow", order: 1 },
  { id: "pending-contact", name: "Pending Contact", pipeline: "Main Lead Flow", order: 2 },
  { id: "pending-intake", name: "Pending Intake Completion", pipeline: "Main Lead Flow", order: 3 },
  { id: "scheduled-discovery", name: "Scheduled Discovery Call", pipeline: "Main Lead Flow", order: 4 },
  { id: "pending-iv", name: "Pending I/V", pipeline: "Main Lead Flow", order: 5 },
  { id: "scheduled-iv", name: "Scheduled I/V", pipeline: "Main Lead Flow", order: 6 },
  { id: "cancelled-iv", name: "Cancelled/No Show I/V", pipeline: "Main Lead Flow", order: 7 },
  { id: "pending-engagement-1", name: "Pending Engagement Lvl 1", pipeline: "Main Lead Flow", order: 8 },
  { id: "pending-engagement-2-3", name: "Pending Engagement Lvl 2 and 3", pipeline: "Main Lead Flow", order: 9 },
  { id: "scheduled-design", name: "Scheduled Design", pipeline: "Main Lead Flow", order: 10 },
  { id: "cancelled-design", name: "Cancelled/No Show Design", pipeline: "Main Lead Flow", order: 11 },
  { id: "engaged", name: "Engaged", pipeline: "Main Lead Flow", order: 12 },

  // Did Not Hire
  { id: "followup-pending-intake", name: "Follow-Up Completed: Pending Intake", pipeline: "Did Not Hire", order: 1 },
  { id: "rejected-bad-behavior", name: "Rejected Lead - due to bad behavior", pipeline: "Did Not Hire", order: 2 },
  { id: "rejected-not-qualified", name: "Rejected Lead - Not Qualified", pipeline: "Did Not Hire", order: 3 },
  { id: "outside-practice", name: "Outside Practice Area / Service Not Offered", pipeline: "Did Not Hire", order: 4 },
  { id: "not-ready", name: "Not Ready to Move Forward", pipeline: "Did Not Hire", order: 5 },
  { id: "conflict-issue", name: "Conflict Issue", pipeline: "Did Not Hire", order: 6 },
  { id: "cost-concerns", name: "Cost Concerns", pipeline: "Did Not Hire", order: 7 },
  { id: "service-not-needed", name: "Service No Longer Needed", pipeline: "Did Not Hire", order: 8 },
  { id: "hired-other", name: "Hired Other Attorney", pipeline: "Did Not Hire", order: 9 },
  { id: "others", name: "Others", pipeline: "Did Not Hire", order: 10 },
  { id: "not-a-fit", name: "Not a Fit", pipeline: "Did Not Hire", order: 11 },
  { id: "rejected-rush", name: "Rejected Lead – Rush Request", pipeline: "Did Not Hire", order: 12 },
  { id: "archived-actionstep", name: "Archived Lead from ActionStep", pipeline: "Did Not Hire", order: 13 },
  { id: "rejected-doc-changes", name: "Rejected Lead – Did Not Want Document Changes", pipeline: "Did Not Hire", order: 14 },
  { id: "location-concern", name: "Location Concern", pipeline: "Did Not Hire", order: 15 },
  { id: "internal-not-lead", name: "INTERNAL/NOT A LEAD", pipeline: "Did Not Hire", order: 16 },
  { id: "no-show-webinar", name: "No Show / Canceled Webinar", pipeline: "Did Not Hire", order: 17 },
  { id: "client-detractor", name: "Client Experience Detractor", pipeline: "Did Not Hire", order: 18 },
  { id: "language-barrier", name: "Language Barrier", pipeline: "Did Not Hire", order: 19 },
  { id: "bni-no-contact", name: "BNI Lead – No Contact", pipeline: "Did Not Hire", order: 20 },
  { id: "chose-not-proceed", name: "Lead Chose Not to Proceed", pipeline: "Did Not Hire", order: 21 },
  { id: "invalid-lead", name: "Invalid Lead", pipeline: "Did Not Hire", order: 22 },
  { id: "followup-pending-iv", name: "Follow-up Completed : Pending I/V", pipeline: "Did Not Hire", order: 23 },
  { id: "followup-no-show-iv", name: "Follow-up Completed : No Show / Canceled I/V", pipeline: "Did Not Hire", order: 24 },
  { id: "followup-did-not-engage", name: "Follow-up Completed : Did Not Engage Post-I/V or Post-Quotation", pipeline: "Did Not Hire", order: 25 },
  { id: "followup-pending-contact", name: "Follow-up Completed : Pending Contact", pipeline: "Did Not Hire", order: 26 },
];

// Mock Opportunities Data
export const placeholderOpportunities: Opportunity[] = [
  {
    id: "opp-001",
    title: "Estate Planning Package",
    contactName: "John Martinez",
    contact: {
      name: "John Martinez",
      email: "john.martinez@email.com",
      phone: "(555) 123-4567",
      source: "messenger",
    },
    estimatedValue: 5000,
    stageId: "fresh-leads",
    pipelineId: "Main Lead Flow",
    appointments: [],
    invoices: [],
    tasks: [
      {
        id: "task-001",
        title: "Send welcome email",
        completed: false,
        dueDate: new Date("2024-12-23"),
      },
      {
        id: "task-002",
        title: "Schedule discovery call",
        completed: false,
        dueDate: new Date("2024-12-24"),
      },
    ],
    workshops: [],
    notes: "",
    createdAt: new Date("2024-12-20"),
  },
  {
    id: "opp-002",
    title: "Trust Amendment",
    contactName: "Sarah Thompson",
    contact: {
      name: "Sarah Thompson",
      email: "sarah.t@gmail.com",
      phone: "(555) 987-6543",
      source: "instagram",
    },
    estimatedValue: 2500,
    stageId: "pending-contact",
    pipelineId: "Main Lead Flow",
    appointments: [],
    invoices: [],
    tasks: [],
    workshops: [
      {
        id: "ws-001",
        title: "Estate Planning Workshop",
        date: new Date("2024-12-15T14:00:00"),
        status: "completed",
        type: "Estate Planning 101",
        notes: "Attended virtual workshop",
      },
    ],
    notes: "Client interested in updating existing trust.",
    createdAt: new Date("2024-12-19"),
  },
  {
    id: "opp-003",
    title: "Medicaid Planning",
    contactName: "Michael Chen",
    contact: {
      name: "Michael Chen",
      email: "m.chen@outlook.com",
      phone: "(555) 456-7890",
      source: "sms",
    },
    estimatedValue: 8000,
    stageId: "scheduled-discovery",
    pipelineId: "Main Lead Flow",
    calendarAppointment: {
      date: new Date("2024-12-27T10:00:00"),
      type: "Discovery Call",
    },
    appointments: [
      {
        id: "apt-001",
        title: "Discovery Call - Michael Chen",
        date: new Date("2024-12-27T10:00:00"),
        type: "Discovery Call",
      },
    ],
    invoices: [],
    tasks: [
      {
        id: "task-003",
        title: "Review intake form",
        completed: true,
        dueDate: new Date("2024-12-20"),
      },
      {
        id: "task-004",
        title: "Prepare discovery call materials",
        completed: false,
        dueDate: new Date("2024-12-26"),
      },
    ],
    workshops: [
      {
        id: "ws-002",
        title: "Medicaid Planning Seminar",
        date: new Date("2024-12-28T10:00:00"),
        status: "scheduled",
        type: "Medicaid Planning",
      },
    ],
    notes: "Needs help with Medicaid planning for elderly parent.",
    createdAt: new Date("2024-12-18"),
  },
  {
    id: "opp-004",
    title: "Will Drafting",
    contactName: "Emily Rodriguez",
    contact: {
      name: "Emily Rodriguez",
      email: "emily.r@yahoo.com",
      phone: "(555) 321-0987",
      source: "email",
    },
    estimatedValue: 1500,
    stageId: "pending-intake",
    pipelineId: "Main Lead Flow",
    appointments: [],
    invoices: [],
    tasks: [],
    workshops: [],
    notes: "",
    createdAt: new Date("2024-12-17"),
  },
  {
    id: "opp-005",
    title: "Power of Attorney",
    contactName: "David Kim",
    contact: {
      name: "David Kim",
      email: "dkim@business.com",
      phone: "(555) 654-3210",
      source: "messenger",
    },
    estimatedValue: 800,
    stageId: "scheduled-iv",
    pipelineId: "Main Lead Flow",
    calendarAppointment: {
      date: new Date("2024-12-26T14:00:00"),
      type: "Initial Visit",
    },
    appointments: [
      {
        id: "apt-002",
        title: "Initial Visit - David Kim",
        date: new Date("2024-12-26T14:00:00"),
        type: "Initial Visit",
      },
    ],
    invoices: [],
    tasks: [],
    workshops: [],
    notes: "Needs POA for healthcare and financial matters.",
    createdAt: new Date("2024-12-16"),
  },
  {
    id: "opp-006",
    title: "Deed Transfer",
    contactName: "Lisa Wang",
    contact: {
      name: "Lisa Wang",
      email: "lisa.wang@email.com",
      phone: "(555) 111-2222",
    },
    estimatedValue: 1200,
    stageId: "pending-engagement-1",
    pipelineId: "Main Lead Flow",
    appointments: [],
    invoices: [
      {
        id: "inv-001",
        number: "INV-2024-001",
        amount: 600,
        status: "sent",
        dueDate: new Date("2025-01-05"),
      },
    ],
    tasks: [],
    workshops: [],
    notes: "Property transfer to family trust.",
    createdAt: new Date("2024-12-15"),
  },
  {
    id: "opp-007",
    title: "Full Estate Plan",
    contactName: "Robert Johnson",
    contact: {
      name: "Robert Johnson",
      email: "r.johnson@email.com",
      phone: "(555) 333-4444",
      source: "email",
    },
    estimatedValue: 12000,
    stageId: "scheduled-design",
    pipelineId: "Main Lead Flow",
    calendarAppointment: {
      date: new Date("2024-12-28T11:00:00"),
      type: "Design Meeting",
    },
    appointments: [
      {
        id: "apt-003",
        title: "Design Meeting - Robert Johnson",
        date: new Date("2024-12-28T11:00:00"),
        type: "Design Meeting",
      },
    ],
    invoices: [
      {
        id: "inv-002",
        number: "INV-2024-002",
        amount: 3000,
        status: "paid",
        dueDate: new Date("2024-12-20"),
      },
    ],
    tasks: [
      {
        id: "task-005",
        title: "Draft trust document",
        completed: true,
      },
      {
        id: "task-006",
        title: "Review healthcare directives",
        completed: false,
        dueDate: new Date("2024-12-27"),
      },
    ],
    workshops: [
      {
        id: "ws-003",
        title: "Trust Funding Workshop",
        date: new Date("2024-12-10T15:00:00"),
        status: "completed",
        type: "Trust Funding",
        notes: "Client attended with spouse",
      },
    ],
    notes: "Comprehensive estate plan including trust, will, and healthcare directives.",
    createdAt: new Date("2024-12-14"),
  },
  {
    id: "opp-008",
    title: "Trust Review",
    contactName: "Jennifer Lee",
    contact: {
      name: "Jennifer Lee",
      email: "jlee@email.com",
      phone: "(555) 555-6666",
      source: "instagram",
    },
    estimatedValue: 3500,
    stageId: "engaged",
    pipelineId: "Main Lead Flow",
    appointments: [
      {
        id: "apt-004",
        title: "Trust Review Meeting - Jennifer Lee",
        date: new Date("2024-12-30T15:00:00"),
        type: "Review Meeting",
      },
    ],
    invoices: [
      {
        id: "inv-003",
        number: "INV-2024-003",
        amount: 3500,
        status: "paid",
        dueDate: new Date("2024-12-25"),
      },
    ],
    tasks: [],
    workshops: [],
    notes: "Annual trust review and updates.",
    createdAt: new Date("2024-12-13"),
  },
  {
    id: "opp-009",
    title: "Estate Planning Consultation",
    contactName: "Mark Davis",
    contact: {
      name: "Mark Davis",
      email: "mark.d@email.com",
      phone: "(555) 777-8888",
    },
    estimatedValue: 2000,
    stageId: "cost-concerns",
    pipelineId: "Did Not Hire",
    appointments: [],
    invoices: [],
    tasks: [],
    workshops: [],
    notes: "Client had concerns about pricing. May follow up later.",
    createdAt: new Date("2024-12-10"),
  },
  {
    id: "opp-010",
    title: "Medicaid Application",
    contactName: "Amanda Wilson",
    contact: {
      name: "Amanda Wilson",
      email: "amanda.w@email.com",
      phone: "(555) 999-0000",
      source: "sms",
    },
    estimatedValue: 6000,
    stageId: "not-ready",
    pipelineId: "Did Not Hire",
    appointments: [],
    invoices: [],
    tasks: [],
    workshops: [],
    notes: "Not ready to proceed at this time. Follow up in 3 months.",
    createdAt: new Date("2024-12-08"),
  },
  {
    id: "opp-011",
    title: "Will Update",
    contactName: "Chris Brown",
    contact: {
      name: "Chris Brown",
      email: "chris.b@email.com",
      phone: "(555) 222-3333",
    },
    estimatedValue: 1000,
    stageId: "hired-other",
    pipelineId: "Did Not Hire",
    appointments: [],
    invoices: [],
    tasks: [],
    workshops: [],
    notes: "Client decided to go with another attorney.",
    createdAt: new Date("2024-12-05"),
  },
  {
    id: "opp-012",
    title: "PBTA Services",
    contactName: "Nancy Taylor",
    contact: {
      name: "Nancy Taylor",
      email: "nancy.t@email.com",
      phone: "(555) 444-5555",
      source: "messenger",
    },
    estimatedValue: 4500,
    stageId: "fresh-leads",
    pipelineId: "Main Lead Flow",
    appointments: [],
    invoices: [],
    tasks: [],
    workshops: [],
    notes: "",
    createdAt: new Date("2024-12-22"),
  },
  {
    id: "opp-013",
    title: "Asset Protection Trust",
    contactName: "George Miller",
    contact: {
      name: "George Miller",
      email: "g.miller@email.com",
      phone: "(555) 666-7777",
      source: "email",
    },
    estimatedValue: 15000,
    stageId: "pending-iv",
    pipelineId: "Main Lead Flow",
    appointments: [],
    invoices: [],
    tasks: [],
    workshops: [],
    notes: "High-value client interested in asset protection strategies.",
    createdAt: new Date("2024-12-21"),
  },
  {
    id: "opp-014",
    title: "Healthcare Directive",
    contactName: "Patricia Moore",
    contact: {
      name: "Patricia Moore",
      email: "p.moore@email.com",
      phone: "(555) 888-9999",
    },
    estimatedValue: 600,
    stageId: "cancelled-iv",
    pipelineId: "Main Lead Flow",
    appointments: [],
    invoices: [],
    tasks: [
      {
        id: "task-007",
        title: "Reschedule initial visit",
        completed: false,
        dueDate: new Date("2024-12-26"),
      },
    ],
    workshops: [
      {
        id: "ws-004",
        title: "Healthcare Planning Workshop",
        date: new Date("2024-12-20T09:00:00"),
        status: "no-show",
        type: "Healthcare Planning",
        notes: "Client did not attend",
      },
    ],
    notes: "Cancelled initial visit. Need to reschedule.",
    createdAt: new Date("2024-12-19"),
  },
];

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: MessageSource;
  opportunity?: {
    id: string;
    name: string;
    value: number;
    stage: string;
  };
}

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isOutgoing: boolean;
  read: boolean;
}

export interface Conversation {
  id: string;
  contact: Contact;
  messages: Message[];
  unreadCount: number;
  lastMessageAt: Date;
}

export const placeholderConversations: Conversation[] = [
  {
    id: "conv-1",
    contact: {
      id: "contact-1",
      firstName: "John",
      lastName: "Martinez",
      email: "john.martinez@email.com",
      phone: "(555) 123-4567",
      source: "messenger",
      opportunity: {
        id: "opp-1",
        name: "Personal Injury Case",
        value: 25000,
        stage: "Qualified",
      },
    },
    messages: [
      {
        id: "msg-1",
        content: "Hi, I was in a car accident last week and need legal help.",
        timestamp: new Date("2024-12-22T10:30:00"),
        isOutgoing: false,
        read: true,
      },
      {
        id: "msg-2",
        content: "Hello John! I'm sorry to hear about your accident. I'd be happy to help. Can you tell me more about what happened?",
        timestamp: new Date("2024-12-22T10:35:00"),
        isOutgoing: true,
        read: true,
      },
      {
        id: "msg-3",
        content: "I was rear-ended at a stoplight. The other driver was on their phone.",
        timestamp: new Date("2024-12-22T10:40:00"),
        isOutgoing: false,
        read: true,
      },
      {
        id: "msg-4",
        content: "That sounds like a clear liability case. Were there any injuries?",
        timestamp: new Date("2024-12-22T10:42:00"),
        isOutgoing: true,
        read: true,
      },
      {
        id: "msg-5",
        content: "Yes, I have whiplash and back pain. I've been to the doctor twice already.",
        timestamp: new Date("2024-12-22T10:45:00"),
        isOutgoing: false,
        read: false,
      },
    ],
    unreadCount: 1,
    lastMessageAt: new Date("2024-12-22T10:45:00"),
  },
  {
    id: "conv-2",
    contact: {
      id: "contact-2",
      firstName: "Sarah",
      lastName: "Thompson",
      email: "sarah.t@gmail.com",
      phone: "(555) 987-6543",
      source: "instagram",
      opportunity: {
        id: "opp-2",
        name: "Workers Comp Consultation",
        value: 15000,
        stage: "New Lead",
      },
    },
    messages: [
      {
        id: "msg-6",
        content: "Hello, I saw your post about workplace injuries. I got hurt at work and my employer is giving me trouble.",
        timestamp: new Date("2024-12-21T14:20:00"),
        isOutgoing: false,
        read: true,
      },
      {
        id: "msg-7",
        content: "Hi Sarah! Thanks for reaching out. Workers' compensation cases can be complex. What type of injury did you sustain?",
        timestamp: new Date("2024-12-21T14:25:00"),
        isOutgoing: true,
        read: true,
      },
      {
        id: "msg-8",
        content: "I hurt my shoulder lifting heavy boxes. They're saying it was my fault for not asking for help.",
        timestamp: new Date("2024-12-21T14:30:00"),
        isOutgoing: false,
        read: true,
      },
    ],
    unreadCount: 0,
    lastMessageAt: new Date("2024-12-21T14:30:00"),
  },
  {
    id: "conv-3",
    contact: {
      id: "contact-3",
      firstName: "Michael",
      lastName: "Chen",
      email: "m.chen@outlook.com",
      phone: "(555) 456-7890",
      source: "sms",
    },
    messages: [
      {
        id: "msg-9",
        content: "Quick question - do you handle slip and fall cases?",
        timestamp: new Date("2024-12-20T09:15:00"),
        isOutgoing: false,
        read: true,
      },
      {
        id: "msg-10",
        content: "Yes, we do! Premises liability is one of our specialties. Would you like to schedule a free consultation?",
        timestamp: new Date("2024-12-20T09:20:00"),
        isOutgoing: true,
        read: true,
      },
      {
        id: "msg-11",
        content: "That would be great. What times do you have available this week?",
        timestamp: new Date("2024-12-20T09:25:00"),
        isOutgoing: false,
        read: false,
      },
      {
        id: "msg-12",
        content: "I can meet Thursday at 2pm or Friday at 10am. Which works better for you?",
        timestamp: new Date("2024-12-20T09:30:00"),
        isOutgoing: true,
        read: true,
      },
      {
        id: "msg-13",
        content: "Friday at 10am works perfectly!",
        timestamp: new Date("2024-12-20T09:35:00"),
        isOutgoing: false,
        read: false,
      },
      {
        id: "msg-14",
        content: "What documents should I bring?",
        timestamp: new Date("2024-12-20T09:36:00"),
        isOutgoing: false,
        read: false,
      },
    ],
    unreadCount: 3,
    lastMessageAt: new Date("2024-12-20T09:36:00"),
  },
  {
    id: "conv-4",
    contact: {
      id: "contact-4",
      firstName: "Emily",
      lastName: "Rodriguez",
      email: "emily.r@yahoo.com",
      phone: "(555) 321-0987",
      source: "email",
      opportunity: {
        id: "opp-3",
        name: "Medical Malpractice Review",
        value: 50000,
        stage: "In Progress",
      },
    },
    messages: [
      {
        id: "msg-15",
        content: "Following up on our phone call. I've attached the medical records you requested.",
        timestamp: new Date("2024-12-19T16:00:00"),
        isOutgoing: false,
        read: true,
      },
      {
        id: "msg-16",
        content: "Thank you, Emily. I've received the documents and will review them this week. I'll be in touch soon.",
        timestamp: new Date("2024-12-19T16:15:00"),
        isOutgoing: true,
        read: true,
      },
    ],
    unreadCount: 0,
    lastMessageAt: new Date("2024-12-19T16:15:00"),
  },
  {
    id: "conv-5",
    contact: {
      id: "contact-5",
      firstName: "David",
      lastName: "Kim",
      email: "dkim@business.com",
      phone: "(555) 654-3210",
      source: "messenger",
    },
    messages: [
      {
        id: "msg-17",
        content: "Hi, I need a lawyer for a contract dispute with a vendor.",
        timestamp: new Date("2024-12-18T11:00:00"),
        isOutgoing: false,
        read: true,
      },
    ],
    unreadCount: 0,
    lastMessageAt: new Date("2024-12-18T11:00:00"),
  },
];
