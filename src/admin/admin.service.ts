import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsersByRole(role: Role) {
    const users = await this.prisma.user.findMany({
      where: { role },
      include: { Buyer: true, Developer: true, Owner: true, Broker: true },
    });

    if (!users.length) {
      throw new NotFoundException(`No users found with role: ${role}`);
    }

    return users;
  }
}
