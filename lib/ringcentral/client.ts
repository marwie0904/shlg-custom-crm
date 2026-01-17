import { SDK } from '@ringcentral/sdk';

let sdkInstance: SDK | null = null;
let isAuthenticated = false;

export function getRingCentralSDK(): SDK {
  if (!sdkInstance) {
    sdkInstance = new SDK({
      server: process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com',
      clientId: process.env.RINGCENTRAL_CLIENT_ID!,
      clientSecret: process.env.RINGCENTRAL_CLIENT_SECRET!,
    });
  }
  return sdkInstance;
}

export async function getAuthenticatedPlatform() {
  const sdk = getRingCentralSDK();
  const platform = sdk.platform();

  // Check if we need to authenticate
  const loggedIn = await platform.loggedIn();

  if (!loggedIn) {
    await platform.login({ jwt: process.env.RINGCENTRAL_JWT_TOKEN! });
  }

  return platform;
}

export async function refreshTokenIfNeeded() {
  const sdk = getRingCentralSDK();
  const platform = sdk.platform();

  try {
    const loggedIn = await platform.loggedIn();
    if (!loggedIn) {
      await platform.login({ jwt: process.env.RINGCENTRAL_JWT_TOKEN! });
    }
    return true;
  } catch (error) {
    console.error('RingCentral auth error:', error);
    return false;
  }
}
