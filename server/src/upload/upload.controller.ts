import { Controller, Post, Get, UploadedFile, UseInterceptors, Body, HttpCode, HttpStatus, Headers, Req, Param, Res } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Request, Response } from 'express'
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

  // 接收 base64 音频（用于绕过小程序 uploadFile 合法域名限制）。无对象存储时用内存暂存并返回临时 URL
  @Post('audio-base64')
  @HttpCode(HttpStatus.OK)
  async uploadAudioBase64(@Body() body: { audioBase64: string }, @Req() req: Request) {
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
    const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`
    const result = await this.uploadService.uploadAudioFromBuffer(buffer, baseUrl)
    return { code: 200, msg: 'success', data: result }
  }

  // 临时音频 URL：供 ASR 拉取，取完后即删（无对象存储时的 fallback）
  @Get('audio-temp/:id')
  getTempAudio(@Param('id') id: string, @Res() res: Response) {
    const buffer = this.uploadService.getTempAudioAndRemove(id)
    if (!buffer) {
      res.status(404).json({ code: 404, msg: 'not found', data: null })
      return
    }
    res.setHeader('Content-Type', 'audio/wav')
    res.send(buffer)
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
