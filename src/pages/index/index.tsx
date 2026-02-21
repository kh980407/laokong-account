import { View, Text, Input, Picker, ScrollView } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
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

  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // 折叠状态管理（按日期）
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({})

  // 切换日期组的折叠状态
  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }))
  }

  // 加载账单列表
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

      // 尝试打开文件
      try {
        await Taro.openDocument({
          filePath,
          fileType: 'xlsx',
          showMenu: true
        })

        // 显示文件位置提示
        setTimeout(() => {
          Taro.showModal({
            title: '📄 导出成功',
            content: `已成功导出 ${accounts.length} 条账单记录！\n\n📁 文件名：${fileName}\n💾 文件已自动打开，您可以保存或分享。\n\n如需再次查看，请在文件管理器中搜索文件名。`,
            confirmText: '知道了',
            showCancel: false
          })
        }, 800)
      } catch (openError) {
        console.error('打开文件失败:', openError)
        // 如果打开失败，仍然显示保存成功
        Taro.showModal({
          title: '📄 导出成功',
          content: `已成功导出 ${accounts.length} 条账单记录！\n\n📁 文件名：${fileName}\n💾 文件已保存到：${filePath}\n\n您可以在文件管理器中找到此文件，或下次重新导出。`,
          confirmText: '知道了',
          showCancel: false
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

  // 下拉刷新
  usePullDownRefresh(async () => {
    await loadAccounts()
    Taro.stopPullDownRefresh()
  })

  // 计算统计信息
  const totalAmount = accounts.reduce((sum, acc) => sum + acc.amount, 0)
  const unpaidCount = accounts.filter(acc => !acc.is_paid).length

  // 按日期分组
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, Account[]> = {}
    accounts.forEach(account => {
      const date = account.account_date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(account)
    })
    // 按日期降序排序
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, items]) => ({ date, items }))
  }, [accounts])

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 导航栏右侧添加按钮 */}
      <View style={{ position: 'absolute', right: '16px', top: '60px', zIndex: 10 }}>
        <View
          onClick={goToAddPage}
          className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <Text className="block text-white text-2xl">+</Text>
        </View>
      </View>

      {/* 统计信息卡片 */}
      <View className="bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 p-6 pb-8 shadow-xl border-b-4 border-orange-600">
        <View className="flex items-center gap-4 mb-5">
          <View className="w-16 h-16 bg-white bg-opacity-25 rounded-2xl flex items-center justify-center shadow-md backdrop-blur-sm">
            <Text className="text-4xl">📔</Text>
          </View>
          <View>
            <Text className="block text-3xl font-bold text-white">老孔记账本</Text>
            <Text className="block text-base text-orange-100 mt-1">记录美好生活，算好每笔账</Text>
          </View>
        </View>

        <View className="flex justify-between gap-4">
          <View className="flex-1 bg-white bg-opacity-25 rounded-2xl p-5 backdrop-blur-sm shadow-md">
            <View className="flex items-center gap-2 mb-2">
              <Text className="text-2xl">💰</Text>
              <Text className="block text-base text-white font-semibold">总金额</Text>
            </View>
            <Text className="block text-3xl font-bold text-white">
              ¥{totalAmount.toFixed(2)}
            </Text>
          </View>
          <View className="flex-1 bg-white bg-opacity-25 rounded-2xl p-5 backdrop-blur-sm shadow-md">
            <View className="flex items-center gap-2 mb-2">
              <Text className="text-2xl">📋</Text>
              <Text className="block text-base text-white font-semibold">待收款</Text>
            </View>
            <Text className="block text-3xl font-bold text-white">
              {unpaidCount} 笔
            </Text>
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
              <Text className="block text-sm text-white text-opacity-90">
                将账单记录导出为 Excel 文件，方便存档和备份
              </Text>
            </View>
            <Text className="block text-2xl text-white">→</Text>
          </View>
          {searchKeyword || startDate || endDate ? (
            <View className="mt-3 bg-white bg-opacity-20 rounded-lg px-3 py-2">
              <Text className="block text-sm text-white">
                💡 当前搜索条件也将被导出
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* 搜索栏 */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          {/* 搜索关键词 */}
          <View className="mb-4">
            <Text className="block text-sm text-gray-600 mb-2 font-semibold">
              🔍 搜索姓名、电话、商品
            </Text>
            <View className="bg-gray-50 rounded-xl p-4 border-2 border-orange-200 focus-within:border-orange-400 transition-colors">
              <Input
                className="w-full bg-transparent text-base text-gray-900"
                placeholder="请输入搜索关键词"
                placeholderClass="text-base text-gray-400"
                value={searchKeyword}
                onInput={(e) => setSearchKeyword(e.detail.value)}
              />
            </View>
          </View>

          {/* 日期范围 */}
          <View className="mb-4">
            <Text className="block text-sm text-gray-600 mb-2 font-semibold">
              📅 选择时间范围（可选）
            </Text>
            <View className="flex gap-3">
              <Picker
                mode="date"
                value={startDate}
                onChange={(e) => setStartDate(e.detail.value)}
              >
                <View className="flex-1 bg-gray-50 rounded-xl p-4 border-2 border-orange-200 focus-within:border-orange-400 transition-colors flex items-center">
                  <Text className={`block text-base ${startDate ? 'text-gray-900' : 'text-gray-400'}`}>
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
                  <Text className={`block text-base ${endDate ? 'text-gray-900' : 'text-gray-400'}`}>
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
              <Text className="block text-center text-base font-semibold text-gray-700">
                清空
              </Text>
            </View>
            <View
              onClick={handleSearch}
              className="flex-1 bg-orange-500 rounded-xl py-4 shadow-md active:bg-orange-600 transition-colors"
            >
              <Text className="block text-center text-base font-semibold text-white">
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
              <Text className="block text-base text-gray-700">加载中...</Text>
            </View>
          ) : accounts.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-20">
              <Text className="text-6xl mb-4">{searchKeyword || startDate || endDate ? '🔍' : '📋'}</Text>
              <Text className="block text-lg text-gray-700 font-semibold mb-2">
                {searchKeyword || startDate || endDate ? '未找到匹配的账单' : '暂无账单记录'}
              </Text>
              <Text className="block text-base text-gray-600 text-center mb-6">
                {searchKeyword || startDate || endDate
                  ? '请尝试调整搜索条件'
                  : '点击右上角&quot;+&quot;开始记录'}
              </Text>
              {(searchKeyword || startDate || endDate) ? (
                <View
                  onClick={handleClearSearch}
                  className="bg-gray-200 rounded-xl px-8 py-4"
                >
                  <Text className="block text-gray-700 text-lg font-semibold">
                    清空搜索
                  </Text>
                </View>
              ) : (
                <View
                  onClick={goToAddPage}
                  className="bg-orange-500 rounded-xl px-8 py-4"
                >
                  <Text className="block text-white text-lg font-semibold">
                    新增账单
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="flex flex-col gap-4">
              {groupedAccounts.map((group) => {
                const isCollapsed = collapsedDates[group.date]
                return (
                  <View key={group.date} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    {/* 日期分组标题 - 可点击折叠/展开 */}
                    <View
                      onClick={() => toggleDateCollapse(group.date)}
                      className="bg-gradient-to-r from-orange-100 to-orange-50 px-4 py-3 border-b border-orange-200 cursor-pointer"
                    >
                      <View className="flex justify-between items-center">
                        <View className="flex items-center gap-2">
                          <Text className="block text-lg font-bold text-orange-800">
                            📅 {group.date}
                          </Text>
                          <Text className="block text-base font-semibold text-orange-700">
                            {group.items.length} 笔账单
                          </Text>
                        </View>
                        <Text className="block text-2xl text-orange-600">
                          {isCollapsed ? '▶' : '▼'}
                        </Text>
                      </View>
                    </View>

                    {/* 该日期下的账单列表 - 根据折叠状态显示 */}
                    {!isCollapsed && (
                      <View className="p-3">
                        {group.items.map((account) => (
                          <View
                            key={account.id}
                            onClick={() => goToDetailPage(account.id)}
                            className="border-b border-gray-100 last:border-b-0 py-3"
                          >
                            <View className="flex justify-between items-center mb-2">
                              <Text className="block text-lg font-semibold text-gray-900 flex-1">
                                {account.customer_name}
                              </Text>
                              <Text className="block text-lg font-bold text-orange-500 ml-3">
                                ¥ {account.amount.toFixed(2)}
                              </Text>
                            </View>

                            <View className="flex flex-col gap-1 mb-2">
                              <Text className="block text-base text-gray-700">
                                {account.item_description}
                              </Text>
                              <Text className="block text-sm text-gray-600">
                                📞 {account.phone}
                              </Text>
                            </View>

                            <View className="flex justify-between items-center">
                              <View className={`px-3 py-1 rounded-lg ${account.is_paid ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                <Text className={`block text-sm font-semibold ${account.is_paid ? 'text-green-700' : 'text-yellow-700'}`}>
                                  {account.is_paid ? '✓ 已付款' : '⏳ 待付款'}
                                </Text>
                              </View>

                              {account.has_image && (
                                <Text className="block text-sm text-blue-500">
                                  📷 有凭证
                                </Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
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
