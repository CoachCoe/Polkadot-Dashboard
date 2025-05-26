import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    return NextResponse.json({
      isAuthenticated: Boolean(sessionToken)
    });
  } catch (error) {
    return NextResponse.json({ isAuthenticated: false });
  }
} 