import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService, private push: PushService) {}

  async list(userId: string, dto: any) {
    const page = Number(dto.page ?? 1);
    const limit = Math.min(100, Number(dto.limit ?? 20));

    const where: Prisma.NotificationRecipientWhereInput = {
      userId,
      isArchived: false,
      ...(dto.read === '1'
        ? { readAt: { not: null } }
        : dto.read === '0'
        ? { readAt: null }
        : {}),
      notification: {
        ...(dto.category ? { category: dto.category } : {}),
        ...(dto.before ? { createdAt: { lt: new Date(dto.before) } } : {}),
      },
    };

    const [rows, total] = await Promise.all([
      this.prisma.notificationRecipient.findMany({
        where,
        orderBy: { notification: { createdAt: 'desc' } },
        include: { notification: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notificationRecipient.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMorePages: page < totalPages,
      },
    };
  }

  unreadCount(userId: string) {
    return this.prisma.notificationRecipient.count({
      where: { userId, isArchived: false, readAt: null },
    });
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notificationRecipient.update({
      where: { notificationId_userId: { notificationId, userId } },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string, category?: string) {
    await this.prisma.notificationRecipient.updateMany({
      where: {
        userId,
        isArchived: false,
        readAt: null,
        ...(category ? { notification: { category } } : {}),
      },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async createDirect(dto: any) {
    return this.prisma.$transaction(async (tx) => {
      const requestedUserIds: string[] = Array.isArray(dto.userIds) ? dto.userIds : [];
      let validUserIds: string[] = [];
      if (requestedUserIds.length) {
        const existing = await tx.user.findMany({
          where: { id: { in: requestedUserIds } },
          select: { id: true },
        });
        validUserIds = existing.map((u) => u.id);
        if (!validUserIds.length) {
          throw new BadRequestException('No valid userIds provided');
        }
      }
      const notif = await tx.notification.create({
        data: {
          title: dto.title,
          body: dto.body,
          category: dto.category,
          data: dto.data,
        },
      });

      if (validUserIds.length) {
        await tx.notificationRecipient.createMany({
          data: validUserIds.map((uid: string) => ({
            notificationId: notif.id,
            userId: uid,
          })),
          skipDuplicates: true,
        });
        // Fire-and-forget push send
        void this.push.sendToUsers(validUserIds, {
          title: dto.title,
          body: dto.body,
          data: dto.data,
        });
      }

      return notif;
    });
  }
}


