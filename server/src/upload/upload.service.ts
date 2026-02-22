import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { S3Storage } from 'coze-coding-dev-sdk'
import { ASRClient } from 'coze-coding-dev-sdk'
import { HeaderUtils } from 'coze-coding-dev-sdk'
import { createCozeConfig } from '@/coze-config'
import * as fs from 'fs'

@Injectable()
export class UploadService {
  private s3Storage: S3Storage

  constructor() {
    const endpoint = process.env.COZE_BUCKET_ENDPOINT_URL
    const bucket = process.env.COZE_BUCKET_NAME
    if (!endpoint || !bucket) {
      console.warn('COZE_BUCKET_* 未配置：图片上传不可用；语音经 base64 接口仍可用（内存暂存）')
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

  /** 无对象存储时用内存暂存音频/图片，供临时 URL 拉取 */
  private tempAudioMap = new Map<string, { buffer: Buffer; timeout: NodeJS.Timeout }>()
  private tempImageMap = new Map<string, { buffer: Buffer; mime: string; timeout: NodeJS.Timeout }>()
  private readonly TEMP_AUDIO_TTL_MS = 5 * 60 * 1000
  private readonly TEMP_IMAGE_TTL_MS = 30 * 60 * 1000

  storeTempAudio(buffer: Buffer): string {
    const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const timeout = setTimeout(() => {
      this.tempAudioMap.delete(id)
    }, this.TEMP_AUDIO_TTL_MS)
    this.tempAudioMap.set(id, { buffer, timeout })
    return id
  }

  getTempAudioAndRemove(id: string): Buffer | null {
    const entry = this.tempAudioMap.get(id)
    if (!entry) return null
    clearTimeout(entry.timeout)
    this.tempAudioMap.delete(id)
    return entry.buffer
  }

  storeTempImage(buffer: Buffer, mime: string): string {
    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const timeout = setTimeout(() => this.tempImageMap.delete(id), this.TEMP_IMAGE_TTL_MS)
    this.tempImageMap.set(id, { buffer, mime, timeout })
    return id
  }

  getTempImage(id: string): { buffer: Buffer; mime: string } | null {
    const entry = this.tempImageMap.get(id)
    return entry ? { buffer: entry.buffer, mime: entry.mime } : null
  }

  hasBucketConfig(): boolean {
    return !!(process.env.COZE_BUCKET_ENDPOINT_URL && process.env.COZE_BUCKET_NAME)
  }

  // 上传图片。有对象存储用 S3；无则内存暂存返回临时 URL
  async uploadImage(file: Express.Multer.File, baseUrl?: string): Promise<{ key: string; url: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('文件不存在')
    }
    return this.uploadImageFromBuffer(file.buffer, baseUrl, file.originalname, file.mimetype)
  }

  async uploadImageFromBuffer(
    buffer: Buffer,
    baseUrl?: string,
    fileName = `image-${Date.now()}.jpg`,
    mimeType = 'image/jpeg',
  ): Promise<{ key: string; url: string }> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('文件不存在')
    }
    if (this.hasBucketConfig()) {
      this.checkBucketConfig()
      const fileKey = await this.s3Storage.uploadFile({
        fileContent: buffer,
        fileName: `account-images/${Date.now()}-${fileName}`,
        contentType: mimeType,
      })
      const imageUrl = await this.s3Storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 86400 * 30,
      })
      return { key: fileKey, url: imageUrl }
    }
    if (!baseUrl) {
      throw new ServiceUnavailableException('对象存储未配置且无法生成临时 URL')
    }
    const id = this.storeTempImage(buffer, mimeType)
    const url = `${baseUrl.replace(/\/$/, '')}/api/upload/image-temp/${id}`
    console.log('图片使用内存暂存, 临时 URL:', url)
    return { key: id, url }
  }

  // 上传音频（从 Buffer）。有对象存储则用 S3；无则用内存暂存并返回临时 URL（需传入 baseUrl）
  async uploadAudioFromBuffer(
    buffer: Buffer,
    baseUrl?: string,
    fileName = `record-${Date.now()}.wav`,
    mimeType = 'audio/wav',
  ): Promise<{ key: string; url: string }> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('文件不存在')
    }
    if (this.hasBucketConfig()) {
      this.checkBucketConfig()
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
      return { key: fileKey, url: audioUrl }
    }
    if (!baseUrl) {
      throw new ServiceUnavailableException('对象存储未配置且无法生成临时 URL')
    }
    const id = this.storeTempAudio(buffer)
    const url = `${baseUrl.replace(/\/$/, '')}/api/upload/audio-temp/${id}`
    console.log('音频使用内存暂存, 临时 URL:', url)
    return { key: id, url }
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

  // 语音识别。优先 base64Data（避免 Invalid URL），否则用 url
  async recognizeSpeech(
    options: { audioUrl?: string; audioBase64?: string },
    headers?: Record<string, string>,
  ) {
    const { audioUrl, audioBase64 } = options
    if (!audioUrl && !audioBase64) {
      throw new BadRequestException('请提供 audioUrl 或 audioBase64')
    }
    const apiKey = (process.env.COZE_WORKLOAD_IDENTITY_API_KEY || '').trim()
    if (!apiKey) {
      throw new ServiceUnavailableException(
        '语音识别需配置 COZE_WORKLOAD_IDENTITY_API_KEY，请在 Railway Variables 中添加。可从 Coze 开发者平台获取。'
      )
    }

    const config = createCozeConfig()
    const customHeaders = headers ? HeaderUtils.extractForwardHeaders(headers) : undefined
    const asrClient = new ASRClient(config, customHeaders)

    try {
      const result = await asrClient.recognize(
        audioBase64 ? { base64Data: audioBase64 } : { url: audioUrl! },
      )

      console.log('语音识别结果:', result.text)

      return {
        text: result.text,
        duration: result.duration
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      console.error('语音识别失败:', msg, 'stack:', stack)
      throw new BadRequestException(`语音识别失败: ${msg}`)
    }
  }
}
