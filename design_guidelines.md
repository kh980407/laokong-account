# 电子账本 - 老年人友好设计指南

## 品牌定位

**应用名称**：电子账本
**核心用户**：65岁+ 农村个体工商户
**设计理念**：简单、清晰、易用
**关键需求**：
- 大字体（适应老花眼）
- 高对比度（清晰易读）
- 大按钮（方便点击）
- 语音输入（避免打字）
- 图片留痕（凭证保存）

## 配色方案

### 主色调（温暖友好）
```css
/* 主色 - 橙色系，温暖积极 */
--primary: bg-orange-500          # 主操作按钮
--primary-light: bg-orange-100    # 次要背景

/* 辅色 - 蓝色系，稳重可靠 */
--secondary: bg-blue-500          # 辅助信息
--secondary-light: bg-blue-50     # 轻量背景

/* 语义色 */
--success: bg-green-500           # 收入/已付款
--warning: bg-yellow-500          # 待付款
--danger: bg-red-500              # 删除/重要提示
--info: bg-gray-500               # 普通信息
```

### 中性色（高对比度）
```css
/* 文字颜色 - 避免浅色 */
--text-primary: text-gray-900     # 主要文字（黑）
--text-secondary: text-gray-700   # 次要文字（深灰）
--text-hint: text-gray-600        # 提示文字（中灰）

/* 背景色 */
--bg-page: bg-gray-50             # 页面背景（浅灰）
--bg-card: bg-white               # 卡片背景（白）
--bg-input: bg-gray-100           # 输入框背景（浅灰）
```

## 字体规范（大字体优先）

### 字号系统
```css
--text-h1: text-2xl (24px)        /* 页面标题 */
--text-h2: text-xl (20px)         /* 卡片标题 */
--text-h3: text-lg (18px)         /* 小标题/重要信息 */
--text-body: text-base (16px)     /* 正文内容 */
--text-caption: text-sm (14px)    /* 辅助文字 */
```

### 字重
```css
--font-bold: font-bold            /* 标题 */
--font-semibold: font-semibold    /* 重要信息 */
--font-normal: font-normal        /* 正文 */
```

### 行高（增加可读性）
```css
--line-height-tight: leading-tight    /* 1.25 */
--line-height-normal: leading-normal  /* 1.5 */
--line-height-relaxed: leading-loose  /* 2.0 */
```

## 间距系统（宽松舒适）

```css
/* 页面间距 */
--page-padding: p-4 (16px)         /* 页面边距 */
--page-padding-lg: p-6 (24px)      /* 页面大边距 */

/* 组件间距 */
--gap-sm: gap-2 (8px)              /* 小间距 */
--gap-md: gap-4 (16px)             /* 中间距 */
--gap-lg: gap-6 (24px)             /* 大间距 */

/* 卡片间距 */
--card-padding: p-4 (16px)         /* 卡片内边距 */
--card-margin: mb-4 (16px)         /* 卡片间距 */
```

## 组件规范（大按钮、高对比度）

### 按钮（最小点击区域 44px）

**主按钮**
```tsx
<View className="w-full bg-orange-500 rounded-xl py-4 active:bg-orange-600">
  <Text className="block text-center text-white text-lg font-semibold">
    立即记账
  </Text>
</View>
```

**次按钮**
```tsx
<View className="w-full bg-blue-50 border-2 border-blue-500 rounded-xl py-4">
  <Text className="block text-center text-blue-500 text-lg font-semibold">
    查看详情
  </Text>
</View>
```

**危险按钮**
```tsx
<View className="w-full bg-red-50 border-2 border-red-500 rounded-xl py-4">
  <Text className="block text-center text-red-500 text-lg font-semibold">
    删除
  </Text>
</View>
```

### 卡片（清晰边框、明确分隔）

```tsx
<View className="bg-white rounded-2xl p-4 shadow-sm mb-4 border-2 border-gray-200">
  <View className="mb-3">
    <Text className="block text-lg font-bold text-gray-900">
      客户名称
    </Text>
  </View>
  <View className="flex flex-col gap-2">
    <Text className="block text-base text-gray-700">联系电话：138****8888</Text>
    <Text className="block text-base text-gray-700">金额：¥ 500.00</Text>
    <Text className="block text-base text-gray-700">日期：2024-01-15</Text>
  </View>
</View>
```

### 输入框（大字体、高对比度）

```tsx
<View className="bg-gray-100 rounded-xl p-4 mb-4 border-2 border-gray-300">
  <Input
    className="w-full bg-transparent text-base text-gray-900"
    placeholder="请输入客户姓名"
    placeholderClass="text-base text-gray-500"
  />
</View>
```

### 列表项（清晰分隔、大字体）

```tsx
<View className="bg-white rounded-xl p-4 mb-3 border-b-2 border-gray-200">
  <View className="flex justify-between items-center mb-2">
    <Text className="block text-lg font-semibold text-gray-900">
      王大勇
    </Text>
    <Text className="block text-lg font-bold text-orange-500">
      ¥ 350.00
    </Text>
  </View>
  <View className="flex flex-col gap-1">
    <Text className="block text-base text-gray-700">
      购买龙虾饲料 50 斤
    </Text>
    <Text className="block text-sm text-gray-600">
      2024-01-15 | 138-8888-8888
    </Text>
  </View>
</View>
```

### 语音输入按钮（显眼、易操作）

```tsx
<View className="flex justify-center py-6">
  <View className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
    <View className="text-center">
      <Text className="block text-white text-2xl">🎤</Text>
      <Text className="block text-white text-sm mt-2">点击说话</Text>
    </View>
  </View>
</View>
```

### 图片上传区域（清晰提示）

```tsx
<View className="bg-gray-100 rounded-2xl p-6 border-2 border-dashed border-gray-400">
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
```

## 导航结构

### 页面配置

**首页（账单列表）**
- 标题：电子账本
- 顶部：添加按钮（+）
- 内容：账单列表
- 底部：统计信息

**新增账单页**
- 标题：新增账单
- 内容：表单 + 语音输入 + 图片上传
- 底部：提交按钮

**账单详情页**
- 标题：账单详情
- 内容：完整信息 + 图片展示
- 底部：编辑/删除按钮

### 页面注册

```typescript
// src/app.config.ts
export default defineAppConfig({
  pages: [
    'pages/index/index',        // 首页（账单列表）
    'pages/add/index',          // 新增账单
    'pages/detail/index'        // 账单详情
  ],
  window: {
    navigationBarBackgroundColor: '#f97316', // 橙色导航栏
    navigationBarTitleText: '电子账本',
    navigationBarTextStyle: 'white'
  }
})
```

## 特殊场景设计

### 空状态（引导用户）

```tsx
<View className="flex flex-col items-center justify-center h-96">
  <Text className="text-6xl mb-4">📋</Text>
  <Text className="block text-lg text-gray-700 font-semibold mb-2">
    暂无账单记录
  </Text>
  <Text className="block text-base text-gray-600 text-center mb-6">
    点击下方"新增账单"开始记录
  </Text>
  <View className="bg-orange-500 rounded-xl px-8 py-4">
    <Text className="block text-white text-base font-semibold">
      新增账单
    </Text>
  </View>
</View>
```

### 加载状态（明确提示）

```tsx
<View className="flex items-center justify-center p-6">
  <Text className="block text-base text-gray-700">
    正在加载...
  </Text>
</View>
```

### 错误状态（清晰提示 + 重试）

```tsx
<View className="flex flex-col items-center justify-center p-6">
  <Text className="text-5xl mb-4">❌</Text>
  <Text className="block text-lg text-gray-700 font-semibold mb-2">
    加载失败
  </Text>
  <Text className="block text-base text-gray-600 text-center mb-4">
    请检查网络后重试
  </Text>
  <View className="bg-blue-500 rounded-xl px-8 py-4">
    <Text className="block text-white text-base font-semibold">
      重新加载
    </Text>
  </View>
</View>
```

### 语音录制状态（实时反馈）

```tsx
<View className="flex flex-col items-center py-6">
  <View className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
    <View className="text-center">
      <Text className="block text-white text-2xl">🔴</Text>
      <Text className="block text-white text-sm mt-2">正在录音...</Text>
    </View>
  </View>
  <Text className="block text-base text-gray-700 mt-4">
    请清晰说出：客户姓名、电话、金额、商品
  </Text>
  <Text className="block text-sm text-gray-500 mt-2">
    例如："王大勇，电话13888888888，买了350元龙虾饲料"
  </Text>
</View>
```

## 小程序约束与优化

### 包体积优化
- 图片使用 WebP 格式
- 按需引入图标
- 压缩静态资源

### 性能优化
- 列表虚拟滚动
- 图片懒加载
- 防抖节流处理

### 语音识别降级方案
- 小程序端：使用 Taro.getRecorderManager()
- H5 端：显示"暂不支持录音，请使用文字输入"提示
- 必须提供文本输入作为备选方案

### 图片优化
- 压缩上传（限制 2MB）
- WebP 格式优先
- 懒加载展示

## 关键设计原则

1. **大字体优先**：正文不少于 16px，标题不少于 18px
2. **高对比度**：文字与背景对比度至少 4.5:1
3. **大按钮区域**：最小点击区域 44×44px
4. **清晰提示**：每个操作都有明确反馈
5. **简单流程**：核心功能不超过 3 步完成
6. **容错设计**：提供撤销、编辑功能
7. **语音辅助**：重要功能支持语音输入
8. **图片留痕**：支持凭证图片上传和查看

## 跨端兼容性注意

- Input 组件必须用 View 包裹（H5 兼容）
- Text 垂直排列时添加 `block` 类（H5 兼容）
- Fixed + Flex 使用 inline style（H5 兼容）
- 录音功能必须检测平台 `Taro.getEnv() === Taro.ENV_TYPE.WEAPP`
