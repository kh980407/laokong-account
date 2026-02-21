import { View, Text, Input, Picker } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { useState, useEffect } from 'react'
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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

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
      <View className="bg-orange-500 p-6 pb-8">
        <Text className="block text-2xl font-bold text-white mb-4">电子账本</Text>
        <View className="flex justify-between gap-4">
          <View className="flex-1 bg-white bg-opacity-20 rounded-xl p-4">
            <Text className="block text-base text-white mb-1">总金额</Text>
            <Text className="block text-2xl font-bold text-white">
              ¥ {totalAmount.toFixed(2)}
            </Text>
          </View>
          <View className="flex-1 bg-white bg-opacity-20 rounded-xl p-4">
            <Text className="block text-base text-white mb-1">待收款</Text>
            <Text className="block text-2xl font-bold text-white">
              {unpaidCount} 笔
            </Text>
          </View>
        </View>
      </View>

      {/* 搜索栏 */}
      <View className="px-4 pt-4 pb-2">
        <View className="bg-white rounded-xl p-4 border-2 border-gray-200">
          {/* 搜索关键词 */}
          <View className="mb-3">
            <Text className="block text-sm text-gray-600 mb-2 font-semibold">
              搜索姓名、电话、商品
            </Text>
            <View className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
              <Input
                className="w-full bg-transparent text-base text-gray-900"
                placeholder="请输入搜索关键词"
                placeholderClass="text-base text-gray-500"
                value={searchKeyword}
                onInput={(e) => setSearchKeyword(e.detail.value)}
              />
            </View>
          </View>

          {/* 日期范围 */}
          <View className="mb-3">
            <Text className="block text-sm text-gray-600 mb-2 font-semibold">
              时间范围（可选）
            </Text>
            <View className="flex gap-2">
              <View
                onClick={() => setShowStartDatePicker(true)}
                className="flex-1 bg-gray-100 rounded-lg p-3 border-2 border-gray-300"
              >
                <Text className={`block text-base ${startDate ? 'text-gray-900' : 'text-gray-500'}`}>
                  {startDate || '开始日期'}
                </Text>
              </View>
              <View
                onClick={() => setShowEndDatePicker(true)}
                className="flex-1 bg-gray-100 rounded-lg p-3 border-2 border-gray-300"
              >
                <Text className={`block text-base ${endDate ? 'text-gray-900' : 'text-gray-500'}`}>
                  {endDate || '结束日期'}
                </Text>
              </View>
            </View>

            {/* 隐藏的日期选择器 */}
            <Picker
              mode="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.detail.value)
                setShowStartDatePicker(false)
              }}
            >
              <View style={{ display: showStartDatePicker ? 'flex' : 'none' }}></View>
            </Picker>

            <Picker
              mode="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.detail.value)
                setShowEndDatePicker(false)
              }}
            >
              <View style={{ display: showEndDatePicker ? 'flex' : 'none' }}></View>
            </Picker>
          </View>

          {/* 操作按钮 */}
          <View className="flex gap-3">
            <View
              onClick={handleClearSearch}
              className="flex-1 bg-gray-200 rounded-lg py-3"
            >
              <Text className="block text-center text-base font-semibold text-gray-700">
                清空
              </Text>
            </View>
            <View
              onClick={handleSearch}
              className="flex-1 bg-blue-500 rounded-lg py-3"
            >
              <Text className="block text-center text-base font-semibold text-white">
                搜索
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 账单列表 */}
      <View className="px-4 py-6">
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
          <View className="flex flex-col gap-3">
            {accounts.map((account) => (
              <View
                key={account.id}
                onClick={() => goToDetailPage(account.id)}
                className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-200"
              >
                <View className="flex justify-between items-center mb-3">
                  <Text className="block text-lg font-semibold text-gray-900 flex-1">
                    {account.customer_name}
                  </Text>
                  <Text className="block text-lg font-bold text-orange-500 ml-3">
                    ¥ {account.amount.toFixed(2)}
                  </Text>
                </View>

                <View className="flex flex-col gap-1 mb-3">
                  <Text className="block text-base text-gray-700">
                    {account.item_description}
                  </Text>
                  <Text className="block text-sm text-gray-600">
                    {account.phone}
                  </Text>
                </View>

                <View className="flex justify-between items-center">
                  <Text className="block text-sm text-gray-600">
                    {account.account_date}
                  </Text>
                  <View className={`px-3 py-1 rounded-lg ${account.is_paid ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <Text className={`block text-sm font-semibold ${account.is_paid ? 'text-green-700' : 'text-yellow-700'}`}>
                      {account.is_paid ? '已付款' : '待付款'}
                    </Text>
                  </View>
                </View>

                {account.has_image && (
                  <View className="mt-2 pt-2 border-t border-gray-200">
                    <Text className="block text-sm text-blue-500">
                      📷 有凭证图片
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage
