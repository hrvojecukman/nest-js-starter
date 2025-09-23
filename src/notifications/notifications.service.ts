import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

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
      const notif = await tx.notification.create({
        data: {
          title: dto.title,
          body: dto.body,
          category: dto.category,
          data: dto.data,
        },
      });

      if (dto.userIds?.length) {
        await tx.notificationRecipient.createMany({
          data: dto.userIds.map((uid: string) => ({
            notificationId: notif.id,
            userId: uid,
          })),
          skipDuplicates: true,
        });
      }

      return notif;
    });
  }
}


