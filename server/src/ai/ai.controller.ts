import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common'
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
   * 图片识别账单信息。支持 imageBase64（优先，避免临时 URL 404）或 imageUrl
   */
  @Post('parse-image')
  @HttpCode(HttpStatus.OK)
  async parseImage(@Body() body: { imageUrl?: string; imageBase64?: string }) {
    console.log('POST /api/ai/parse-image - 图片识别', body.imageBase64 ? '(base64)' : '(url)')
    const imageInput = body.imageBase64
      ? `data:image/jpeg;base64,${body.imageBase64}`
      : body.imageUrl
    if (!imageInput) {
      throw new BadRequestException('请提供 imageUrl 或 imageBase64')
    }
    const result = await this.aiService.parseImageToAccounts(imageInput)
    return { code: 200, msg: 'success', data: result }
  }
}
