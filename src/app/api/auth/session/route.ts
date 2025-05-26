import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/authService';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const isValid = await authService.verifySession(sessionToken);
    return NextResponse.json({ isAuthenticated: isValid });
  } catch (error) {
    return NextResponse.json({ isAuthenticated: false });
  }
} 