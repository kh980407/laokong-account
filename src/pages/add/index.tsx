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
  const [imageBase64, setImageBase64] = useState('')
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

  // 语音识别：直接传 base64 给 ASR，避免 URL 拉取导致 Invalid URL
  const uploadAndRecognize = async (audioPath: string) => {
    try {
      console.log('[语音] base64 直传 ASR')
      Taro.showLoading({ title: '正在识别...' })

      const fs = Taro.getFileSystemManager()
      const base64 = await new Promise<string>((resolve, reject) => {
        fs.readFile({
          filePath: audioPath,
          encoding: 'base64',
          success: (res) => resolve((res as { data: string }).data),
          fail: reject
        })
      })

      const maxRetries = 3
      let asrRes: Taro.request.SuccessCallbackResult
      for (let i = 0; i < maxRetries; i++) {
        asrRes = await Network.request({
          url: '/api/asr/recognize',
          method: 'POST',
          data: { audioBase64: base64 }
        })
        const st = (asrRes as { statusCode?: number }).statusCode ?? (asrRes as { status?: number }).status
        if (st !== 503 || i === maxRetries - 1) break
        await new Promise((r) => setTimeout(r, 2000))
      }

      console.log('语音识别响应:', asrRes!)

      const asrStatus = (asrRes! as { statusCode?: number }).statusCode ?? (asrRes! as { status?: number }).status
      const asrData = asrRes!.data as { message?: string; data?: { text?: string } }
      if ((asrStatus ?? 0) >= 400) {
        const msg = asrStatus === 503 ? '服务繁忙，请稍后重试' : (asrData?.message || '语音识别服务异常')
        console.log('ASR 错误:', asrStatus, asrData)
        Taro.showToast({ title: msg, icon: 'none', duration: 4000 })
        return
      }

      if (asrData?.data?.text) {
        const recognizedText = asrData.data.text
        console.log('识别结果:', recognizedText)

        await parseRecognizedTextWithAI(recognizedText)

        Taro.showToast({
          title: '识别成功',
          icon: 'success'
        })
      } else {
        Taro.showToast({
          title: asrData?.message || '未识别到有效内容，请重说一次',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('语音识别失败:', error)
      Taro.showToast({
        title: '识别失败，请手动输入',
        icon: 'none'
      })
    } finally {
      try { Taro.hideLoading() } catch (_) { /* 忽略 */ }
    }
  }

  // 使用 AI 解析识别的文本并填充表单
  const parseRecognizedTextWithAI = async (text: string) => {
    try {
      Taro.showLoading({ title: '正在分析...' })

      const aiRes = await Network.request({
        url: '/api/ai/parse-voice',
        method: 'POST',
        data: { text }
      })

      console.log('AI 解析响应:', aiRes)

      if (aiRes.data?.data) {
        const extractedData = aiRes.data.data

        // 填充表单
        setFormData(prev => ({
          ...prev,
          customerName: extractedData.customer_name || prev.customerName,
          phone: extractedData.phone || prev.phone,
          amount: extractedData.amount ? String(extractedData.amount) : prev.amount,
          itemDescription: extractedData.item_description || prev.itemDescription,
          isPaid: extractedData.is_paid !== undefined ? extractedData.is_paid : prev.isPaid,
          accountDate: extractedData.account_date || prev.accountDate
        }))

        Taro.showToast({
          title: '自动填充成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('AI 解析失败:', error)
      Taro.showToast({
        title: 'AI解析失败，请手动输入',
        icon: 'none'
      })
    } finally {
      Taro.hideLoading()
    }
  }

  // 图片识别（优先 base64 避免临时 URL 404）
  const handleImageRecognition = async () => {
    if (!imageUrl || !imageBase64) {
      Taro.showToast({ title: '请先选择凭证图片', icon: 'none' })
      return
    }

    try {
      Taro.showLoading({ title: '正在识别...' })

      const aiRes = await Network.request({
        url: '/api/ai/parse-image',
        method: 'POST',
        data: { imageBase64 }
      })

      console.log('图片识别响应:', aiRes)

      if (aiRes.data?.data && Array.isArray(aiRes.data.data) && aiRes.data.data.length > 0) {
        const extractedDataList = aiRes.data.data

        Taro.hideLoading()

        // 如果识别出多条记录，提示用户是否批量创建
        if (extractedDataList.length > 1) {
          const result = await Taro.showModal({
            title: '识别到多条记录',
            content: `识别到 ${extractedDataList.length} 条账单记录，是否全部创建？\n\n您可以后续点击每条记录进行修改。`,
            confirmText: '全部创建',
            confirmColor: '#10b981'
          })

          if (result.confirm) {
            await batchCreateAccounts(extractedDataList)
          } else {
            // 用户选择不批量创建，只填充第一条
            fillFormData(extractedDataList[0])
          }
        } else {
          // 只有一条记录，直接填充
          fillFormData(extractedDataList[0])
          Taro.showToast({
            title: '识别成功',
            icon: 'success'
          })
        }
      } else {
        throw new Error('识别失败，未获取到账单信息')
      }
    } catch (error) {
      console.error('图片识别失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '识别失败，请手动输入',
        icon: 'none'
      })
    }
  }

  // 填充表单数据
  const fillFormData = (data: any) => {
    setFormData(prev => ({
      ...prev,
      customerName: data.customer_name || prev.customerName,
      phone: data.phone || prev.phone,
      amount: data.amount ? String(data.amount) : prev.amount,
      itemDescription: data.item_description || prev.itemDescription,
      isPaid: data.is_paid !== undefined ? data.is_paid : prev.isPaid,
      accountDate: data.account_date || prev.accountDate
    }))
  }

  // 批量创建账单
  const batchCreateAccounts = async (accounts: any[]) => {
    try {
      Taro.showLoading({ title: '创建中...' })

      let successCount = 0
      let failCount = 0

      for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i]

        // 使用图片URL作为凭证
        const submitData = {
          customer_name: account.customer_name || '',
          phone: account.phone || '',
          amount: parseFloat(account.amount) || 0,
          item_description: account.item_description || '',
          account_date: account.account_date || formData.accountDate,
          is_paid: account.is_paid !== undefined ? account.is_paid : false,
          image_url: imageUrl || null
        }

        try {
          await Network.request({
            url: '/api/accounts',
            method: 'POST',
            data: submitData
          })
          successCount++
        } catch (error) {
          console.error(`创建第 ${i + 1} 条记录失败:`, error)
          failCount++
        }
      }

      Taro.hideLoading()

      if (failCount === 0) {
        Taro.showToast({
          title: `成功创建 ${successCount} 条记录`,
          icon: 'success'
        })

        // 返回首页
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showModal({
          title: '部分创建失败',
          content: `成功 ${successCount} 条，失败 ${failCount} 条。\n已创建的记录可在首页查看，失败的记录请手动创建。`,
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              Taro.navigateBack()
            }
          }
        })
      }
    } catch (error) {
      console.error('批量创建失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '创建失败，请重试',
        icon: 'none'
      })
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

  // 选择图片：用 data URL 本地预览和保存，避免临时 URL 在 Railway 多实例下 404
  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setIsUploading(true)
        const fs = Taro.getFileSystemManager()
        const base64 = await new Promise<string>((resolve, reject) => {
          fs.readFile({
            filePath: res.tempFilePaths[0],
            encoding: 'base64',
            success: (r) => resolve((r as { data: string }).data),
            fail: reject
          })
        })
        setImageBase64(base64)
        setImageUrl(`data:image/jpeg;base64,${base64}`)
        Taro.showToast({ title: '添加成功', icon: 'success' })
      }
    } catch (error) {
      console.error('选择图片失败:', error)
      Taro.showToast({ title: '选择失败', icon: 'none' })
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
    const amountNum = parseFloat(String(formData.amount))
    if (!formData.amount || Number.isNaN(amountNum) || amountNum < 0) {
      Taro.showToast({ title: '请输入有效金额（数字）', icon: 'none' })
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
        amount: amountNum,
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

      const status = res.statusCode ?? (res as any).status
      if (status >= 200 && status < 300) {
        Taro.showToast({
          title: '添加成功',
          icon: 'success'
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        const msg = (res.data as { message?: string })?.message || (res.data as { detail?: string })?.detail || '添加失败'
        Taro.showToast({ title: String(msg), icon: 'none' })
      }
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
                提示：请选择交易实际发生的日期，而非录入日期
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
            方式三：图片识别（自动提取）
          </Text>

          {imageUrl ? (
            <View className="flex flex-col gap-3">
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

              {/* 图片识别按钮 */}
              <View
                onClick={handleImageRecognition}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl py-3 flex items-center justify-center"
              >
                <Text className="block text-base font-semibold text-white">
                  🤖 自动识别图片信息
                </Text>
              </View>

              <Text className="block text-sm text-gray-500 text-center">
                点击按钮自动提取图片中的账单信息
              </Text>
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
                  支持拍照或相册选择，可自动识别
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
