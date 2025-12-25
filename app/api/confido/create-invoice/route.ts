import { NextRequest, NextResponse } from "next/server";

const CONFIDO_API_URL = process.env.CONFIDO_API_URL || "https://api.gravity-legal.com/";
const CONFIDO_API_KEY = process.env.CONFIDO_API_KEY;

interface ConfidoGraphQLResponse {
  data?: Record<string, unknown>;
  errors?: Array<{ message: string }>;
}

/**
 * Execute a GraphQL query/mutation against the Confido API
 */
async function executeGraphQL(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<Record<string, unknown>> {
  const response = await fetch(CONFIDO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIDO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const result: ConfidoGraphQLResponse = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(`GraphQL Error: ${result.errors[0].message}`);
  }

  return result.data || {};
}

/**
 * Find or create a client in Confido
 */
async function findOrCreateClient(clientData: {
  name: string;
  email?: string;
  phone?: string;
  externalId: string;
}): Promise<{ clientId: string; isNew: boolean }> {
  // Try to find existing client by externalId
  const searchQuery = `
    query GetClients {
      clientsList {
        clients {
          id
          clientName
          email
          phone
          externalId
        }
      }
    }
  `;

  const searchResult = await executeGraphQL(searchQuery);
  const clients = (searchResult.clientsList as { clients: Array<{ id: string; externalId: string }> })?.clients || [];
  const existingClient = clients.find((c) => c.externalId === clientData.externalId);

  if (existingClient) {
    return { clientId: existingClient.id, isNew: false };
  }

  // Create new client
  const createMutation = `
    mutation AddClient($input: AddClientInput!) {
      addClient(input: $input) {
        id
        clientName
        email
        phone
        externalId
      }
    }
  `;

  const createResult = await executeGraphQL(createMutation, {
    input: {
      clientName: clientData.name,
      email: clientData.email || null,
      phone: clientData.phone || null,
      externalId: clientData.externalId,
    },
  });

  const newClient = createResult.addClient as { id: string };
  return { clientId: newClient.id, isNew: true };
}

/**
 * Find or create a matter in Confido
 */
async function findOrCreateMatter(matterData: {
  clientId: string;
  name: string;
  externalId: string;
}): Promise<{ matterId: string; isNew: boolean }> {
  // Try to find existing matter
  const searchQuery = `
    query GetMatters($clientId: String) {
      client(id: $clientId) {
        matters {
          edges {
            node {
              id
              name
              externalId
            }
          }
        }
      }
    }
  `;

  const searchResult = await executeGraphQL(searchQuery, { clientId: matterData.clientId });
  const matters = (searchResult.client as { matters: { edges: Array<{ node: { id: string; externalId: string } }> } })?.matters?.edges || [];
  const existingMatter = matters.find((e) => e.node.externalId === matterData.externalId)?.node;

  if (existingMatter) {
    return { matterId: existingMatter.id, isNew: false };
  }

  // Create new matter
  const createMutation = `
    mutation AddMatter($input: AddMatterInput!) {
      addMatter(input: $input) {
        id
        name
        externalId
      }
    }
  `;

  const createResult = await executeGraphQL(createMutation, {
    input: {
      clientId: matterData.clientId,
      name: matterData.name,
      externalId: matterData.externalId,
    },
  });

  const newMatter = createResult.addMatter as { id: string };
  return { matterId: newMatter.id, isNew: true };
}

/**
 * Create a payment link in Confido
 */
async function createPaymentLink(data: {
  clientId: string;
  matterId: string;
  amount: number;
  externalId: string;
  memo: string;
}): Promise<{
  paymentLinkId: string;
  paymentUrl: string;
  status: string;
}> {
  const totalInCents = Math.round(data.amount * 100);

  const mutation = `
    mutation AddPaymentLink($input: AddPaymentLinkInput!) {
      addPaymentLink(input: $input) {
        id
        externalId
        url
        status
        balance {
          totalOutstanding
          totalPaid
        }
      }
    }
  `;

  const result = await executeGraphQL(mutation, {
    input: {
      clientId: data.clientId,
      matterId: data.matterId,
      operating: totalInCents,
      externalId: data.externalId,
      memo: data.memo,
      sendReceipts: true,
      surchargeEnabled: true,
      paymentMethodsAllowed: ["CREDIT", "ACH"],
    },
  });

  const paymentLink = result.addPaymentLink as {
    id: string;
    url: string;
    status: string;
    balance: { totalOutstanding: number; totalPaid: number };
  };

  const balance = paymentLink.balance;
  const status = balance.totalOutstanding === 0 ? "paid" : "unpaid";

  return {
    paymentLinkId: paymentLink.id,
    paymentUrl: paymentLink.url,
    status,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check for API key
    if (!CONFIDO_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Confido API key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      invoiceId,
      contactId,
      contactName,
      contactEmail,
      contactPhone,
      opportunityId,
      opportunityName,
      amount,
      invoiceNumber,
      memo,
    } = body;

    // Validate required fields
    if (!invoiceId || !contactId || !contactName || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("=== Creating Confido Payment Link ===");
    console.log("Invoice ID:", invoiceId);
    console.log("Contact:", contactName);
    console.log("Amount:", amount);

    // Step 1: Find or create client
    const clientResult = await findOrCreateClient({
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      externalId: contactId,
    });
    console.log("Client ID:", clientResult.clientId, clientResult.isNew ? "(new)" : "(existing)");

    // Step 2: Find or create matter
    const matterResult = await findOrCreateMatter({
      clientId: clientResult.clientId,
      name: opportunityName || `Matter for ${contactName}`,
      externalId: opportunityId || contactId, // Use contactId as fallback
    });
    console.log("Matter ID:", matterResult.matterId, matterResult.isNew ? "(new)" : "(existing)");

    // Step 3: Create payment link
    const paymentResult = await createPaymentLink({
      clientId: clientResult.clientId,
      matterId: matterResult.matterId,
      amount,
      externalId: invoiceId,
      memo: memo || `Invoice #${invoiceNumber || "N/A"}`,
    });
    console.log("Payment Link ID:", paymentResult.paymentLinkId);
    console.log("Payment URL:", paymentResult.paymentUrl);

    return NextResponse.json({
      success: true,
      confidoInvoiceId: paymentResult.paymentLinkId,
      confidoClientId: clientResult.clientId,
      confidoMatterId: matterResult.matterId,
      paymentUrl: paymentResult.paymentUrl,
      status: paymentResult.status,
    });
  } catch (error) {
    console.error("Error creating Confido payment link:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
