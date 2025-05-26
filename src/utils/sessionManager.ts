import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PolkadotHubError, ErrorCodes } from '@/utils/errorHandling';

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
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private sessions = new Map<string, Session>();
  private readonly SESSION_DURATION = 3600000;
  private readonly CLEANUP_INTERVAL = 300000;
  private readonly MAX_SESSIONS_PER_USER = 5;

  private constructor() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('Encryption key not configured');
    }
    this.encryptionKey = Buffer.from(key, 'hex');

    if (typeof window !== 'undefined') {
      setInterval(() => void this.cleanupExpiredSessions(), this.CLEANUP_INTERVAL);
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

  async createEncryptedSession(address: string, ip: string, userAgent: string): Promise<string> {
    try {
      const iv = randomBytes(12);
      const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
      
      const payload = JSON.stringify({
        address,
        timestamp: Date.now(),
        nonce: randomBytes(16).toString('hex'),
        ip,
        userAgent
      });

      const encrypted = Buffer.concat([
        cipher.update(payload, 'utf8'),
        cipher.final()
      ]);

      const authTag = cipher.getAuthTag();

      const sessionToken = Buffer.concat([
        iv,
        authTag,
        encrypted
      ]).toString('base64');

      return sessionToken;
    } catch (error) {
      throw new PolkadotHubError(
        'Failed to create session',
        ErrorCodes.AUTH.INVALID_TOKEN,
        'Could not create secure session.'
      );
    }
  }

  verifyEncryptedSession(sessionToken: string, ip: string): { address: string; timestamp: number } {
    try {
      const sessionData = Buffer.from(sessionToken, 'base64');
      
      const iv = sessionData.subarray(0, 12);
      const authTag = sessionData.subarray(12, 28);
      const encrypted = sessionData.subarray(28);

      const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      const session = JSON.parse(decrypted.toString());

      const age = Date.now() - session.timestamp;
      if (age > 24 * 60 * 60 * 1000) {
        throw new PolkadotHubError(
          'Session expired',
          ErrorCodes.AUTH.EXPIRED_TOKEN,
          'Please sign in again.'
        );
      }

      if (session.ip !== ip) {
        throw new PolkadotHubError(
          'Invalid session',
          ErrorCodes.AUTH.INVALID_TOKEN,
          'Session IP mismatch.'
        );
      }

      return {
        address: session.address,
        timestamp: session.timestamp
      };
    } catch (error) {
      if (error instanceof PolkadotHubError) {
        throw error;
      }
      throw new PolkadotHubError(
        'Invalid session',
        ErrorCodes.AUTH.INVALID_TOKEN,
        'Session verification failed.'
      );
    }
  }

  async createSession(userId: string, ip: string, userAgent: string): Promise<Session> {
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

    return session;
  }

  async validateSession(sessionId: string, ip: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return false;
    }

    if (session.expiresAt < Date.now()) {
      await this.destroySession(sessionId);
      return false;
    }

    if (session.ip !== ip) {
      await this.destroySession(sessionId);
      return false;
    }

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
    }
  }

  private async cleanupUserSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => b.lastActivity - a.lastActivity);

    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
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