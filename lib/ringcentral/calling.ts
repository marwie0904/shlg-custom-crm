import { getAuthenticatedPlatform } from './client';

export interface SIPInfo {
  transport: string;
  domain: string;
  outboundProxy: string;
  userName: string;
  password: string;
  authorizationId: string;
  stunServers: string[];
}

export interface SIPProvisionResponse {
  sipInfo: SIPInfo;
  sipFlags: {
    outboundCallsEnabled: boolean;
    dscpEnabled: boolean;
    dscpSignaling: number;
    dscpVoice: number;
    dscpVideo: number;
  };
  device: {
    id: string;
    uri: string;
  };
}

export async function getSIPProvision(): Promise<SIPProvisionResponse> {
  const platform = await getAuthenticatedPlatform();

  const response = await platform.post('/restapi/v1.0/client-info/sip-provision', {
    sipInfo: [{ transport: 'WSS' }],
  });

  const data = await response.json();

  return {
    sipInfo: data.sipInfo[0],
    sipFlags: data.sipFlags,
    device: data.device,
  };
}

export interface CallLogEntry {
  id: string;
  sessionId: string;
  from: {
    phoneNumber: string;
    name?: string;
    location?: string;
  };
  to: {
    phoneNumber: string;
    name?: string;
    location?: string;
  };
  direction: 'Inbound' | 'Outbound';
  type: string;
  action: string;
  result: string;
  startTime: string;
  duration: number;
  recording?: {
    id: string;
    uri: string;
    contentUri: string;
  };
}

export interface GetCallLogsParams {
  phoneNumber?: string;
  direction?: 'Inbound' | 'Outbound';
  dateFrom?: string;
  dateTo?: string;
  perPage?: number;
  page?: number;
  type?: 'Voice' | 'Fax';
  view?: 'Simple' | 'Detailed';
  withRecording?: boolean;
}

export async function getCallLogs(params: GetCallLogsParams = {}): Promise<{
  calls: CallLogEntry[];
  totalCount: number;
  hasMore: boolean;
}> {
  const platform = await getAuthenticatedPlatform();

  const queryParams: Record<string, string> = {
    perPage: String(params.perPage || 50),
    page: String(params.page || 1),
    view: params.view || 'Detailed',
    type: params.type || 'Voice',
  };

  if (params.phoneNumber) {
    queryParams.phoneNumber = params.phoneNumber;
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

  if (params.withRecording) {
    queryParams.withRecording = 'true';
  }

  const response = await platform.get('/restapi/v1.0/account/~/extension/~/call-log', queryParams);
  const data = await response.json();

  const calls: CallLogEntry[] = (data.records || []).map((record: any) => ({
    id: record.id,
    sessionId: record.sessionId,
    from: {
      phoneNumber: record.from?.phoneNumber || '',
      name: record.from?.name,
      location: record.from?.location,
    },
    to: {
      phoneNumber: record.to?.phoneNumber || '',
      name: record.to?.name,
      location: record.to?.location,
    },
    direction: record.direction,
    type: record.type,
    action: record.action,
    result: record.result,
    startTime: record.startTime,
    duration: record.duration || 0,
    recording: record.recording
      ? {
          id: record.recording.id,
          uri: record.recording.uri,
          contentUri: record.recording.contentUri,
        }
      : undefined,
  }));

  return {
    calls,
    totalCount: data.paging?.totalElements || calls.length,
    hasMore: data.navigation?.nextPage !== undefined,
  };
}

export async function getCallRecording(recordingId: string): Promise<Buffer> {
  const platform = await getAuthenticatedPlatform();

  const response = await platform.get(
    `/restapi/v1.0/account/~/recording/${recordingId}/content`
  );

  // RingCentral SDK response has buffer() method
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export interface ActiveCall {
  id: string;
  direction: 'Inbound' | 'Outbound';
  from: string;
  to: string;
  telephonyStatus: string;
  sipData?: {
    toTag: string;
    fromTag: string;
    remoteUri: string;
    localUri: string;
  };
}

export async function getActiveCalls(): Promise<ActiveCall[]> {
  const platform = await getAuthenticatedPlatform();

  const response = await platform.get('/restapi/v1.0/account/~/extension/~/active-calls');
  const data = await response.json();

  return (data.records || []).map((record: any) => ({
    id: record.id,
    direction: record.direction,
    from: record.from?.phoneNumber || '',
    to: record.to?.phoneNumber || '',
    telephonyStatus: record.telephonyStatus,
    sipData: record.sipData,
  }));
}

export async function getPresence(): Promise<{
  telephonyStatus: string;
  presenceStatus: string;
  userStatus: string;
  dndStatus: string;
  activeCalls: ActiveCall[];
}> {
  const platform = await getAuthenticatedPlatform();

  const response = await platform.get('/restapi/v1.0/account/~/extension/~/presence?detailedTelephonyState=true');
  const data = await response.json();

  return {
    telephonyStatus: data.telephonyStatus,
    presenceStatus: data.presenceStatus,
    userStatus: data.userStatus,
    dndStatus: data.dndStatus,
    activeCalls: (data.activeCalls || []).map((call: any) => ({
      id: call.id,
      direction: call.direction,
      from: call.from?.phoneNumber || '',
      to: call.to?.phoneNumber || '',
      telephonyStatus: call.telephonyStatus,
    })),
  };
}
