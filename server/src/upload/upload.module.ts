import { Module } from '@nestjs/common'
import { UploadController, ASRController } from './upload.controller'
import { UploadService } from './upload.service'

@Module({
  controllers: [UploadController, ASRController],
  providers: [UploadService],
  exports: [UploadService]
})
export class UploadModule {}
