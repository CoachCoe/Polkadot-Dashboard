import { securityLogger, SecurityEventType } from './securityLogger';

interface Session {
  id: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  expiresAt: number;
  ip: string;
  userAgent: string;
}

class SessionManager {
  private static instance: SessionManager;
  private sessions: Map<string, Session> = new Map();
  private readonly SESSION_DURATION = 3600000; // 1 hour in milliseconds
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes in milliseconds
  private readonly MAX_SESSIONS_PER_USER = 5;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Start cleanup interval in browser environment
      setInterval(() => void this.cleanupExpiredSessions(), this.CLEANUP_INTERVAL);
      // Load sessions from localStorage
      this.loadSessions();
    }
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private generateSessionId(): string {
    // Browser-safe random ID generation
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private loadSessions(): void {
    try {
      const savedSessions = localStorage.getItem('sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        this.sessions = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  private saveSessions(): void {
    try {
      const sessionsObj = Object.fromEntries(this.sessions);
      localStorage.setItem('sessions', JSON.stringify(sessionsObj));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  async createSession(userId: string, ip: string, userAgent: string): Promise<Session> {
    // Clean up old sessions first
    await this.cleanupUserSessions(userId);

    const now = Date.now();
    const session: Session = {
      id: this.generateSessionId(),
      userId,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.SESSION_DURATION,
      ip,
      userAgent
    };

    this.sessions.set(session.id, session);
    this.saveSessions();

    await securityLogger.logEvent({
      type: SecurityEventType.AUTH_ATTEMPT,
      timestamp: new Date().toISOString(),
      ip,
      userId,
      details: {
        action: 'session_created',
        userAgent
      }
    });

    return session;
  }

  async validateSession(sessionId: string, ip: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      await securityLogger.logEvent({
        type: SecurityEventType.INVALID_TOKEN,
        timestamp: new Date().toISOString(),
        ip,
        details: {
          reason: 'Invalid session ID'
        }
      });
      return false;
    }

    if (session.expiresAt < Date.now()) {
      await this.destroySession(sessionId);
      return false;
    }

    if (session.ip !== ip) {
      await securityLogger.logEvent({
        type: SecurityEventType.SUSPICIOUS_IP,
        timestamp: new Date().toISOString(),
        ip,
        userId: session.userId,
        details: {
          reason: 'IP mismatch',
          sessionIp: session.ip
        }
      });
      await this.destroySession(sessionId);
      return false;
    }

    // Update last activity and extend session
    session.lastActivity = Date.now();
    session.expiresAt = Date.now() + this.SESSION_DURATION;
    this.sessions.set(sessionId, session);
    this.saveSessions();

    return true;
  }

  async destroySession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      this.saveSessions();
      
      await securityLogger.logEvent({
        type: SecurityEventType.AUTH_ATTEMPT,
        timestamp: new Date().toISOString(),
        ip: session.ip,
        userId: session.userId,
        details: {
          action: 'session_destroyed'
        }
      });
    }
  }

  private async cleanupUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.lastActivity - a.lastActivity);

    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Keep only the most recent sessions
      const sessionsToRemove = userSessions.slice(this.MAX_SESSIONS_PER_USER - 1);
      for (const session of sessionsToRemove) {
        await this.destroySession(session.id);
      }
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = Date.now();
    const sessionEntries = Array.from(this.sessions.entries());
    for (const [sessionId, session] of sessionEntries) {
      if (session.expiresAt < now) {
        await this.destroySession(sessionId);
      }
    }
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }

  async revokeUserSessions(userId: string, currentSessionId?: string): Promise<void> {
    const sessionEntries = Array.from(this.sessions.entries());
    for (const [sessionId, session] of sessionEntries) {
      if (session.userId === userId && sessionId !== currentSessionId) {
        await this.destroySession(sessionId);
      }
    }
  }
}

export const sessionManager = SessionManager.getInstance(); 