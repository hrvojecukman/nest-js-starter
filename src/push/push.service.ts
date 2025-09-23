import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;

  constructor(private prisma: PrismaService) {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    try {
      if (!admin.apps.length) {
        // Local dev: prefer explicit path to service account JSON
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        if (serviceAccountPath) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const creds = require(serviceAccountPath);
          admin.initializeApp({ credential: admin.credential.cert(creds as admin.ServiceAccount) });
        } else {
          // Fallback to GOOGLE_APPLICATION_CREDENTIALS / default credentials
          admin.initializeApp({ credential: admin.credential.applicationDefault() });
        }
      }
      this.initialized = true;
    } catch (e) {
      this.logger.error('Failed to initialize Firebase Admin', e as Error);
    }
  }

  async registerDevice(userId: string, token: string, platform: 'ios' | 'android' | 'web' = 'web') {
    await this.prisma.userDevice.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
    return { ok: true };
  }

  async unregisterDevice(token: string) {
    await this.prisma.userDevice.deleteMany({ where: { token } });
    return { ok: true };
  }

  async sendToUsers(userIds: string[], payload: { title: string; body: string; data?: Record<string, string> }) {
    if (!this.initialized) return { ok: false };
    const devices = await this.prisma.userDevice.findMany({
      where: { userId: { in: userIds } },
      select: { token: true },
    });
    const tokens = devices.map((d) => d.token);
    if (!tokens.length) return { ok: true, sent: 0 };

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data as Record<string, string> | undefined,
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' } },
    };

    try {
      const res = await admin.messaging().sendEachForMulticast(message);
      return { ok: true, sent: res.successCount };
    } catch (e) {
      this.logger.error('FCM send failed', e as Error);
      return { ok: false };
    }
  }
}


