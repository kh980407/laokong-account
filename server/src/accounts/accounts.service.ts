import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../storage/database/supabase-client'

@Injectable()
export class AccountsService {
  private supabase = getSupabaseClient()

  // 获取所有账单
  async findAll() {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`)
    }

    return data || []
  }

  // 获取单个账单
  async findOne(id: number) {
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch account: ${error.message}`)
    }

    return data
  }

  // 创建账单
  async create(accountData: any) {
    console.log('创建账单数据:', accountData)

    const { data, error } = await this.supabase
      .from('accounts')
      .insert({
        customer_name: accountData.customer_name,
        phone: accountData.phone,
        amount: accountData.amount,
        is_paid: accountData.is_paid || false,
        item_description: accountData.item_description,
        account_date: accountData.account_date,
        image_url: accountData.image_url
      })
      .select()
      .single()

    if (error) {
      console.error('创建账单失败:', error)
      throw new Error(`Failed to create account: ${error.message}`)
    }

    console.log('创建账单成功:', data)
    return data
  }

  // 更新账单
  async update(id: number, updateData: any) {
    console.log(`更新账单 ${id} 数据:`, updateData)

    const { data, error } = await this.supabase
      .from('accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新账单失败:', error)
      throw new Error(`Failed to update account: ${error.message}`)
    }

    console.log('更新账单成功:', data)
    return data
  }

  // 删除账单
  async remove(id: number) {
    console.log(`删除账单 ${id}`)

    const { error } = await this.supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('删除账单失败:', error)
      throw new Error(`Failed to delete account: ${error.message}`)
    }

    return { message: 'Account deleted successfully' }
  }
}
