import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AccountsModule } from './accounts/accounts.module';
import { UploadModule } from './upload/upload.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [AccountsModule, UploadModule, AIModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
