# 老孔记账本 - 快速开始指南

## 🎉 恭喜！AppID 已配置成功

**您的AppID**: `wx044489dfcfd837b5`

---

## 🚀 三步快速上线

### 第一步：配置小程序后台（5分钟）

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. **设置** → **基本设置**
3. 填写信息：
   - 名称：`老孔记账本`
   - 简介：`专为老年人设计的电子记账本，支持语音记账、智能识别、Excel导出`
   - 类目：`工具` → `效率`

---

### 第二步：配置服务器（1-2小时）

#### 🅰️ 简单方案：使用 Serverless（免运维）

**推荐指数**：⭐⭐⭐⭐⭐
**适合人群**：不想管理服务器的用户
**费用**：按使用量付费（免费额度）

**步骤**：
1. 注册腾讯云：https://cloud.tencent.com
2. 进入 Serverless 控制台
3. 创建服务，上传代码
4. 获取访问地址

**详细教程**：见 `DEPLOYMENT_GUIDE.md`

---

#### 🅱️ 专业方案：购买云服务器

**推荐指数**：⭐⭐⭐⭐
**适合人群**：有技术基础的用户
**费用**：约 100-200元/月

**推荐服务商**：
- 腾讯云 CVM：https://cloud.tencent.com/product/cvm
- 阿里云 ECS：https://www.aliyun.com/product/ecs

**基本配置**：
- CPU：2核
- 内存：4GB
- 硬盘：40GB
- 系统：Ubuntu 20.04

---

### 第三步：上传代码并发布（10分钟）

#### 1. 构建小程序
```bash
# 在项目根目录执行
pnpm build:weapp
```

#### 2. 打开微信开发者工具
1. 下载安装：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 选择 **导入项目**
3. 选择 `dist` 目录
4. 填入 AppID：`wx044489dfcfd837b5`

#### 3. 上传代码
1. 点击右上角 **上传**
2. 版本号：`1.0.0`
3. 备注：`初始版本上线`
4. 点击确定

#### 4. 提交审核
1. 登录微信公众平台
2. **版本管理** → **开发版本**
3. 点击 **提交审核**
4. 等待审核（1-3天）

#### 5. 发布上线
审核通过后，点击 **发布** 即可！

---

## 📱 测试预览（开发环境）

如果想先在手机上测试，可以：

### 方法1：真机预览
1. 在微信开发者工具中，点击 **预览**
2. 用微信扫描二维码
3. 即可在手机上查看效果

### 方法2：开发版体验
1. 在微信开发者工具中，点击 **预览** → **生成体验版**
2. 分享链接给家人
3. 家长点击链接即可体验

**注意**：开发版体验需要先配置服务器域名

---

## 🔑 环境变量配置

在部署前，需要创建 `.env` 文件：

```env
# 项目域名
PROJECT_DOMAIN=https://your-domain.com

# Supabase 数据库
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# 对象存储
S3_ENDPOINT=your-s3-endpoint
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=your-region

# AI 服务
LLM_API_KEY=your-llm-api-key
LLM_API_URL=your-llm-api-url
```

**如何获取这些配置？**

#### Supabase（免费）
1. 注册：https://supabase.com
2. 创建新项目
3. 在 **Settings** → **API** 中获取 `URL` 和 `anon key`

#### S3 对象存储
可以使用：
- 腾讯云 COS：https://cloud.tencent.com/product/cos
- 阿里云 OSS：https://www.aliyun.com/product/oss
- AWS S3：https://aws.amazon.com/s3/

#### AI 服务
- 豆包 API：https://www.volcengine.com/product/ark
- DeepSeek：https://platform.deepseek.com/

---

## ❓ 常见问题

### Q: 必须买服务器吗？
**A**: 不一定。可以使用 Serverless（免运维），但需要一定的配置。

### Q: 开发阶段可以先不配置服务器吗？
**A**: 可以。在微信开发者工具中，关闭 **详情** → **本地设置** → **不校验合法域名** 即可测试。

### Q: 如何让家人看到小程序？
**A**: 发布后，家人可以在微信搜索"老孔记账本"找到。

### Q: 可以把小程序发给朋友看吗？
**A**: 发布后可以分享小程序链接，朋友点击即可打开。

---

## 📞 需要帮助？

遇到问题随时问我！我会帮您：
- 配置服务器
- 部署代码
- 解决技术问题
- 优化功能

---

## 🎯 下一步行动

1. ✅ AppID 已配置完成
2. ⏭️ 配置小程序后台信息
3. ⏭️ 准备服务器环境
4. ⏭️ 构建并上传代码
5. ⏭️ 提交审核并发布

**祝您的记账本上线顺利！** 🎉
