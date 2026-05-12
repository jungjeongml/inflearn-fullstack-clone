import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        // ~300mb 영상 사진 모두 가능.
        fileSize: 300 * 1024 * 1024,
      },
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService],
})
export class MediaModule {}
