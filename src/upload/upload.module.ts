import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { MulterModule } from '@nestjs/platform-express/multer';

@Module({
  imports: [MulterModule],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
