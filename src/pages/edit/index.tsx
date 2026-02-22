import { View, Text, Input, Picker, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import './index.css'

const EditAccountPage = () => {
  const [accountId, setAccountId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    amount: '',
    itemDescription: '',
    accountDate: '',
    isPaid: false
  })
  const [imageUrl, setImageUrl] = useState('')
  const [imageLoadFailed, setImageLoadFailed] = useState(false)

  // 页面加载时获取账单详情
  useEffect(() => {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options: any = currentPage.options || {}

    if (options.id) {
      setAccountId(Number(options.id))
      loadAccountDetail(Number(options.id))
    }
  }, [])

  // 加载账单详情
  const loadAccountDetail = async (id: number) => {
    try {
      Taro.showLoading({ title: '加载中...' })
      const res = await Network.request({
        url: `/api/accounts/${id}`,
        method: 'GET'
      })

      console.log('账单详情响应:', res)

      if (res.data?.data) {
        const account = res.data.data
        setFormData({
          customerName: account.customer_name || '',
          phone: account.phone || '',
          amount: String(account.amount || ''),
          itemDescription: account.item_description || '',
          accountDate: account.account_date || '',
          isPaid: account.is_paid || false
        })
        setImageUrl(account.image_url || '')
        setImageLoadFailed(false)
      }
    } catch (error) {
      console.error('加载账单详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      Taro.hideLoading()
    }
  }

  // 选择图片
  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const fs = Taro.getFileSystemManager()
        const base64 = await new Promise<string>((resolve, reject) => {
          fs.readFile({
            filePath: res.tempFilePaths[0],
            encoding: 'base64',
            success: (r) => resolve((r as { data: string }).data),
            fail: reject
          })
        })
        setImageUrl(`data:image/jpeg;base64,${base64}`)
        setImageLoadFailed(false)
        Taro.showToast({ title: '添加成功', icon: 'success' })
      }
    } catch (error) {
      console.error('选择图片失败:', error)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  // 提交编辑
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.customerName) {
      Taro.showToast({ title: '请输入客户姓名', icon: 'none' })
      return
    }
    if (!formData.amount) {
      Taro.showToast({ title: '请输入金额', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '保存中...' })

      const submitData = {
        customer_name: formData.customerName,
        phone: formData.phone,
        amount: parseFloat(formData.amount),
        item_description: formData.itemDescription,
        account_date: formData.accountDate,
        is_paid: formData.isPaid,
        image_url: imageUrl || null
      }

      console.log('提交数据:', submitData)

      const res = await Network.request({
        url: `/api/accounts/${accountId}`,
        method: 'PUT',
        data: submitData
      })

      console.log('提交响应:', res)

      Taro.hideLoading()
      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })

      // 返回详情页
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('保存失败:', error)
      Taro.hideLoading()
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      <View className="px-4 pt-6">
        <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-gray-200">
          <Text className="block text-lg font-bold text-gray-900 mb-4">
            编辑账单
          </Text>

          <View className="flex flex-col gap-4">
            {/* 客户姓名 */}
            <View>
              <Text className="block text-base text-gray-700 mb-2 font-semibold">
                客户姓名 *
              </Text>
              <View className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
                <Input
                  className="w-full bg-transparent text-base text-gray-900"
                  placeholder="请输入客户姓名"
                  placeholderClass="text-base text-gray-500"
                  value={formData.customerName}
                  onInput={(e) => setFormData(prev => ({ ...prev, customerName: e.detail.value }))}
                />
              </View>
            </View>

            {/* 联系电话 */}
            <View>
              <Text className="block text-base text-gray-700 mb-2 font-semibold">
                联系电话
              </Text>
              <View className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
                <Input
                  className="w-full bg-transparent text-base text-gray-900"
                  type="number"
                  placeholder="请输入联系电话"
                  placeholderClass="text-base text-gray-500"
                  value={formData.phone}
                  onInput={(e) => setFormData(prev => ({ ...prev, phone: e.detail.value }))}
                />
              </View>
            </View>

            {/* 金额 */}
            <View>
              <Text className="block text-base text-gray-700 mb-2 font-semibold">
                金额 *
              </Text>
              <View className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
                <Input
                  className="w-full bg-transparent text-base text-gray-900"
                  type="digit"
                  placeholder="请输入金额"
                  placeholderClass="text-base text-gray-500"
                  value={formData.amount}
                  onInput={(e) => setFormData(prev => ({ ...prev, amount: e.detail.value }))}
                />
              </View>
            </View>

            {/* 商品描述 */}
            <View>
              <Text className="block text-base text-gray-700 mb-2 font-semibold">
                商品描述
              </Text>
              <View className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
                <Input
                  className="w-full bg-transparent text-base text-gray-900"
                  placeholder="请输入商品描述"
                  placeholderClass="text-base text-gray-500"
                  value={formData.itemDescription}
                  onInput={(e) => setFormData(prev => ({ ...prev, itemDescription: e.detail.value }))}
                />
              </View>
            </View>

            {/* 账单日期 */}
            <View className="bg-orange-50 rounded-xl p-4 border-2 border-orange-300">
              <Text className="block text-base text-orange-800 mb-2 font-bold">
                📅 账单日期（交易发生时间）
              </Text>
              <Picker
                mode="date"
                value={formData.accountDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, accountDate: e.detail.value }))
                }}
              >
                <View className="bg-white rounded-lg p-4 border-2 border-orange-400 active:bg-orange-50 transition-colors">
                  <Text className={`block text-base font-semibold ${formData.accountDate ? 'text-orange-900' : 'text-gray-500'}`}>
                    {formData.accountDate || '点击选择账单日期'}
                  </Text>
                </View>
              </Picker>
              <Text className="block text-sm text-orange-700 mt-2">
                提示：请选择交易实际发生的日期，可编辑修改
              </Text>
            </View>

            {/* 付款状态 */}
            <View className="flex items-center gap-3">
              <Text className="block text-base text-gray-700 font-semibold">
                付款状态：
              </Text>
              <View
                onClick={() => setFormData(prev => ({ ...prev, isPaid: true }))}
                className={`px-4 py-2 rounded-lg ${formData.isPaid ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <Text className={`block text-base font-semibold ${formData.isPaid ? 'text-white' : 'text-gray-700'}`}>
                  已付款
                </Text>
              </View>
              <View
                onClick={() => setFormData(prev => ({ ...prev, isPaid: false }))}
                className={`px-4 py-2 rounded-lg ${!formData.isPaid ? 'bg-yellow-500' : 'bg-gray-200'}`}
              >
                <Text className={`block text-base font-semibold ${!formData.isPaid ? 'text-white' : 'text-gray-700'}`}>
                  待付款
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 图片上传区域 */}
        <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-gray-200">
          <Text className="block text-lg font-bold text-gray-900 mb-4">
            凭证图片
          </Text>

          {imageUrl ? (
            <View className="relative">
              {imageLoadFailed ? (
                <View className="w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Text className="text-gray-500">凭证图片已过期</Text>
                </View>
              ) : (
                <Image
                  src={imageUrl}
                  className="w-full h-48 rounded-xl object-cover"
                  mode="aspectFill"
                  onError={() => setImageLoadFailed(true)}
                />
              )}
              <View
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
              >
                <Text className="block text-white text-sm">×</Text>
              </View>
            </View>
          ) : (
            <View
              onClick={handleChooseImage}
              className="bg-gray-100 rounded-2xl p-6 border-2 border-dashed border-gray-400"
            >
              <View className="text-center">
                <Text className="block text-3xl mb-2">📷</Text>
                <Text className="block text-base text-gray-700 font-semibold">
                  点击上传凭证图片
                </Text>
                <Text className="block text-sm text-gray-500 mt-1">
                  支持拍照或相册选择
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* 提交按钮 */}
        <View className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <View
            onClick={handleSubmit}
            className="bg-orange-500 rounded-xl py-4 flex items-center justify-center shadow-lg"
          >
            <Text className="block text-base font-bold text-white">
              保存修改
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default EditAccountPage
