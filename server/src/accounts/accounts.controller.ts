import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { AccountsService } from './accounts.service'

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // 获取所有账单
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: any) {
    console.log('GET /api/accounts - 获取所有账单', query)
    const searchParams = {
      keyword: query.keyword,
      startDate: query.startDate,
      endDate: query.endDate
    }
    const data = await this.accountsService.findAll(searchParams)
    console.log('返回账单列表:', data.length, '条记录')
    return { code: 200, msg: 'success', data }
  }

  // 获取单个账单
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    console.log(`GET /api/accounts/${id} - 获取账单详情`)
    const data = await this.accountsService.findOne(Number(id))
    return { code: 200, msg: 'success', data }
  }

  // 创建账单
  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() accountData: any) {
    console.log('POST /api/accounts - 创建账单')
    console.log('请求体:', accountData)
    const data = await this.accountsService.create(accountData)
    return { code: 200, msg: 'success', data }
  }

  // 更新账单
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateData: any) {
    console.log(`PUT /api/accounts/${id} - 更新账单`)
    console.log('请求体:', updateData)
    const data = await this.accountsService.update(Number(id), updateData)
    return { code: 200, msg: 'success', data }
  }

  // 删除账单
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    console.log(`DELETE /api/accounts/${id} - 删除账单`)
    await this.accountsService.remove(Number(id))
    return { code: 200, msg: 'success', data: null }
  }
}
