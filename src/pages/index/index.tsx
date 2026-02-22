import { View, Text, Input, Picker, ScrollView } from '@tarojs/components'
import Taro, { usePullDownRefresh, useDidShow } from '@tarojs/taro'
import { useState, useEffect, useMemo } from 'react'
import { Network } from '@/network'
import './index.css'

interface Account {
  id: number
  customer_name: string
  phone: string
  amount: number
  is_paid: boolean
  item_description: string
  account_date: string
  has_image: boolean
}

const IndexPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'paid'>('date') // 排序类型

  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 折叠状态管理（按日期）
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({})

  // 折叠状态管理（按年-月）
  const toggleCollapse = (year: string, month?: string) => {
    if (month) {
      setCollapsedDates(prev => ({
        ...prev,
        [`${year}-${month}`]: !prev[`${year}-${month}`]
      }))
    } else {
      setCollapsedDates(prev => ({
        ...prev,
        [year]: !prev[year]
      }))
    }
  }

  // 执行搜索
  const loadAccounts = async (searchParams?: { keyword?: string; startDate?: string; endDate?: string }) => {
    setLoading(true)
    try {
      // 构建查询参数
      const params: any = {}
      if (searchParams?.keyword) {
        params.keyword = searchParams.keyword
      }
      if (searchParams?.startDate) {
        params.startDate = searchParams.startDate
      }
      if (searchParams?.endDate) {
        params.endDate = searchParams.endDate
      }

      const res = await Network.request({
        url: '/api/accounts',
        method: 'GET',
        data: params
      })
      console.log('账单列表响应:', res.data)

      // 解析数据结构：res.data.data 是业务数据
      const accountList = res.data?.data || res.data || []
      setAccounts(accountList)
    } catch (error) {
      console.error('加载账单失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 执行搜索
  const handleSearch = () => {
    loadAccounts({
      keyword: searchKeyword.trim(),
      startDate,
      endDate
    })
  }

  // 清空搜索
  const handleClearSearch = () => {
    setSearchKeyword('')
    setStartDate('')
    setEndDate('')
    loadAccounts()
  }

  // 导出 Excel
  const handleExport = async () => {
    try {
      Taro.showLoading({ title: '导出中...' })

      // 构建导出参数（包含当前搜索条件）
      const params: any = {}
      if (searchKeyword.trim()) {
        params.keyword = searchKeyword.trim()
      }
      if (startDate) {
        params.startDate = startDate
      }
      if (endDate) {
        params.endDate = endDate
      }

      const res = await Network.request({
        url: '/api/accounts/export',
        method: 'GET',
        data: params,
        responseType: 'arraybuffer'
      })
      Taro.hideLoading()

      // 生成文件名
      const timestamp = new Date().getTime()
      const fileName = `老孔记账本_${timestamp}.xlsx`
      const filePath = `${Taro.env.USER_DATA_PATH}/${fileName}`

      // 保存文件
      const fs = Taro.getFileSystemManager()
      fs.writeFile({
        filePath,
        data: res.data,
        encoding: 'binary'
      })

      // 打开文件并显示分享菜单
      try {
        await Taro.openDocument({
          filePath,
          fileType: 'xlsx',
          showMenu: true
        })

        // 显示成功提示
        setTimeout(() => {
          Taro.showModal({
            title: '📄 导出成功',
            content: `已成功导出 ${accounts.length} 条账单记录！\n\n📁 文件已自动打开\n💾 您可以：\n  • 点击右上角"..."菜单分享\n  • 保存到本地\n  • 打开查看详情`,
            confirmText: '知道了',
            showCancel: false
          })
        }, 1000)
      } catch (openError) {
        console.error('打开文件失败:', openError)

        // 如果打开失败，提供重新导出选项
        Taro.showModal({
          title: '📄 导出成功',
          content: `已成功导出 ${accounts.length} 条账单记录！\n\n📁 文件名：${fileName}\n💾 文件已保存\n\n打开失败？您可以：\n  • 点击"重新打开"查看文件\n  • 或在文件管理器中搜索文件名`,
          confirmText: '重新打开',
          cancelText: '知道了',
          success: (modalRes) => {
            if (modalRes.confirm) {
              Taro.openDocument({
                filePath,
                fileType: 'xlsx',
                showMenu: true
              })
            }
          }
        })
      }
    } catch (error) {
      console.error('导出失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '导出失败，请重试',
        icon: 'none'
      })
    }
  }

  // 跳转到新增账单页面
  const goToAddPage = () => {
    Taro.navigateTo({
      url: '/pages/add/index'
    })
  }

  // 跳转到账单详情页面
  const goToDetailPage = (id: number) => {
    Taro.navigateTo({
      url: `/pages/detail/index?id=${id}`
    })
  }

  // 页面加载时获取数据
  useEffect(() => {
    loadAccounts()
  }, [])

  // 页面显示时自动刷新（从详情页、编辑页返回时）
  useDidShow(() => {
    loadAccounts()
  })

  // 下拉刷新
  usePullDownRefresh(async () => {
    await loadAccounts()
    Taro.stopPullDownRefresh()
  })

  // 计算统计信息
  const totalAmount = accounts.reduce((sum, acc) => sum + acc.amount, 0)
  const unpaidCount = accounts.filter(acc => !acc.is_paid).length
  const unpaidAmount = accounts.filter(acc => !acc.is_paid).reduce((sum, acc) => sum + acc.amount, 0)

  // 按年-月-日三级分组（支持多种排序方式）
  const groupedAccounts = useMemo(() => {
    if (sortBy === 'amount') {
      // 按金额排序（不分组，直接按金额降序）
      return [{
        year: '按金额排序',
        months: [{
          month: '',
          days: [{
            day: '金额从高到低',
            items: [...accounts].sort((a, b) => b.amount - a.amount)
          }]
        }]
      }]
    } else if (sortBy === 'paid') {
      // 按付款状态分组
      const paid = accounts.filter(acc => acc.is_paid)
      const unpaid = accounts.filter(acc => !acc.is_paid)
      return [{
        year: '按付款状态',
        months: [
          {
            month: '待付款',
            days: [{
              day: '未付款账单',
              items: unpaid.sort((a, b) => new Date(b.account_date).getTime() - new Date(a.account_date).getTime())
            }]
          },
          {
            month: '已付款',
            days: [{
              day: '已付款账单',
              items: paid.sort((a, b) => new Date(b.account_date).getTime() - new Date(a.account_date).getTime())
            }]
          }
        ]
      }]
    } else {
      // 按日期分组（默认）
      const yearGroups: Record<string, Record<string, Record<string, Account[]>>> = {}

      accounts.forEach(account => {
        const date = account.account_date
        if (!date) return

        const [year, month, day] = date.split('-')

        if (!yearGroups[year]) {
          yearGroups[year] = {}
        }
        if (!yearGroups[year][month]) {
          yearGroups[year][month] = {}
        }
        if (!yearGroups[year][month][day]) {
          yearGroups[year][month][day] = []
        }
        yearGroups[year][month][day].push(account)
      })

      // 按年、月、日降序排序
      const sortedYears = Object.keys(yearGroups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

      return sortedYears.map(year => {
        const months = Object.keys(yearGroups[year])
          .sort((a, b) => new Date(`${year}-${b}`).getTime() - new Date(`${year}-${a}`).getTime())

        return {
          year,
          months: months.map(month => {
            const days = Object.keys(yearGroups[year][month])
              .sort((a, b) => new Date(`${year}-${month}-${b}`).getTime() - new Date(`${year}-${month}-${a}`).getTime())

            return {
              month,
              days: days.map(day => ({
                day,
                items: yearGroups[year][month][day]
              }))
            }
          })
        }
      })
    }
  }, [accounts, sortBy])

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 统计信息卡片 */}
      <View className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-5 pb-6 shadow-xl border-b-4 border-teal-600">
        {/* 标题区域 */}
        <View className="flex items-center gap-4 mb-6">
          <View className="w-14 h-14 bg-white bg-opacity-30 rounded-2xl flex items-center justify-center shadow-md backdrop-blur-sm">
            <Text className="text-5xl">📔</Text>
          </View>
          <View>
            <Text className="block text-3xl font-bold text-white">老孔记账本</Text>
            <Text className="block text-lg text-emerald-50 mt-1">记录美好生活，算好每笔账</Text>
          </View>
        </View>

        {/* 数据统计区域 - 简洁文字显示 */}
        <View className="space-y-3">
          <View className="flex items-center justify-between">
            <Text className="block text-xl text-white font-semibold">💰 总金额</Text>
            <Text className="block text-3xl font-bold text-white">
              ¥{totalAmount.toFixed(2)}
            </Text>
          </View>
          <View className="flex items-center justify-between">
            <Text className="block text-xl text-white font-semibold">📋 待收款</Text>
            <Text className="block text-2xl font-bold text-white">
              {unpaidCount} 笔
            </Text>
          </View>
          <View className="flex items-center justify-between bg-white bg-opacity-20 rounded-xl px-4 py-3">
            <Text className="block text-xl text-white font-semibold">⏳ 未付款总额</Text>
            <Text className="block text-3xl font-bold text-yellow-200">
              ¥{unpaidAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* 居中的新增按钮 */}
        <View className="flex justify-center mt-6">
          <View
            onClick={goToAddPage}
            className="bg-white bg-opacity-30 rounded-full w-20 h-20 flex items-center justify-center shadow-lg backdrop-blur-sm active:bg-white active:bg-opacity-50 transition-colors"
          >
            <Text className="block text-white text-5xl font-bold">+</Text>
          </View>
        </View>
      </View>

      {/* 导出 Excel 卡片 */}
      <View className="px-4 pt-4 pb-2">
        <View
          onClick={handleExport}
          className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl p-5 shadow-md border border-green-300"
        >
          <View className="flex items-center gap-4">
            <View className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Text className="block text-2xl">📊</Text>
            </View>
            <View className="flex-1">
              <Text className="block text-lg font-bold text-white mb-1">
                导出 Excel 表格
              </Text>
              <Text className="block text-base text-white text-opacity-90">
                将账单记录导出为 Excel 文件，方便存档和备份
              </Text>
            </View>
            <Text className="block text-2xl text-white">→</Text>
          </View>
          {searchKeyword || startDate || endDate ? (
            <View className="mt-3 bg-white bg-opacity-20 rounded-lg px-3 py-2">
              <Text className="block text-base text-white">
                💡 当前搜索条件也将被导出
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 排序选择器 */}
      <View className="px-4 pt-3 pb-2">
        <View className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <Text className="block text-lg text-gray-600 mb-3 font-semibold">
            📊 选择排序方式
          </Text>
          <View className="flex flex-wrap gap-3">
            <View
              onClick={() => setSortBy('date')}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl border-2 transition-colors ${sortBy === 'date' ? 'bg-teal-500 border-teal-600' : 'bg-gray-50 border-gray-200'}`}
            >
              <Text className={`block text-lg font-semibold text-center ${sortBy === 'date' ? 'text-white' : 'text-gray-700'}`}>
                📅 按时间
              </Text>
            </View>
            <View
              onClick={() => setSortBy('amount')}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl border-2 transition-colors ${sortBy === 'amount' ? 'bg-teal-500 border-teal-600' : 'bg-gray-50 border-gray-200'}`}
            >
              <Text className={`block text-lg font-semibold text-center ${sortBy === 'amount' ? 'text-white' : 'text-gray-700'}`}>
                💰 按金额
              </Text>
            </View>
            <View
              onClick={() => setSortBy('paid')}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl border-2 transition-colors ${sortBy === 'paid' ? 'bg-teal-500 border-teal-600' : 'bg-gray-50 border-gray-200'}`}
            >
              <Text className={`block text-lg font-semibold text-center ${sortBy === 'paid' ? 'text-white' : 'text-gray-700'}`}>
                ✓ 按付款
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 搜索栏 */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          {/* 搜索关键词 */}
          <View className="mb-4">
            <Text className="block text-lg text-gray-600 mb-2 font-semibold">
              🔍 搜索姓名、电话、商品
            </Text>
            <View className="bg-gray-50 rounded-xl p-4 border-2 border-orange-200 focus-within:border-orange-400 transition-colors">
              <Input
                className="w-full bg-transparent text-lg text-gray-900"
                placeholder="请输入搜索关键词"
                placeholderClass="text-lg text-gray-400"
                value={searchKeyword}
                onInput={(e) => setSearchKeyword(e.detail.value)}
              />
            </View>
          </View>

          {/* 日期范围 */}
          <View className="mb-4">
            <Text className="block text-lg text-gray-600 mb-2 font-semibold">
              📅 选择时间范围（可选）
            </Text>
            <View className="flex gap-3">
              <Picker
                mode="date"
                value={startDate}
                onChange={(e) => setStartDate(e.detail.value)}
              >
                <View className="flex-1 bg-gray-50 rounded-xl p-4 border-2 border-orange-200 focus-within:border-orange-400 transition-colors flex items-center">
                  <Text className={`block text-lg ${startDate ? 'text-gray-900' : 'text-gray-400'}`}>
                    {startDate || '开始日期'}
                  </Text>
                </View>
              </Picker>

              <Text className="block text-2xl text-gray-400 self-center">-</Text>

              <Picker
                mode="date"
                value={endDate}
                onChange={(e) => setEndDate(e.detail.value)}
              >
                <View className="flex-1 bg-gray-50 rounded-xl p-4 border-2 border-orange-200 focus-within:border-orange-400 transition-colors flex items-center">
                  <Text className={`block text-lg ${endDate ? 'text-gray-900' : 'text-gray-400'}`}>
                    {endDate || '结束日期'}
                  </Text>
                </View>
              </Picker>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="flex gap-3">
            <View
              onClick={handleClearSearch}
              className="flex-1 bg-gray-100 rounded-xl py-4 border-2 border-gray-200 active:bg-gray-200 transition-colors"
            >
              <Text className="block text-center text-lg font-semibold text-gray-700">
                清空
              </Text>
            </View>
            <View
              onClick={handleSearch}
              className="flex-1 bg-orange-500 rounded-xl py-4 shadow-md active:bg-orange-600 transition-colors"
            >
              <Text className="block text-center text-lg font-semibold text-white">
                搜索
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 账单列表 */}
      <ScrollView scrollY className="h-screen pb-24">
        <View className="px-4 py-4">
          {loading ? (
            <View className="flex items-center justify-center py-12">
              <Text className="block text-lg text-gray-700">加载中...</Text>
            </View>
          ) : accounts.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <Text className="text-6xl mb-4">{searchKeyword || startDate || endDate ? '🔍' : '📋'}</Text>
              <Text className="block text-2xl text-gray-700 font-semibold mb-2">
                {searchKeyword || startDate || endDate ? '未找到匹配的账单' : '暂无账单记录'}
              </Text>
              <Text className="block text-lg text-gray-600 text-center mb-6">
                {searchKeyword || startDate || endDate
                  ? '请尝试调整搜索条件'
                  : '点击右上角 + 开始记录'}
              </Text>
              {(searchKeyword || startDate || endDate) ? (
                <View
                  onClick={handleClearSearch}
                  className="bg-gray-200 rounded-xl px-8 py-4"
                >
                  <Text className="block text-gray-700 text-2xl font-semibold">
                    清空搜索
                  </Text>
                </View>
              ) : (
                <View
                  onClick={goToAddPage}
                  className="bg-orange-500 rounded-xl px-8 py-4"
                >
                  <Text className="block text-white text-2xl font-semibold">
                    新增账单
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="flex flex-col gap-4">
              {groupedAccounts.map((yearGroup) => {
                const yearCollapsed = collapsedDates[yearGroup.year]
                return (
                  <View key={yearGroup.year} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    {/* 年份分组标题 */}
                    <View
                      onClick={() => toggleCollapse(yearGroup.year)}
                      className="bg-gradient-to-r from-emerald-100 to-teal-50 px-5 py-4 border-b border-teal-200 cursor-pointer"
                    >
                      <View className="flex justify-between items-center">
                        <View className="flex items-center gap-3">
                          <Text className="block text-2xl">📅</Text>
                          <Text className="block text-2xl font-bold text-teal-900">
                            {yearGroup.year}年
                          </Text>
                        </View>
                        <Text className="block text-xl text-teal-700">
                          {yearCollapsed ? '▶' : '▼'}
                        </Text>
                      </View>
                    </View>

                    {/* 月份分组 */}
                    {!yearCollapsed && yearGroup.months.map((monthGroup) => {
                      const monthCollapsed = collapsedDates[`${yearGroup.year}-${monthGroup.month}`]
                      return (
                        <View key={`${yearGroup.year}-${monthGroup.month}`}>
                          {/* 月份分组标题 */}
                          <View
                            onClick={() => toggleCollapse(yearGroup.year, monthGroup.month)}
                            className="bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4 border-b border-orange-200 cursor-pointer"
                          >
                            <View className="flex justify-between items-center">
                              <View className="flex items-center gap-3">
                                <Text className="block text-xl">📆</Text>
                                <Text className="block text-xl font-bold text-orange-900">
                                  {monthGroup.month}月
                                </Text>
                              </View>
                              <Text className="block text-xl text-orange-700">
                                {monthCollapsed ? '▶' : '▼'}
                              </Text>
                            </View>
                          </View>

                          {/* 日期分组 */}
                          {!monthCollapsed && monthGroup.days.map((dayGroup) => (
                            <View key={`${yearGroup.year}-${monthGroup.month}-${dayGroup.day}`} className="border-b border-gray-100 last:border-b-0">
                              <View className="bg-gray-50 px-5 py-3">
                                <View className="flex items-center gap-2">
                                  <Text className="block text-lg">📌</Text>
                                  <Text className="block text-lg font-semibold text-gray-700">
                                    {dayGroup.day}日 · {dayGroup.items.length} 笔
                                  </Text>
                                </View>
                              </View>

                              {/* 账单项 */}
                              <View className="p-3">
                                {dayGroup.items.map((account) => (
                                  <View
                                    key={account.id}
                                    onClick={() => goToDetailPage(account.id)}
                                    className="border-b border-gray-100 last:border-b-0 py-4"
                                  >
                                    <View className="flex justify-between items-center mb-2">
                                      <Text className="block text-2xl font-semibold text-gray-900 flex-1">
                                        {account.customer_name}
                                      </Text>
                                      <Text className="block text-2xl font-bold text-orange-500 ml-3">
                                        ¥ {account.amount.toFixed(2)}
                                      </Text>
                                    </View>

                                    <View className="flex flex-col gap-2 mb-2">
                                      <Text className="block text-xl text-gray-700">
                                        {account.item_description}
                                      </Text>
                                      <Text className="block text-lg text-gray-600">
                                        📞 {account.phone}
                                      </Text>
                                    </View>

                                    <View className="flex justify-between items-center">
                                      <View className={`px-4 py-2 rounded-lg ${account.is_paid ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                        <Text className={`block text-lg font-semibold ${account.is_paid ? 'text-green-700' : 'text-yellow-700'}`}>
                                          {account.is_paid ? '✓ 已付款' : '⏳ 待付款'}
                                        </Text>
                                      </View>

                                      {account.has_image && (
                                        <Text className="block text-lg text-blue-500">
                                          📷 有凭证
                                        </Text>
                                      )}
                                    </View>
                                  </View>
                                ))}
                              </View>
                            </View>
                          ))}
                        </View>
                      )
                    })}
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default IndexPage
