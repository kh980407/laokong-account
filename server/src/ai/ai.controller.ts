import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { AIService } from './ai.service'

@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  /**
   * 语音转账单信息
   */
  @Post('parse-voice')
  @HttpCode(HttpStatus.OK)
  async parseVoice(@Body() body: { text: string }) {
    console.log('POST /api/ai/parse-voice - 语音解析', body)
    const result = await this.aiService.parseVoiceToAccount(body.text)
    return { code: 200, msg: 'success', data: result }
  }

  /**
   * 图片识别账单信息
   */
  @Post('parse-image')
  @HttpCode(HttpStatus.OK)
  async parseImage(@Body() body: { imageUrl: string }) {
    console.log('POST /api/ai/parse-image - 图片识别', body)
    const result = await this.aiService.parseImageToAccounts(body.imageUrl)
    return { code: 200, msg: 'success', data: result }
  }
}
