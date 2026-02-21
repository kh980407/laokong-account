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
