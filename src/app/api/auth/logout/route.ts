import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

export async function POST() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token');

    if (!sessionToken) {
      throw new PolkadotHubError(
        'No active session',
        ErrorCodes.AUTH.NO_SESSION,
        'No session token found in cookies.'
      );
    }

    // Delete the session cookie
    cookieStore.delete('session_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PolkadotHubError) {
      return NextResponse.json({ error: error.userMessage }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
} 