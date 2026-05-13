import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      omit: {
        user: {
          hashedPassword: true,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect(); //모듈이 초기화될 때 데이터베이스와 연결
  }
}
