import { getAuthenticatedPlatform } from './client';

export interface SMSMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  direction: 'Inbound' | 'Outbound';
  createdAt: string;
  readStatus: string;
  messageStatus: string;
}

export interface SendSMSParams {
  to: string;
  text: string;
  from?: string;
}

const DEFAULT_SMS_NUMBER = process.env.RINGCENTRAL_SMS_NUMBER || '+12393080848';

export async function sendSMS({ to, text, from }: SendSMSParams): Promise<SMSMessage> {
  const platform = await getAuthenticatedPlatform();

  // Normalize phone number
  const toNumber = normalizePhoneNumber(to);
  const fromNumber = from || DEFAULT_SMS_NUMBER;

  const response = await platform.post('/restapi/v1.0/account/~/extension/~/sms', {
    from: { phoneNumber: fromNumber },
    to: [{ phoneNumber: toNumber }],
    text,
  });

  const data = await response.json();

  return {
    id: data.id,
    from: data.from?.phoneNumber || fromNumber,
    to: data.to?.[0]?.phoneNumber || toNumber,
    text: data.subject || text,
    direction: 'Outbound',
    createdAt: data.creationTime,
    readStatus: data.readStatus,
    messageStatus: data.messageStatus,
  };
}

export interface GetMessagesParams {
  phoneNumber?: string;
  direction?: 'Inbound' | 'Outbound';
  dateFrom?: string;
  dateTo?: string;
  perPage?: number;
  page?: number;
}

export async function getMessages(params: GetMessagesParams = {}): Promise<{
  messages: SMSMessage[];
  totalCount: number;
  hasMore: boolean;
}> {
  const platform = await getAuthenticatedPlatform();

  const queryParams: Record<string, string> = {
    messageType: 'SMS',
    perPage: String(params.perPage || 50),
    page: String(params.page || 1),
  };

  if (params.phoneNumber) {
    queryParams.phoneNumber = normalizePhoneNumber(params.phoneNumber);
  }

  if (params.direction) {
    queryParams.direction = params.direction;
  }

  if (params.dateFrom) {
    queryParams.dateFrom = params.dateFrom;
  }

  if (params.dateTo) {
    queryParams.dateTo = params.dateTo;
  }

  const response = await platform.get('/restapi/v1.0/account/~/extension/~/message-store', queryParams);
  const data = await response.json();

  const messages: SMSMessage[] = (data.records || []).map((record: any) => ({
    id: record.id,
    from: record.from?.phoneNumber || '',
    to: record.to?.[0]?.phoneNumber || '',
    text: record.subject || '',
    direction: record.direction,
    createdAt: record.creationTime,
    readStatus: record.readStatus,
    messageStatus: record.messageStatus,
  }));

  return {
    messages,
    totalCount: data.paging?.totalElements || messages.length,
    hasMore: data.navigation?.nextPage !== undefined,
  };
}

export async function getConversation(phoneNumber: string): Promise<SMSMessage[]> {
  const platform = await getAuthenticatedPlatform();
  const normalizedNumber = normalizePhoneNumber(phoneNumber);

  // Get both inbound and outbound messages with this number
  const response = await platform.get('/restapi/v1.0/account/~/extension/~/message-store', {
    messageType: 'SMS',
    phoneNumber: normalizedNumber,
    perPage: '100',
  });

  const data = await response.json();

  const messages: SMSMessage[] = (data.records || []).map((record: any) => ({
    id: record.id,
    from: record.from?.phoneNumber || '',
    to: record.to?.[0]?.phoneNumber || '',
    text: record.subject || '',
    direction: record.direction,
    createdAt: record.creationTime,
    readStatus: record.readStatus,
    messageStatus: record.messageStatus,
  }));

  // Sort by creation time
  return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  const platform = await getAuthenticatedPlatform();

  await platform.put(`/restapi/v1.0/account/~/extension/~/message-store/${messageId}`, {
    readStatus: 'Read',
  });
}

function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let normalized = phone.replace(/[^\d+]/g, '');

  // Add +1 if it's a 10-digit US number
  if (normalized.length === 10) {
    normalized = '+1' + normalized;
  } else if (normalized.length === 11 && normalized.startsWith('1')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  return normalized;
}
