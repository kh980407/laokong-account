import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AccountsModule } from './accounts/accounts.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [AccountsModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
