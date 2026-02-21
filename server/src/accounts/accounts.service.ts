import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '../storage/database/supabase-client'
import * as XLSX from 'xlsx'

@Injectable()
export class AccountsService {
  private supabase = getSupabaseClient()

  // 获取所有账单
  async findAll(searchParams?: { keyword?: string; startDate?: string; endDate?: string }) {
    console.log('搜索参数:', searchParams)

    let query = this.supabase
      .from('accounts')
      .select('*')

    // 关键词搜索（姓名、电话、商品描述）
    if (searchParams?.keyword) {
      const keyword = searchParams.keyword.trim()
      query = query.or(`customer_name.ilike.%${keyword}%,phone.ilike.%${keyword}%,item_description.ilike.%${keyword}%`)
    }

    // 日期范围筛选
    if (searchParams?.startDate) {
      query = query.gte('account_date', searchParams.startDate)
    }
    if (searchParams?.endDate) {
      query = query.lte('account_date', searchParams.endDate)
    }

    // 排序
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('查询账单失败:', error)
      throw new Error(`Failed to fetch accounts: ${error.message}`)
    }

    console.log('查询结果数量:', data?.length)
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

  // 导出 Excel
  async exportExcel(searchParams?: { keyword?: string; startDate?: string; endDate?: string }) {
    console.log('导出 Excel，搜索参数:', searchParams)

    const accounts = await this.findAll(searchParams)

    // 准备 Excel 数据
    const excelData = accounts.map(account => ({
      '日期': account.account_date,
      '客户姓名': account.customer_name,
      '联系电话': account.phone,
      '商品描述': account.item_description,
      '金额': account.amount,
      '付款状态': account.is_paid ? '已付款' : '待付款',
      '创建时间': account.created_at
    }))

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 15 }, // 日期
      { wch: 15 }, // 客户姓名
      { wch: 15 }, // 联系电话
      { wch: 30 }, // 商品描述
      { wch: 10 }, // 金额
      { wch: 10 }, // 付款状态
      { wch: 20 }  // 创建时间
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '账单明细')

    // 生成文件名
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
    const filename = `电子账单_${dateStr}_${timeStr}.xlsx`

    // 生成 Buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    console.log(`导出 Excel 成功，文件名: ${filename}, 数据量: ${accounts.length} 条`)
    return { buffer, filename }
  }
}
