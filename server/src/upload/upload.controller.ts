import { Controller, Post, UploadedFile, UseInterceptors, Body, HttpCode, HttpStatus, Headers } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { UploadService } from './upload.service'

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // 上传图片
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage()
  }))
  @HttpCode(HttpStatus.OK)
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    console.log('POST /api/upload/image - 上传图片')
    console.log('文件名:', file?.originalname)
    console.log('文件大小:', file?.size)
    console.log('文件类型:', file?.mimetype)

    if (!file) {
      return {
        code: 400,
        msg: '文件不存在',
        data: null
      }
    }

    const result = await this.uploadService.uploadImage(file)
    return { code: 200, msg: 'success', data: result }
  }

  // 上传音频
  @Post('audio')
  @UseInterceptors(FileInterceptor('audio', {
    storage: memoryStorage()
  }))
  @HttpCode(HttpStatus.OK)
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    console.log('POST /api/upload/audio - 上传音频')
    console.log('文件名:', file?.originalname)
    console.log('文件大小:', file?.size)
    console.log('文件类型:', file?.mimetype)

    if (!file) {
      return {
        code: 400,
        msg: '文件不存在',
        data: null
      }
    }

    const result = await this.uploadService.uploadAudio(file)
    return { code: 200, msg: 'success', data: result }
  }

  // 接收 base64 音频（用于绕过小程序 uploadFile 合法域名限制，走 request 域名）
  @Post('audio-base64')
  @HttpCode(HttpStatus.OK)
  async uploadAudioBase64(@Body() body: { audioBase64: string }) {
    console.log('POST /api/upload/audio-base64 - 上传音频(base64)')
    if (!body?.audioBase64) {
      return { code: 400, msg: '缺少 audioBase64', data: null }
    }
    let buffer: Buffer
    try {
      buffer = Buffer.from(body.audioBase64, 'base64')
    } catch {
      return { code: 400, msg: 'audioBase64 格式错误', data: null }
    }
    const file = {
      buffer,
      originalname: `record-${Date.now()}.wav`,
      mimetype: 'audio/wav',
      fieldname: 'audio',
      encoding: '7bit' as const,
      size: buffer.length,
      stream: null,
      destination: '',
      filename: '',
      path: ''
    } as Express.Multer.File
    const result = await this.uploadService.uploadAudio(file)
    return { code: 200, msg: 'success', data: result }
  }
}

@Controller('asr')
export class ASRController {
  constructor(private readonly uploadService: UploadService) {}

  // 语音识别
  @Post('recognize')
  @HttpCode(HttpStatus.OK)
  async recognize(@Body() body: { audioUrl: string }, @Headers() headers: Record<string, string>) {
    console.log('POST /api/asr/recognize - 语音识别')
    console.log('音频 URL:', body.audioUrl)

    const result = await this.uploadService.recognizeSpeech(body.audioUrl, headers)
    return { code: 200, msg: 'success', data: result }
  }
}
