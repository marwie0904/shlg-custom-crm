/**
 * MOCK DATA HOOKS
 * ================
 * Custom hooks that return mock data for development/demo purposes.
 *
 * TO RESTORE REAL DATA:
 * 1. Set NEXT_PUBLIC_USE_MOCK_DATA=false in .env.local
 * 2. Or delete the variable entirely
 * 3. Revert pages to use Convex hooks directly
 */

import { useState, useMemo } from 'react';
import {
  mockContacts,
  mockOpportunities,
  mockPipelineStages,
  mockTasks,
  mockInvoices,
  mockIntakeSubmissions,
  mockAppointments,
  mockWorkshops,
  mockConversations,
  mockUsers,
  mockDashboardStats,
  mockLeads,
  type MockContact,
  type MockOpportunityForKanban,
  type MockStage,
  type MockTask,
  type MockInvoice,
  type MockIntake,
  type MockAppointment,
  type MockWorkshop,
  type MockConversation,
  type MockUser,
  type MockDashboardStats,
  type MockLead,
  type PipelineName,
  type ContactRelationshipType,
} from '../mock-data';

// ============================================================================
// CONTACTS
// ============================================================================

// Helper to enrich contacts with relationship data
function enrichContactWithRelationships(contact: MockContact): MockContact {
  // If this contact has a primary contact, get the primary contact's name
  let primaryContactName: string | undefined;
  if (contact.primaryContactId) {
    const primaryContact = mockContacts.find(c => c._id === contact.primaryContactId);
    if (primaryContact) {
      primaryContactName = `${primaryContact.firstName} ${primaryContact.lastName}`;
    }
  }

  // Get sub-contacts (contacts where this contact is the primary)
  const subContacts = mockContacts
    .filter(c => c.primaryContactId === contact._id)
    .map(c => ({
      _id: c._id,
      firstName: c.firstName,
      lastName: c.lastName,
      relationshipType: c.relationshipType!,
    }));

  return {
    ...contact,
    primaryContactName,
    subContacts: subContacts.length > 0 ? subContacts : undefined,
  };
}

export function useMockContacts(options?: { searchQuery?: string; limit?: number }) {
  return useMemo(() => {
    let result = mockContacts.map(enrichContactWithRelationships);

    if (options?.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      result = result.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.primaryContactName?.toLowerCase().includes(query) ||
        c.relationshipType?.toLowerCase().includes(query)
      );
    }

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }, [options?.searchQuery, options?.limit]);
}

export function useMockContactById(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    const contact = mockContacts.find(c => c._id === id);
    if (!contact) return null;
    return enrichContactWithRelationships(contact);
  }, [id]);
}

// ============================================================================
// OPPORTUNITIES
// ============================================================================

export function useMockOpportunities(options?: { pipelineId?: PipelineName }) {
  return useMemo(() => {
    let result = [...mockOpportunities];

    if (options?.pipelineId) {
      result = result.filter(o => o.pipelineId === options.pipelineId);
    }

    return result;
  }, [options?.pipelineId]);
}

export function useMockOpportunityById(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    return mockOpportunities.find(o => o._id === id) || null;
  }, [id]);
}

// ============================================================================
// PIPELINE STAGES
// ============================================================================

export function useMockPipelineStages(options?: { pipeline?: PipelineName }) {
  return useMemo(() => {
    let result = [...mockPipelineStages];

    if (options?.pipeline) {
      result = result.filter(s => s.pipeline === options.pipeline);
    }

    return result.sort((a, b) => a.order - b.order);
  }, [options?.pipeline]);
}

// ============================================================================
// TASKS
// ============================================================================

export function useMockTasks(options?: { searchQuery?: string }) {
  return useMemo(() => {
    let result = [...mockTasks];

    if (options?.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.assignedToName?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [options?.searchQuery]);
}

// ============================================================================
// INVOICES
// ============================================================================

export function useMockInvoices(options?: { limit?: number }) {
  return useMemo(() => {
    let result = [...mockInvoices];

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }, [options?.limit]);
}

export function useMockInvoiceById(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    return mockInvoices.find(i => i._id === id) || null;
  }, [id]);
}

// ============================================================================
// INTAKE
// ============================================================================

export function useMockIntakeSubmissions(options?: { limit?: number }) {
  return useMemo(() => {
    let result = [...mockIntakeSubmissions];

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }, [options?.limit]);
}

export function useMockIntakeById(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    return mockIntakeSubmissions.find(i => i._id === id) || null;
  }, [id]);
}

// ============================================================================
// APPOINTMENTS
// ============================================================================

export function useMockAppointments(options?: { limit?: number }) {
  return useMemo(() => {
    let result = [...mockAppointments];

    if (options?.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }, [options?.limit]);
}

// ============================================================================
// WORKSHOPS
// ============================================================================

export function useMockWorkshops() {
  return useMemo(() => {
    return [...mockWorkshops];
  }, []);
}

export function useMockWorkshopById(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    return mockWorkshops.find(w => w._id === id) || null;
  }, [id]);
}

// ============================================================================
// CONVERSATIONS
// ============================================================================

export function useMockConversations() {
  return useMemo(() => {
    return mockConversations
      .map(conv => {
        // Compute lastMessage from messages array
        const messages = conv.messages || [];
        const lastMessage = messages.length > 0
          ? messages[messages.length - 1]
          : null;
        return {
          ...conv,
          lastMessage,
        };
      })
      // Sort by most recent first
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, []);
}

export function useMockConversationById(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    const conv = mockConversations.find(c => c._id === id);
    if (!conv) return null;

    // Compute lastMessage from messages array
    const messages = conv.messages || [];
    const lastMessage = messages.length > 0
      ? messages[messages.length - 1]
      : null;

    return {
      ...conv,
      lastMessage,
    };
  }, [id]);
}

// ============================================================================
// USERS
// ============================================================================

export function useMockUsers() {
  return useMemo(() => {
    return [...mockUsers];
  }, []);
}

// ============================================================================
// DASHBOARD
// ============================================================================

export function useMockDashboardStats(): MockDashboardStats {
  return mockDashboardStats;
}

// ============================================================================
// MOCK MUTATIONS (no-op for demo)
// ============================================================================

export function useMockMutation() {
  return async (...args: unknown[]) => {
    console.log('[Mock] Mutation called with:', args);
    return { success: true };
  };
}

// ============================================================================
// CONTACT WITH RELATED (for contact detail page)
// ============================================================================

export function useMockContactWithRelated(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    const contact = mockContacts.find(c => c._id === id);
    if (!contact) return null;

    // Enrich with relationship data
    const enrichedContact = enrichContactWithRelationships(contact);

    // Get related opportunities
    const opportunities = mockOpportunities
      .filter(o => o.contactId === id)
      .map(o => ({
        ...o,
        tasks: mockTasks.filter(t => t.opportunityId === o._id),
      }));

    // Get related tasks
    const tasks = mockTasks.filter(t => t.contactId === id);

    // Get related invoices
    const invoices = mockInvoices.filter(i => i.contactId === id);

    // Get related appointments
    const appointments = mockAppointments.filter(a => a.contactId === id);

    // Get full sub-contact details for the detail page
    const relatedContacts = mockContacts
      .filter(c => c.primaryContactId === id)
      .map(c => enrichContactWithRelationships(c));

    // Get primary contact details if this is a sub-contact
    let primaryContact: MockContact | null = null;
    if (contact.primaryContactId) {
      const primary = mockContacts.find(c => c._id === contact.primaryContactId);
      if (primary) {
        primaryContact = enrichContactWithRelationships(primary);
      }
    }

    return {
      ...enrichedContact,
      opportunities,
      tasks,
      invoices,
      appointments,
      documents: [], // Mock empty documents
      relatedContacts,  // Full sub-contact details
      primaryContact,   // Full primary contact details (if sub-contact)
    };
  }, [id]);
}

// ============================================================================
// OPPORTUNITY WITH RELATED (for opportunity detail modal)
// ============================================================================

export function useMockOpportunityWithRelated(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    const opportunity = mockOpportunities.find(o => o._id === id);
    if (!opportunity) return null;

    // Use contact from opportunity (enriched) or fallback to mockContacts
    const contact = opportunity.contact || mockContacts.find(c => c._id === opportunity.contactId);
    const tasks = mockTasks.filter(t => t.opportunityId === id).map(t => ({
      ...t,
      createdAt: t.createdAt || Date.now() - 86400000 * 2,
    }));
    const invoices = mockInvoices.filter(i => i.opportunityId === id);
    const appointments = mockAppointments.filter(a => a.contactId === opportunity.contactId);

    return {
      ...opportunity,
      contact,
      tasks,
      invoices,
      appointments,
      workshops: [],
      documents: [],
    };
  }, [id]);
}

// ============================================================================
// WORKSHOP WITH DETAILS (for workshop detail modal)
// ============================================================================

// Mock workshop registrations data
const mockWorkshopRegistrations: Record<string, Array<{
  _id: string;
  contactId: string;
  status: "attended" | "no-show" | "registered";
  registeredAt: number;
  attendedAt?: number;
}>> = {
  "workshop-001": [
    { _id: "reg-001", contactId: "contact-001", status: "registered", registeredAt: Date.now() - 86400000 * 5 },
    { _id: "reg-002", contactId: "contact-002", status: "registered", registeredAt: Date.now() - 86400000 * 4 },
    { _id: "reg-003", contactId: "contact-003", status: "registered", registeredAt: Date.now() - 86400000 * 3 },
    { _id: "reg-004", contactId: "contact-005", status: "registered", registeredAt: Date.now() - 86400000 * 2 },
  ],
  "workshop-002": [
    { _id: "reg-005", contactId: "contact-006", status: "registered", registeredAt: Date.now() - 86400000 * 7 },
    { _id: "reg-006", contactId: "contact-007", status: "registered", registeredAt: Date.now() - 86400000 * 6 },
    { _id: "reg-007", contactId: "contact-011", status: "registered", registeredAt: Date.now() - 86400000 * 4 },
  ],
  "workshop-003": [
    { _id: "reg-008", contactId: "contact-001", status: "attended", registeredAt: Date.now() - 86400000 * 20, attendedAt: Date.now() - 86400000 * 5 },
    { _id: "reg-009", contactId: "contact-002", status: "attended", registeredAt: Date.now() - 86400000 * 18, attendedAt: Date.now() - 86400000 * 5 },
    { _id: "reg-010", contactId: "contact-003", status: "no-show", registeredAt: Date.now() - 86400000 * 15 },
    { _id: "reg-011", contactId: "contact-004", status: "attended", registeredAt: Date.now() - 86400000 * 14, attendedAt: Date.now() - 86400000 * 5 },
    { _id: "reg-012", contactId: "contact-005", status: "attended", registeredAt: Date.now() - 86400000 * 12, attendedAt: Date.now() - 86400000 * 5 },
    { _id: "reg-013", contactId: "contact-006", status: "no-show", registeredAt: Date.now() - 86400000 * 10 },
    { _id: "reg-014", contactId: "contact-007", status: "attended", registeredAt: Date.now() - 86400000 * 8, attendedAt: Date.now() - 86400000 * 5 },
    { _id: "reg-015", contactId: "contact-008", status: "attended", registeredAt: Date.now() - 86400000 * 7, attendedAt: Date.now() - 86400000 * 5 },
  ],
  "workshop-004": [
    { _id: "reg-016", contactId: "contact-009", status: "registered", registeredAt: Date.now() - 86400000 * 3 },
    { _id: "reg-017", contactId: "contact-010", status: "registered", registeredAt: Date.now() - 86400000 * 2 },
  ],
};

export function useMockWorkshopWithDetails(id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    const workshop = mockWorkshops.find(w => w._id === id);
    if (!workshop) return null;

    // Get registrations for this workshop and enrich with contact data
    const registrations = (mockWorkshopRegistrations[id] || []).map(reg => {
      const contact = mockContacts.find(c => c._id === reg.contactId);
      return {
        ...reg,
        contact: contact ? {
          _id: contact._id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
        } : null,
      };
    });

    return {
      ...workshop,
      registrations,
      tasks: mockTasks.filter(t => t.workshopId === id),
      documents: [],
    };
  }, [id]);
}

// ============================================================================
// PRODUCTS (for invoice modal)
// ============================================================================

export interface MockProduct {
  _id: string;
  name: string;
  price: number;
  description?: string;
  active: boolean;
}

export const mockProducts: MockProduct[] = [
  { _id: "prod-001", name: "Estate Planning Package", price: 3500, description: "Complete estate planning services", active: true },
  { _id: "prod-002", name: "Trust Amendment", price: 750, description: "Amendment to existing trust", active: true },
  { _id: "prod-003", name: "Will Drafting", price: 500, description: "Simple will preparation", active: true },
  { _id: "prod-004", name: "Power of Attorney", price: 300, description: "POA document preparation", active: true },
  { _id: "prod-005", name: "Initial Consultation", price: 250, description: "Initial consultation fee", active: true },
];

export function useMockProducts(options?: { activeOnly?: boolean }) {
  return useMemo(() => {
    let result = [...mockProducts];
    if (options?.activeOnly) {
      result = result.filter(p => p.active);
    }
    return result;
  }, [options?.activeOnly]);
}

// ============================================================================
// NEXT INVOICE NUMBER (for invoice modal)
// ============================================================================

export function useMockNextInvoiceNumber() {
  return `INV-${Date.now().toString().slice(-6)}`;
}

// ============================================================================
// CONTACT SEARCH (for add attendee modal)
// ============================================================================

export function useMockContactSearch(query: string | null) {
  return useMemo(() => {
    if (!query || query.length < 2) return undefined;
    const q = query.toLowerCase();
    return mockContacts.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  }, [query]);
}

// ============================================================================
// LEADS (fresh leads awaiting accept/ignore)
// ============================================================================

export function useMockLeads() {
  return useMemo(() => {
    return [...mockLeads].sort((a, b) => b.createdAt - a.createdAt);
  }, []);
}

// Re-export types
export type {
  MockContact,
  MockOpportunityForKanban,
  MockStage,
  MockTask,
  MockInvoice,
  MockIntake,
  MockAppointment,
  MockWorkshop,
  MockConversation,
  MockUser,
  MockDashboardStats,
  MockLead,
  ContactRelationshipType,
};
