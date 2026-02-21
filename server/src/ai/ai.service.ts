import { Injectable } from '@nestjs/common'
import { LLMClient, Config } from 'coze-coding-dev-sdk'

@Injectable()
export class AIService {
  private client: LLMClient

  constructor() {
    const config = new Config()
    this.client = new LLMClient(config)
  }

  /**
   * 从语音文本中提取结构化账单信息
   */
  async parseVoiceToAccount(text: string): Promise<{
    customer_name?: string
    phone?: string
    amount?: number
    item_description?: string
    is_paid?: boolean
    account_date?: string
  }> {
    const systemPrompt = `你是一个专业的账单信息提取助手。请从用户的语音描述中提取账单信息，返回JSON格式数据。

提取规则：
1. 客户姓名：识别"客户"、"姓名"、"买了"、"购买了"等关键词后的名字
2. 联系电话：识别11位手机号，格式如 13812345678
3. 金额：识别"元"、"块钱"前的数字
4. 商品描述：提取购买的物品和数量
5. 付款状态：识别"已付"、"未付"、"欠"等关键词
6. 日期：识别交易日期，格式 YYYY-MM-DD

返回JSON格式，如果某个字段无法识别，不要包含该字段。
示例输入："老刘今天买了20包饲料，客户姓名是老刘，联系电话是13986707070，金额是1200元，未付款"
示例输出：
{
  "customer_name": "老刘",
  "phone": "13986707070",
  "amount": 1200,
  "item_description": "买了20包饲料",
  "is_paid": false
}`

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: text }
    ]

    try {
      const response = await this.client.invoke(messages, {
        model: 'doubao-seed-2-0-lite-260215',
        temperature: 0.2
      })

      // 解析JSON响应
      const jsonMatch = response.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])

        // 处理付款状态
        if (parsed.is_paid !== undefined) {
          // 如果返回的是布尔值，直接使用
          if (typeof parsed.is_paid === 'boolean') {
            // 已经是布尔值，无需处理
          } else {
            // 如果是字符串，转换为布尔值
            parsed.is_paid = parsed.is_paid === true || parsed.is_paid === 'true' || parsed.is_paid === '已付款'
          }
        }

        console.log('AI 提取结果:', parsed)
        return parsed
      }

      console.error('无法解析 AI 响应:', response.content)
      return {}
    } catch (error) {
      console.error('语音解析失败:', error)
      throw new Error('语音解析失败，请重试')
    }
  }

  /**
   * 从图片中识别账单信息
   */
  async parseImageToAccounts(imageUrl: string): Promise<Array<{
    customer_name?: string
    phone?: string
    amount?: number
    item_description?: string
    is_paid?: boolean
    account_date?: string
  }>> {
    const systemPrompt = `你是一个专业的账单图片识别助手。请从图片中识别所有账单信息，返回JSON数组格式。

识别规则：
1. 识别图片中的每一行账单记录
2. 提取：客户姓名、联系电话、金额、商品描述、付款状态、日期
3. 如果图片中有多条账单记录，返回数组
4. 如果某个字段无法识别，不要包含该字段
5. 金额：提取数字，不要包含货币符号
6. 付款状态：识别是否已付款
7. 日期：识别交易日期，格式 YYYY-MM-DD

返回JSON数组格式，如果图片中有多条记录，返回多条记录。
示例输出：
[
  {
    "customer_name": "老刘",
    "phone": "13986707070",
    "amount": 1200,
    "item_description": "20包饲料",
    "is_paid": false,
    "account_date": "2025-10-15"
  },
  {
    "customer_name": "老孔",
    "phone": "13986202020",
    "amount": 1500,
    "item_description": "20包饲料",
    "is_paid": true,
    "account_date": "2025-10-15"
  }
]`

    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: '请识别这张图片中的所有账单信息。'
          },
          {
            type: 'image_url' as const,
            image_url: {
              url: imageUrl,
              detail: 'high' as const
            }
          }
        ]
      }
    ]

    try {
      const response = await this.client.invoke(messages, {
        model: 'doubao-seed-1-6-vision-250815',
        temperature: 0.2
      })

      // 解析JSON数组响应
      const jsonMatch = response.content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])

        // 处理每条记录的付款状态
        parsed.forEach((record: any) => {
          if (record.is_paid !== undefined) {
            if (typeof record.is_paid === 'boolean') {
              // 已经是布尔值，无需处理
            } else {
              record.is_paid = record.is_paid === true || record.is_paid === 'true' || record.is_paid === '已付款'
            }
          }
        })

        console.log('AI 图片识别结果:', parsed)
        return parsed
      }

      console.error('无法解析 AI 响应:', response.content)
      return []
    } catch (error) {
      console.error('图片识别失败:', error)
      throw new Error('图片识别失败，请重试')
    }
  }
}
