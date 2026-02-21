import { View, Text, Input, Picker, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { Network } from '@/network'
import './index.css'

const AddAccountPage = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    amount: '',
    itemDescription: '',
    accountDate: '',
    isPaid: false
  })
  const [recorderManager, setRecorderManager] = useState<Taro.RecorderManager | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  // 初始化录音管理器（仅小程序端）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isWeapp) {
      const manager = Taro.getRecorderManager()

      manager.onStart(() => {
        console.log('录音开始')
        setIsRecording(true)
      })

      manager.onStop(async (res) => {
        console.log('录音结束', res.tempFilePath)
        setIsRecording(false)

        // 上传音频进行识别
        await uploadAndRecognize(res.tempFilePath)
      })

      manager.onError((err) => {
        console.error('录音错误', err)
        setIsRecording(false)
        Taro.showToast({ title: '录音失败', icon: 'none' })
      })

      setRecorderManager(manager)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWeapp])

  // 上传音频并进行语音识别
  const uploadAndRecognize = async (audioPath: string) => {
    try {
      Taro.showLoading({ title: '正在识别...' })

      // 先上传音频文件到对象存储
      const uploadRes = await Network.uploadFile({
        url: '/api/upload/audio',
        filePath: audioPath,
        name: 'audio'
      })

      console.log('音频上传响应:', uploadRes)
      const uploadData = JSON.parse(uploadRes.data)
      const audioUrl = uploadData.data?.url

      if (!audioUrl) {
        throw new Error('上传失败，未获取到音频URL')
      }

      // 调用语音识别接口
      const asrRes = await Network.request({
        url: '/api/asr/recognize',
        method: 'POST',
        data: { audioUrl }
      })

      console.log('语音识别响应:', asrRes)

      if (asrRes.data?.data?.text) {
        const recognizedText = asrRes.data.data.text
        console.log('识别结果:', recognizedText)

        // 简单解析识别结果（实际可以使用 AI 提取）
        parseRecognizedText(recognizedText)

        Taro.showToast({
          title: '识别成功',
          icon: 'success'
        })
      } else {
        throw new Error('识别失败，未获取到文本')
      }
    } catch (error) {
      console.error('语音识别失败:', error)
      Taro.showToast({
        title: '识别失败，请手动输入',
        icon: 'none'
      })
    } finally {
      Taro.hideLoading()
    }
  }

  // 解析识别的文本并填充表单
  const parseRecognizedText = (text: string) => {
    console.log('解析文本:', text)

    // 简单提取金额
    const amountMatch = text.match(/(\d+\.?\d*)\s*元/)
    if (amountMatch) {
      setFormData(prev => ({ ...prev, amount: amountMatch[1] }))
    }

    // 提取电话号码
    const phoneMatch = text.match(/1[3-9]\d{9}/)
    if (phoneMatch) {
      setFormData(prev => ({ ...prev, phone: phoneMatch[0] }))
    }

    // 其余作为商品描述
    const desc = text.replace(/(\d+\.?\d*)\s*元/, '').replace(/1[3-9]\d{9}/, '').trim()
    if (desc) {
      setFormData(prev => ({ ...prev, itemDescription: desc }))
    }
  }

  // 开始录音
  const handleStartRecord = () => {
    if (!isWeapp) {
      Taro.showToast({ title: 'H5端暂不支持录音，请使用文字输入', icon: 'none' })
      return
    }

    if (!recorderManager) {
      Taro.showToast({ title: '录音功能初始化中...', icon: 'none' })
      return
    }

    recorderManager.start({
      format: 'wav',        // WAV 格式，ASR 兼容
      sampleRate: 16000,    // 16kHz 采样率
      numberOfChannels: 1,  // 单声道
      frameSize: 50
    })
  }

  // 停止录音
  const handleStopRecord = () => {
    if (!isWeapp || !recorderManager) return
    recorderManager.stop()
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
        setIsUploading(true)

        const uploadRes = await Network.uploadFile({
          url: '/api/upload/image',
          filePath: res.tempFilePaths[0],
          name: 'file'
        })

        console.log('图片上传响应:', uploadRes)
        const uploadData = JSON.parse(uploadRes.data)
        const url = uploadData.data?.url

        if (url) {
          setImageUrl(url)
          Taro.showToast({ title: '上传成功', icon: 'success' })
        } else {
          throw new Error('上传失败，未获取到图片URL')
        }
      }
    } catch (error) {
      console.error('选择图片失败:', error)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    } finally {
      setIsUploading(false)
    }
  }

  // 提交账单
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
    if (!formData.itemDescription) {
      Taro.showToast({ title: '请输入商品描述', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '提交中...' })

      const submitData = {
        customer_name: formData.customerName,
        phone: formData.phone,
        amount: parseFloat(formData.amount),
        item_description: formData.itemDescription,
        account_date: formData.accountDate || new Date().toISOString().split('T')[0],
        is_paid: formData.isPaid,
        image_url: imageUrl
      }

      console.log('提交数据:', submitData)

      const res = await Network.request({
        url: '/api/accounts',
        method: 'POST',
        data: submitData
      })

      console.log('提交响应:', res)

      Taro.hideLoading()
      Taro.showToast({
        title: '添加成功',
        icon: 'success'
      })

      // 返回首页
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交失败:', error)
      Taro.hideLoading()
      Taro.showToast({ title: '提交失败', icon: 'none' })
    }
  }

  // 格式化当前日期
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 设置默认日期
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      accountDate: formatDate(new Date())
    }))
  }, [])

  return (
    <View className="min-h-screen bg-gray-50 pb-24">
      <View className="px-4 pt-6">
        {/* 语音输入区域 */}
        <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-gray-200">
          <Text className="block text-lg font-bold text-gray-900 mb-4">
            方式一：语音记账（推荐）
          </Text>
          {isWeapp ? (
            <View className="flex flex-col items-center py-4">
              {isRecording ? (
                <View
                  onClick={handleStopRecord}
                  className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse"
                >
                  <View className="text-center">
                    <Text className="block text-white text-2xl">🔴</Text>
                    <Text className="block text-white text-sm mt-2">点击停止</Text>
                  </View>
                </View>
              ) : (
                <View
                  onClick={handleStartRecord}
                  className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <View className="text-center">
                    <Text className="block text-white text-2xl">🎤</Text>
                    <Text className="block text-white text-sm mt-2">点击说话</Text>
                  </View>
                </View>
              )}
              <Text className="block text-base text-gray-700 mt-4 text-center">
                请清晰说出：客户姓名、电话、金额、商品
              </Text>
              <Text className="block text-sm text-gray-500 mt-2 text-center">
                例如：&ldquo;王大勇，电话13888888888，买了350元龙虾饲料&rdquo;
              </Text>
            </View>
          ) : (
            <View className="flex items-center justify-center py-6 bg-gray-100 rounded-xl">
              <Text className="block text-gray-500 text-center text-base">
                语音功能仅在小程序中可用{'\n'}请使用文字输入方式
              </Text>
            </View>
          )}
        </View>

        {/* 表单输入区域 */}
        <View className="bg-white rounded-2xl p-6 mb-4 border-2 border-gray-200">
          <Text className="block text-lg font-bold text-gray-900 mb-4">
            方式二：文字记账
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
                  placeholder="请输入联系电话"
                  placeholderClass="text-base text-gray-500"
                  value={formData.phone}
                  onInput={(e) => setFormData(prev => ({ ...prev, phone: e.detail.value }))}
                  type="number"
                  maxlength={11}
                />
              </View>
            </View>

            {/* 金额 */}
            <View>
              <Text className="block text-base text-gray-700 mb-2 font-semibold">
                金额（元）*
              </Text>
              <View className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
                <Input
                  className="w-full bg-transparent text-base text-gray-900"
                  placeholder="请输入金额"
                  placeholderClass="text-base text-gray-500"
                  value={formData.amount}
                  onInput={(e) => setFormData(prev => ({ ...prev, amount: e.detail.value }))}
                  type="digit"
                />
              </View>
            </View>

            {/* 商品描述 */}
            <View>
              <Text className="block text-base text-gray-700 mb-2 font-semibold">
                商品描述 *
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
            <View>
              <Text className="block text-base text-gray-700 mb-2 font-semibold">
                账单日期
              </Text>
              <View
                onClick={() => setShowDatePicker(true)}
                className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300"
              >
                <Text className="block text-base text-gray-900">
                  {formData.accountDate || '请选择日期'}
                </Text>
              </View>
              <Picker
                mode="date"
                value={formData.accountDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, accountDate: e.detail.value }))
                  setShowDatePicker(false)
                }}
              >
                <View style={{ display: showDatePicker ? 'flex' : 'none' }}></View>
              </Picker>
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
            凭证图片（可选）
          </Text>

          {imageUrl ? (
            <View className="relative">
              <Image
                src={imageUrl}
                className="w-full h-48 rounded-xl object-cover"
                mode="aspectFill"
              />
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

          {isUploading && (
            <View className="mt-3">
              <Text className="block text-base text-gray-600 text-center">
                上传中...
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 底部提交按钮 */}
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
        onClick={() => Taro.navigateBack()}
        style={{ flex: 1 }}
      >
          <View className="w-full bg-gray-200 rounded-xl py-4">
            <Text className="block text-center text-base font-semibold text-gray-700">
              取消
            </Text>
          </View>
        </View>
        <View
          onClick={handleSubmit}
          style={{ flex: 1 }}
        >
          <View className="w-full bg-orange-500 rounded-xl py-4">
            <Text className="block text-center text-base font-semibold text-white">
              确认记账
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default AddAccountPage
