import { Controller, Get } from '@nestjs/common';
import { AppService } from '@/app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(): { status: string; data: string } {
    return {
      status: 'success',
      data: this.appService.getHello()
    };
  }

  @Get('health')
  getHealth(): { status: string; data: string } {
    return {
      status: 'success',
      data: new Date().toISOString(),
    };
  }

  /** 诊断：检查 Coze 相关配置是否生效（不暴露密钥值） */
  @Get('config-check')
  configCheck(): {
    cozeApiKeyConfigured: boolean
    message: string
  } {
    const key = process.env.COZE_WORKLOAD_IDENTITY_API_KEY
    const configured = !!(key && key.trim().length > 0)
    return {
      cozeApiKeyConfigured: configured,
      message: configured
        ? 'COZE_WORKLOAD_IDENTITY_API_KEY 已配置，语音识别和图片识别可用'
        : 'COZE_WORKLOAD_IDENTITY_API_KEY 未配置，请在 Railway Variables 中添加。变量名必须完全一致，值内勿含空格。',
    }
  }
}
