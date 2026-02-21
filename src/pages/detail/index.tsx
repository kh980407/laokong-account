import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
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
  image_url?: string
}

const DetailPage = () => {
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 获取路由参数
  const router = Taro.useRouter()
  const id = parseInt(router.params.id || '0')

  // 加载账单详情
  const loadAccount = async () => {
    if (!id) {
      Taro.showToast({ title: '参数错误', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const res = await Network.request({
        url: `/api/accounts/${id}`,
        method: 'GET'
      })

      console.log('账单详情响应:', res.data)
      const accountData = res.data?.data || res.data
      setAccount(accountData)
    } catch (error) {
      console.error('加载账单详情失败:', error)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 删除账单
  const handleDelete = async () => {
    if (!account) return

    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除"${account.customer_name}"的账单吗？`,
      confirmText: '删除',
      confirmColor: '#ef4444'
    })

    if (!result.confirm) return

    setDeleting(true)
    try {
      await Network.request({
        url: `/api/accounts/${id}`,
        method: 'DELETE'
      })

      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('删除失败:', error)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    } finally {
      setDeleting(false)
    }
  }

  // 更改付款状态
  const togglePaymentStatus = async () => {
    if (!account) return

    try {
      Taro.showLoading({ title: '更新中...' })

      const res = await Network.request({
        url: `/api/accounts/${id}`,
        method: 'PUT',
        data: { is_paid: !account.is_paid }
      })

      console.log('更新付款状态响应:', res.data)
      setAccount(prev => prev ? { ...prev, is_paid: !prev.is_paid } : null)

      Taro.hideLoading()
      Taro.showToast({
        title: account.is_paid ? '已标记为待付款' : '已标记为已付款',
        icon: 'success'
      })
    } catch (error) {
      console.error('更新失败:', error)
      Taro.hideLoading()
      Taro.showToast({ title: '更新失败', icon: 'none' })
    }
  }

  useEffect(() => {
    loadAccount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      {loading ? (
        <View className="flex items-center justify-center py-20">
          <Text className="block text-base text-gray-700">加载中...</Text>
        </View>
      ) : account ? (
        <View className="px-4 pt-6">
          {/* 金额卡片 */}
          <View className="bg-orange-500 rounded-2xl p-6 mb-4">
            <Text className="block text-base text-white mb-2">金额</Text>
            <Text className="block text-4xl font-bold text-white">
              ¥ {account.amount.toFixed(2)}
            </Text>
            <View className={`mt-4 inline-block px-4 py-2 rounded-lg ${account.is_paid ? 'bg-white bg-opacity-20' : 'bg-yellow-400'}`}>
              <Text className={`block text-base font-semibold ${account.is_paid ? 'text-white' : 'text-yellow-900'}`}>
                {account.is_paid ? '已付款' : '待付款'}
              </Text>
            </View>
          </View>

          {/* 客户信息 */}
          <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-gray-200">
            <Text className="block text-lg font-bold text-gray-900 mb-4">
              客户信息
            </Text>

            <View className="flex flex-col gap-4">
              <View>
                <Text className="block text-sm text-gray-500 mb-1">客户姓名</Text>
                <Text className="block text-lg text-gray-900 font-semibold">
                  {account.customer_name}
                </Text>
              </View>

              {account.phone && (
                <View>
                  <Text className="block text-sm text-gray-500 mb-1">联系电话</Text>
                  <Text className="block text-lg text-gray-900 font-semibold">
                    {account.phone}
                  </Text>
                </View>
              )}

              <View>
                <Text className="block text-sm text-gray-500 mb-1">账单日期</Text>
                <Text className="block text-lg text-gray-900 font-semibold">
                  {account.account_date}
                </Text>
              </View>
            </View>
          </View>

          {/* 商品描述 */}
          <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-gray-200">
            <Text className="block text-lg font-bold text-gray-900 mb-4">
              商品描述
            </Text>
            <Text className="block text-base text-gray-700 leading-relaxed">
              {account.item_description}
            </Text>
          </View>

          {/* 凭证图片 */}
          {account.image_url && (
            <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-gray-200">
              <Text className="block text-lg font-bold text-gray-900 mb-4">
                凭证图片
              </Text>
              <Image
                src={account.image_url}
                className="w-full rounded-xl"
                mode="widthFix"
              />
            </View>
          )}
        </View>
      ) : (
        <View className="flex items-center justify-center py-20">
          <Text className="block text-base text-gray-500">账单不存在</Text>
        </View>
      )}

      {/* 底部操作按钮 */}
      {account && (
        <View style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'row',
          padding: '16px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e5e5',
          gap: '12px',
          zIndex: 100
        }}
        >
          <View
            onClick={togglePaymentStatus}
            style={{ flex: 1 }}
          >
            <View className={`w-full rounded-xl py-4 ${account.is_paid ? 'bg-yellow-500' : 'bg-green-500'}`}>
              <Text className="block text-center text-base font-semibold text-white">
                {account.is_paid ? '标记为待付款' : '标记为已付款'}
              </Text>
            </View>
          </View>
          <View
            onClick={handleDelete}
            style={{ flex: 1 }}
          >
            <View className={`w-full rounded-xl py-4 ${deleting ? 'bg-gray-400' : 'bg-red-500'}`}>
              <Text className="block text-center text-base font-semibold text-white">
                {deleting ? '删除中...' : '删除'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default DetailPage
