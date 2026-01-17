import { Id, Doc } from "@/convex/_generated/dataModel";

// Types based on Convex schema
export type MessageSource = "messenger" | "instagram" | "sms" | "email";
export type PipelineName = "Main Lead Flow" | "Did Not Hire";

// Stage type from Convex
export interface Stage {
  _id: Id<"pipelineStages">;
  name: string;
  pipeline: string;
  order: number;
  color?: string;
}

// Contact from Convex
export interface OpportunityContact {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  source?: string;
}

// Lightweight contact for Kanban cards (minimal data)
export interface KanbanContact {
  _id: Id<"contacts">;
  firstName: string;
  lastName: string;
  source?: string;
}

// Lightweight opportunity for Kanban board (minimal data for cards)
export interface OpportunityForKanban {
  _id: Id<"opportunities">;
  title: string;
  contactId: Id<"contacts">;
  pipelineId: string;
  stageId: string;
  estimatedValue: number;
  practiceArea?: string;
  source?: string;
  responsibleAttorneyId?: Id<"users">;
  responsibleAttorneyName?: string;
  calendarAppointmentDate?: number;
  calendarAppointmentType?: string;
  didNotHireAt?: number;
  didNotHireReason?: string;
  didNotHirePoint?: string;
  createdAt: number;
  updatedAt: number;
  contact: KanbanContact | null;
}

// Appointment from Convex
export interface Appointment {
  _id: Id<"appointments">;
  title: string;
  date: number;
  time: string;
  type: string;
  status: string;
  location?: string;
  notes?: string;
}

// Invoice from Convex
export interface Invoice {
  _id: Id<"invoices">;
  contactId: Id<"contacts">;
  opportunityId?: Id<"opportunities">;
  name: string;
  invoiceNumber: string;
  amount: number;
  amountPaid?: number;
  status: string;
  issueDate: number;
  dueDate?: number;
  paidDate?: number;
  paymentLink?: string;
  paymentMethod?: string;
  lineItems?: { productId?: Id<"products">; description: string; quantity: number; unitPrice: number; total: number; }[];
  notes?: string;
  confidoInvoiceId?: string;
  confidoClientId?: string;
  confidoMatterId?: string;
  createdAt: number;
  updatedAt: number;
}

// Task from Convex
export interface OpportunityTask {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  dueDate?: number;
  completed: boolean;
  status: string;
  priority?: string;
  assignedTo?: string;
  assignedToName?: string;
}

// Workshop with registration status
export interface OpportunityWorkshop {
  _id: Id<"workshops">;
  title: string;
  date: number;
  time: string;
  location: string;
  status: string;
  type?: string;
  notes?: string;
  registrationStatus: string; // "registered" | "attended" | "no-show" | "cancelled"
}

// Document with download URL
export interface OpportunityDocument {
  _id: Id<"documents">;
  name: string;
  type?: string;
  mimeType?: string;
  size?: number;
  uploadedAt: number;
  downloadUrl?: string | null;
}

// Related contact with relationship
export interface RelatedContact {
  _id: Id<"opportunityContacts">;
  opportunityId: Id<"opportunities">;
  contactId: Id<"contacts">;
  relationship: string;
  notes?: string;
  createdAt: number;
  contact: OpportunityContact | null;
}

// Full opportunity with related data
export interface OpportunityWithRelated {
  _id: Id<"opportunities">;
  title: string;
  contactId: Id<"contacts">;
  pipelineId: string;
  stageId: string;
  estimatedValue: number;
  practiceArea?: string;
  source?: string;
  responsibleAttorneyId?: Id<"users">;
  responsibleAttorneyName?: string;
  notes?: string;
  calendarAppointmentDate?: number;
  calendarAppointmentType?: string;
  didNotHireAt?: number;
  didNotHireReason?: string;
  didNotHirePoint?: string;
  ghlOpportunityId?: string;
  createdAt: number;
  updatedAt: number;
  // Related data
  contact: OpportunityContact | null;
  appointments: Appointment[];
  invoices: Invoice[];
  tasks: OpportunityTask[];
  workshops: OpportunityWorkshop[];
  documents: OpportunityDocument[];
  relatedContacts?: RelatedContact[];
}

// Helper to get contact display name (works with both full and Kanban contact)
export function getContactDisplayName(contact: OpportunityContact | KanbanContact | null): string {
  if (!contact) return "Unknown Contact";
  return `${contact.firstName} ${contact.lastName}`.trim();
}

// Helper to get source as MessageSource type (works with both full and Kanban contact)
export function getContactSource(contact: OpportunityContact | KanbanContact | null): MessageSource | undefined {
  if (!contact?.source) return undefined;
  const validSources: MessageSource[] = ["messenger", "instagram", "sms", "email"];
  return validSources.includes(contact.source as MessageSource)
    ? contact.source as MessageSource
    : undefined;
}
