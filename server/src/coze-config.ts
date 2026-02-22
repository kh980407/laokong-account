/**
 * Coze SDK 配置
 * 在 Coze 平台托管时自动注入凭证；自部署（如 Railway）时需通过环境变量传入
 */
import { Config } from 'coze-coding-dev-sdk'

export function createCozeConfig(): Config {
  const apiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY
  const baseUrl = process.env.COZE_INTEGRATION_BASE_URL || 'https://api.coze.com'
  const modelBaseUrl = process.env.COZE_INTEGRATION_MODEL_BASE_URL || 'https://model.coze.com'

  if (!apiKey) {
    console.warn(
      'COZE_WORKLOAD_IDENTITY_API_KEY 未配置，语音识别(ASR)和AI解析将不可用。' +
        '自部署时请在 Railway Variables 中添加该变量，可从 Coze 开发者平台获取。'
    )
  }

  return new Config({
    apiKey: apiKey || '',
    baseUrl,
    modelBaseUrl,
  })
}
