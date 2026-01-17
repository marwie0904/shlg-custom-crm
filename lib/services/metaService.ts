import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Meta Graph API version
const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Initialize Convex client for fetching tokens
const getConvexClient = () => {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
  }
  return new ConvexHttpClient(url);
};

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MetaAttachment {
  type: "image" | "video" | "audio" | "file";
  url: string;
}

export interface PageCredentials {
  pageAccessToken: string;
  pageId: string;
}

/**
 * Get page credentials from database or fall back to env vars
 */
async function getPageCredentials(
  platform: "messenger" | "instagram"
): Promise<PageCredentials | null> {
  try {
    const convex = getConvexClient();

    // Try to get active page from database
    const dbPlatform = platform === "messenger" ? "facebook" : "instagram";
    const activePage = await convex.query(api.metaOAuth.getActivePage, {
      platform: dbPlatform,
    });

    if (activePage) {
      return {
        pageAccessToken: activePage.pageAccessToken,
        pageId: activePage.pageId,
      };
    }
  } catch (error) {
    console.warn("[MetaService] Failed to fetch credentials from DB, falling back to env vars:", error);
  }

  // Fall back to environment variables (backward compatibility)
  const envToken = process.env.META_PAGE_ACCESS_TOKEN;
  const envPageId = process.env.META_PAGE_ID;

  if (envToken && envPageId) {
    return {
      pageAccessToken: envToken,
      pageId: envPageId,
    };
  }

  return null;
}

/**
 * Send a message via Facebook Messenger
 */
export async function sendMessengerMessage(
  recipientPsid: string,
  message: string,
  attachment?: MetaAttachment
): Promise<SendMessageResult> {
  return sendMetaMessage("messenger", recipientPsid, message, attachment);
}

/**
 * Send a message via Instagram DM
 */
export async function sendInstagramMessage(
  recipientIgsid: string,
  message: string,
  attachment?: MetaAttachment
): Promise<SendMessageResult> {
  return sendMetaMessage("instagram", recipientIgsid, message, attachment);
}

/**
 * Internal function to send messages via Meta's Graph API
 */
async function sendMetaMessage(
  platform: "messenger" | "instagram",
  recipientId: string,
  message: string,
  attachment?: MetaAttachment
): Promise<SendMessageResult> {
  // Get credentials from database or env vars
  const credentials = await getPageCredentials(platform);

  if (!credentials) {
    return {
      success: false,
      error: "No Meta page credentials configured. Please connect a Facebook/Instagram page.",
    };
  }

  const { pageAccessToken: accessToken, pageId } = credentials;

  // Build the message payload
  interface MessagePayload {
    recipient: { id: string };
    message: {
      text?: string;
      attachment?: {
        type: string;
        payload: { url: string; is_reusable: boolean };
      };
    };
    messaging_type: string;
  }

  const payload: MessagePayload = {
    recipient: { id: recipientId },
    message: {},
    messaging_type: "RESPONSE", // Within 24-hour window
  };

  if (attachment) {
    payload.message.attachment = {
      type: attachment.type,
      payload: {
        url: attachment.url,
        is_reusable: true,
      },
    };
  } else {
    payload.message.text = message;
  }

  // Determine the endpoint based on platform
  const endpoint =
    platform === "instagram"
      ? `${GRAPH_API_BASE}/${pageId}/messages` // Instagram uses page ID
      : `${GRAPH_API_BASE}/me/messages`; // Messenger uses /me/messages

  try {
    const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[MetaService] Error sending ${platform} message:`, data);
      return {
        success: false,
        error: data.error?.message || "Unknown error",
      };
    }

    console.log(`[MetaService] ${platform} message sent successfully:`, data);
    return {
      success: true,
      messageId: data.message_id,
    };
  } catch (error) {
    console.error(`[MetaService] Failed to send ${platform} message:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Get user profile from Facebook/Instagram
 */
export async function getUserProfile(
  userId: string,
  platform: "messenger" | "instagram"
): Promise<{
  success: boolean;
  profile?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    profilePic?: string;
  };
  error?: string;
}> {
  const credentials = await getPageCredentials(platform);

  if (!credentials) {
    return { success: false, error: "No Meta page credentials configured" };
  }

  const { pageAccessToken: accessToken } = credentials;

  const fields =
    platform === "instagram"
      ? "id,name,profile_pic"
      : "id,first_name,last_name,profile_pic";

  try {
    const response = await fetch(
      `${GRAPH_API_BASE}/${userId}?fields=${fields}&access_token=${accessToken}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(`[MetaService] Error fetching ${platform} profile:`, data);
      return { success: false, error: data.error?.message };
    }

    return {
      success: true,
      profile: {
        id: data.id,
        name: data.name,
        firstName: data.first_name,
        lastName: data.last_name,
        profilePic: data.profile_pic,
      },
    };
  } catch (error) {
    console.error(`[MetaService] Failed to fetch ${platform} profile:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Mark a message as seen (sends read receipt)
 */
export async function markMessageSeen(
  recipientId: string,
  platform: "messenger" | "instagram"
): Promise<boolean> {
  const credentials = await getPageCredentials(platform);

  if (!credentials) {
    return false;
  }

  const { pageAccessToken: accessToken, pageId } = credentials;

  const endpoint =
    platform === "instagram"
      ? `${GRAPH_API_BASE}/${pageId}/messages`
      : `${GRAPH_API_BASE}/me/messages`;

  try {
    const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: "mark_seen",
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Send typing indicator
 */
export async function sendTypingIndicator(
  recipientId: string,
  platform: "messenger" | "instagram",
  typing: boolean = true
): Promise<boolean> {
  const credentials = await getPageCredentials(platform);

  if (!credentials) {
    return false;
  }

  const { pageAccessToken: accessToken, pageId } = credentials;

  const endpoint =
    platform === "instagram"
      ? `${GRAPH_API_BASE}/${pageId}/messages`
      : `${GRAPH_API_BASE}/me/messages`;

  try {
    const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: typing ? "typing_on" : "typing_off",
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
