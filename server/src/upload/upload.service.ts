import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { S3Storage } from 'coze-coding-dev-sdk'
import { ASRClient, Config } from 'coze-coding-dev-sdk'
import { HeaderUtils } from 'coze-coding-dev-sdk'
import * as fs from 'fs'

@Injectable()
export class UploadService {
  private s3Storage: S3Storage

  constructor() {
    const endpoint = process.env.COZE_BUCKET_ENDPOINT_URL
    const bucket = process.env.COZE_BUCKET_NAME
    if (!endpoint || !bucket) {
      console.warn('COZE_BUCKET_ENDPOINT_URL 或 COZE_BUCKET_NAME 未配置，图片/音频上传将不可用')
    }
    this.s3Storage = new S3Storage({
      endpointUrl: endpoint || '',
      accessKey: '',
      secretKey: '',
      bucketName: bucket || '',
      region: 'cn-beijing',
    })
  }

  private checkBucketConfig(): void {
    if (!process.env.COZE_BUCKET_ENDPOINT_URL || !process.env.COZE_BUCKET_NAME) {
      throw new ServiceUnavailableException('对象存储未配置，请在服务端设置 COZE_BUCKET_* 环境变量')
    }
  }

  // 上传图片
  async uploadImage(file: Express.Multer.File) {
    this.checkBucketConfig()
    console.log('上传图片:', file.originalname, '大小:', file.size)

    if (!file || !file.buffer) {
      throw new BadRequestException('文件不存在')
    }

    // 上传到对象存储
    const fileKey = await this.s3Storage.uploadFile({
      fileContent: file.buffer,
      fileName: `account-images/${Date.now()}-${file.originalname}`,
      contentType: file.mimetype
    })

    console.log('图片上传成功, key:', fileKey)

    // 生成签名 URL
    const imageUrl = await this.s3Storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400 * 30 // 30 天有效期
    })

    console.log('生成图片 URL:', imageUrl)

    return { key: fileKey, url: imageUrl }
  }

  // 上传音频（从 Buffer，用于 base64 上传，避免伪造 Multer.File 类型）
  async uploadAudioFromBuffer(
    buffer: Buffer,
    fileName = `record-${Date.now()}.wav`,
    mimeType = 'audio/wav',
  ) {
    this.checkBucketConfig()
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('文件不存在')
    }
    const fileKey = await this.s3Storage.uploadFile({
      fileContent: buffer,
      fileName: `account-audio/${Date.now()}-${fileName}`,
      contentType: mimeType,
    })
    console.log('音频上传成功, key:', fileKey)
    const audioUrl = await this.s3Storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600,
    })
    console.log('生成音频 URL:', audioUrl)
    return { key: fileKey, url: audioUrl }
  }

  // 上传音频（从 Multer 文件）
  async uploadAudio(file: Express.Multer.File) {
    this.checkBucketConfig()
    console.log('上传音频:', file.originalname, '大小:', file.size)

    if (!file || !file.buffer) {
      throw new BadRequestException('文件不存在')
    }

    // 上传到对象存储
    const fileKey = await this.s3Storage.uploadFile({
      fileContent: file.buffer,
      fileName: `account-audio/${Date.now()}-${file.originalname}`,
      contentType: file.mimetype
    })

    console.log('音频上传成功, key:', fileKey)

    // 生成签名 URL
    const audioUrl = await this.s3Storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600 // 1 小时有效期
    })

    console.log('生成音频 URL:', audioUrl)

    return { key: fileKey, url: audioUrl }
  }

  // 语音识别
  async recognizeSpeech(audioUrl: string, headers?: Record<string, string>) {
    console.log('语音识别, audioUrl:', audioUrl)

    if (!audioUrl) {
      throw new BadRequestException('音频 URL 不能为空')
    }

    const config = new Config()
    const customHeaders = headers ? HeaderUtils.extractForwardHeaders(headers) : undefined
    const asrClient = new ASRClient(config, customHeaders)

    try {
      const result = await asrClient.recognize({
        url: audioUrl
      })

      console.log('语音识别结果:', result.text)

      return {
        text: result.text,
        duration: result.duration
      }
    } catch (error) {
      console.error('语音识别失败:', error)
      throw new BadRequestException(`语音识别失败: ${error.message}`)
    }
  }
}
