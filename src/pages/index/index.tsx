import { View, Text } from '@tarojs/components'
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

  // 加载账单列表
  const loadAccounts = async () => {
    setLoading(true)
    try {
      const res = await Network.request({
        url: '/api/accounts',
        method: 'GET'
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

      {/* 账单列表 */}
      <View className="px-4 py-6">
        {loading ? (
          <View className="flex items-center justify-center py-12">
            <Text className="block text-base text-gray-700">加载中...</Text>
          </View>
        ) : accounts.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="text-6xl mb-4">📋</Text>
            <Text className="block text-lg text-gray-700 font-semibold mb-2">
              暂无账单记录
            </Text>
            <Text className="block text-base text-gray-600 text-center mb-6">
              点击右上角&quot;+&quot;开始记录
            </Text>
            <View
              onClick={goToAddPage}
              className="bg-orange-500 rounded-xl px-8 py-4"
            >
              <Text className="block text-white text-lg font-semibold">
                新增账单
              </Text>
            </View>
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
