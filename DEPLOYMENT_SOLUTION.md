# 小程序报错问题解决方案

## 📋 问题说明

### 报错现象
- 电脑关机后，手机进入小程序会卡住
- 显示网络连接错误
- 无法加载数据

### 原因分析
**当前架构：**
```
手机小程序 → Coze开发服务器 → 数据库
```

**问题：**
- 开发服务器运行在Coze环境中
- 您的电脑关机后，Coze环境停止运行
- 小程序无法连接到服务器，导致报错

---

## 🎯 解决方案

### 方案1：部署到免费云平台（推荐）⭐⭐⭐⭐⭐

**优点：**
- ✅ 服务器24小时运行
- ✅ 父亲随时可用
- ✅ 完全免费
- ✅ 数据安全

**推荐平台：**

#### 1. Railway（最推荐）
- **网址**：https://railway.app
- **免费额度**：$5/月（足够个人使用）
- **优点**：简单易用，支持多种服务
- **部署时间**：5-10分钟

#### 2. Render
- **网址**：https://render.com
- **免费额度**：完全免费
- **缺点**：15分钟不使用会休眠（首次访问需要30秒唤醒）

#### 3. 腾讯云Serverless（国内最佳）
- **网址**：https://cloud.tencent.com/product/scf
- **免费额度**：免费套餐
- **优点**：国内访问速度快
- **缺点**：需要配置

---

## 🚀 快速部署到Railway（推荐）

### 第一步：注册Railway（2分钟）

1. 访问：https://railway.app
2. 点击 **Sign Up**
3. 使用 **GitHub** 账号登录（需要先注册GitHub）

### 第二步：准备代码（3分钟）

如果您还没有GitHub仓库，需要先创建：

1. 注册GitHub：https://github.com
2. 创建新仓库：`laokong-account`
3. 将项目代码推送到GitHub

**推送命令：**
```bash
# 初始化Git仓库
cd /workspace/projects
git init
git add .
git commit -m "初始版本"

# 连接GitHub仓库（替换为您的仓库地址）
git remote add origin https://github.com/your-username/laokong-account.git
git branch -M main
git push -u origin main
```

### 第三步：在Railway创建项目（5分钟）

1. 登录Railway
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择您的GitHub仓库
4. 配置服务：

**配置信息：**
- **Name**: `laokong-account-server`
- **Root Directory**: `server`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:prod`

### 第四步：配置环境变量（3分钟）

1. 在Railway项目页面，点击 **Variables**
2. 添加环境变量：

**必须配置的变量：**
```env
NODE_ENV=production
SUPABASE_URL=你的Supabase URL
SUPABASE_ANON_KEY=你的Supabase anon key
```

**可选的变量（如果需要AI功能）：**
```env
LLM_API_KEY=你的API密钥
LLM_API_URL=你的API地址
```

### 第五步：部署（2分钟）

1. 点击 **Deploy** 按钮
2. 等待部署完成（约2-5分钟）
3. 部署成功后，会得到一个URL，如：
   ```
   https://laokong-account-server-production.up.railway.app
   ```

### 第六步：修改小程序配置（2分钟）

1. 修改 `src/network/index.ts` 中的域名：
   ```typescript
   const BASE_URL = 'https://laokong-account-server-production.up.railway.app/api'
   ```

2. 重新构建小程序：
   ```bash
   pnpm build:weapp
   ```

3. 在微信开发者工具中重新预览

### 第七步：测试验证（1分钟）

1. **关闭电脑**
2. **用手机打开小程序**
3. **验证是否能正常使用**

---

## 💰 费用说明

### Railway
- **免费额度**：$5/月
- **包含内容**：
  - 512MB RAM
  - 1GB磁盘空间
  - 100小时运行时间/月
- **超出后**：$0.000293/GB-hour

### Render
- **完全免费**
- **包含内容**：
  - 512MB RAM
  - 500MB磁盘空间
- **限制**：15分钟无活动会休眠

### 腾讯云Serverless
- **免费套餐**：
  - 每月100万次调用
  - 40万GBs资源使用量
- **超出后**：按使用量付费

---

## 🎉 完成后您将拥有

✅ **24小时运行的服务器**
✅ **父亲随时可用**
✅ **完全免费（或$5/月）**
✅ **数据安全可靠**
✅ **无需管理服务器**

---

## 📞 需要帮助？

如果遇到问题，可以：
1. 查看Railway的部署日志
2. 检查环境变量是否正确
3. 在Coze对话中向我提问

---

## 🔧 常见问题

### Q1: 部署后访问报错
**原因**：环境变量配置错误
**解决**：检查 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确

### Q2: 数据无法加载
**原因**：后端服务未启动
**解决**：在Railway控制台查看服务状态

### Q3: 如何更新代码
**解决**：
1. 修改代码后推送到GitHub
2. Railway会自动检测并重新部署
3. 等待部署完成即可

### Q4: 如何查看日志
**解决**：
1. 进入Railway项目页面
2. 点击 **Logs**
3. 可以查看实时日志

---

## 🎯 总结

**当前问题：**
- ❌ 电脑关机后小程序无法使用
- ❌ 数据无法加载
- ❌ 用户体验差

**解决方案：**
- ✅ 部署到Railway（免费）
- ✅ 24小时运行
- ✅ 父亲随时可用
- ✅ 完全免费或$5/月

**推荐方案：Railway**
- 最简单易用
- 部署时间短
- 免费额度足够
- 适合个人使用

---

**现在就行动！花10-20分钟部署，让父亲24小时都能使用！** 🚀
