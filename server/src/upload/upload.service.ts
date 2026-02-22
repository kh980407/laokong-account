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

  /** 无对象存储时用内存暂存音频，供 ASR 通过临时 URL 拉取 */
  private tempAudioMap = new Map<string, { buffer: Buffer; timeout: NodeJS.Timeout }>()
  private readonly TEMP_AUDIO_TTL_MS = 5 * 60 * 1000

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

  hasBucketConfig(): boolean {
    return !!(process.env.COZE_BUCKET_ENDPOINT_URL && process.env.COZE_BUCKET_NAME)
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
      const msg = error instanceof Error ? error.message : String(error)
      const stack = error instanceof Error ? error.stack : undefined
      console.error('语音识别失败:', msg, 'stack:', stack)
      throw new BadRequestException(`语音识别失败: ${msg}`)
    }
  }
}
