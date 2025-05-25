import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/authService';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session_id')?.value;
    const ip = request.ip ?? 'anonymous';

    if (!sessionId) {
      return NextResponse.json({ isAuthenticated: false });
    }

    const isValid = await authService.validateSession(sessionId, ip);
    return NextResponse.json({ isAuthenticated: isValid });
  } catch (error) {
    return NextResponse.json({ isAuthenticated: false });
  }
} 