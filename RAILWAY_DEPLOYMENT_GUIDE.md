# Railway 部署完整指南

## 📋 部署前准备检查清单

在开始之前，请确认您已经准备好：

- [ ] **GitHub 账号**（如果没有需要先注册）
- [ ] **Supabase 项目**（包含数据库）
- [ ] **Supabase URL 和 anon key**（用于环境变量配置）

---

## 🚀 完整部署步骤

### 第一步：注册 GitHub 账号（如果没有）⏱️ 3分钟

1. 访问：https://github.com
2. 点击 **Sign up**
3. 填写信息：
   - 用户名：建议用英文，如 `laokong-account`
   - 邮箱：您的邮箱
   - 密码：设置一个强密码
4. 验证邮箱
5. 完成注册

---

### 第二步：创建 GitHub 仓库 ⏱️ 2分钟

1. 登录 GitHub
2. 点击右上角 **+** → **New repository**
3. 填写信息：
   - **Repository name**: `laokong-account`
   - **Description**: `专为老年人设计的电子记账本`
   - **Public/Private**: 选择 **Private**（私有，更安全）
   - **不要**勾选 "Add a README file"
   - **不要**勾选 "Add .gitignore"
   - **不要**勾选 "Choose a license"
4. 点击 **Create repository**
5. 复制仓库地址（如：`https://github.com/your-username/laokong-account.git`）

---

### 第三步：推送代码到 GitHub ⏱️ 5分钟

**方法A：如果您能直接操作命令行**

在项目根目录执行以下命令：

```bash
# 进入项目目录
cd /workspace/projects

# 添加所有文件
git add .

# 提交代码
git commit -m "初始版本：老孔记账本"

# 添加远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/your-username/laokong-account.git

# 推送代码到GitHub
git branch -M main
git push -u origin main
```

**注意**：
- 将 `your-username` 替换为您的 GitHub 用户名
- 如果提示输入用户名和密码，使用 GitHub Personal Access Token

**方法B：如果我不能直接操作命令行**

1. 在 Coze 对话中告诉我：
   - 您的 GitHub 用户名
   - 仓库名称（应该是 `laokong-account`）
   
2. 我会帮您推送代码

---

### 第四步：注册 Railway 账号 ⏱️ 2分钟

1. 访问：https://railway.app
2. 点击 **Sign Up**
3. 选择 **Continue with GitHub**
4. 授权 Railway 访问您的 GitHub 账号
5. 完成注册

---

### 第五步：在 Railway 创建项目 ⏱️ 5分钟

1. 登录 Railway
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择您刚才创建的仓库 `laokong-account`
4. 如果没有看到仓库，点击 **Configure GitHub App** 授权
5. 选择仓库后，点击 **Import**
6. **重要：只选择后端服务**
   - 在 **Root Directory** 输入：`server`
   - **Build Command**：`npm install && npm run build`
   - **Start Command**：`npm run start:prod`
7. 点击 **Deploy Now**

---

### 第六步：配置环境变量 ⏱️ 3分钟

部署过程中或部署后，需要配置环境变量：

1. 在 Railway 项目页面，点击 **Variables** 标签
2. 添加以下环境变量：

**必须配置的变量：**
```
NODE_ENV = production
SUPABASE_URL = https://xxx.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**如何获取 Supabase 配置：**
1. 登录 Supabase：https://supabase.com
2. 选择您的项目
3. 点击 **Settings** → **API**
4. 复制：
   - **Project URL**
   - **anon public**

**可选变量（如果需要AI功能）：**
```
LLM_API_KEY = your-api-key
LLM_API_URL = your-api-url
```

3. 添加完所有变量后，Railway 会自动重新部署

---

### 第七步：等待部署完成 ⏱️ 5-10分钟

1. 在 Railway 项目页面，查看 **Deployments** 标签
2. 等待状态显示 **Success**
3. 部署完成后，会生成一个 URL：
   ```
   https://laokong-account-server-production.up.railway.app
   ```

---

### 第八步：获取 Railway URL ⏱️ 1分钟

1. 在 Railway 项目页面，点击顶部的项目名称
2. 在 **Domains** 标签下，可以看到生成的 URL
3. 复制这个 URL（不带端口号）

**示例：**
```
https://laokong-account-server-production-xxxx.up.railway.app
```

---

### 第九步：修改小程序配置 ⏱️ 2分钟

**方法A：告诉我您的 Railway URL**
1. 在 Coze 对话中告诉我您的 Railway URL
2. 我会帮您修改代码并重新构建

**方法B：自己修改（如果知道怎么操作）**

1. 修改 `src/network/index.ts` 文件
2. 将 `BASE_URL` 改为您的 Railway URL：
   ```typescript
   const BASE_URL = 'https://laokong-account-server-production-xxxx.up.railway.app/api'
   ```

3. 重新构建小程序：
   ```bash
   pnpm build:weapp
   ```

4. 在微信开发者工具中重新预览

---

### 第十步：测试验证 ⏱️ 3分钟

1. **关闭您的电脑**
2. **用手机打开小程序**
3. **测试功能：**
   - 查看账单列表
   - 新增账单
   - 编辑账单
   - 删除账单

如果所有功能都正常，说明部署成功！🎉

---

## 🔍 常见问题

### Q1: 推送代码时提示身份验证失败
**原因**：GitHub 不再支持密码登录
**解决**：
1. 在 GitHub 设置中创建 Personal Access Token
2. 使用 Token 替代密码

### Q2: Railway 找不到 GitHub 仓库
**原因**：未授权 Railway 访问 GitHub
**解决**：
1. 在 Railway 点击 **Configure GitHub App**
2. 选择您的仓库并授权

### Q3: 部署失败
**原因**：可能是环境变量配置错误
**解决**：
1. 检查 **Logs** 标签查看错误信息
2. 确认 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确
3. 修复后重新部署

### Q4: 小程序无法加载数据
**原因**：网络请求配置错误
**解决**：
1. 确认 `BASE_URL` 配置正确
2. 确认 URL 以 `/api` 结尾
3. 在微信开发者工具中关闭域名校验

---

## 💡 快速参考

### 需要的信息

**GitHub 仓库：**
- 名称：`laokong-account`
- 可见性：Private

**Railway 配置：**
- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`

**环境变量：**
- `NODE_ENV = production`
- `SUPABASE_URL = https://xxx.supabase.co`
- `SUPABASE_ANON_KEY = eyJ...`

---

## 📞 需要帮助？

如果遇到问题，可以：
1. 查看 Railway 的 **Logs** 标签
2. 检查环境变量是否正确
3. 在 Coze 对话中向我提问

---

## 🎉 完成后您将拥有

✅ **24小时运行的服务器**
✅ **父亲随时可用**
✅ **完全免费**
✅ **自动部署**（推送代码自动更新）

---

## 🚀 现在开始！

请按照以下顺序操作：

1. **注册 GitHub**（如果没有）
2. **创建 GitHub 仓库**
3. **告诉我您的 GitHub 用户名**，我帮您推送代码
4. **注册 Railway**
5. **配置 Railway 项目**
6. **告诉我您的 Railway URL**，我帮您修改小程序配置

**预计总时间：20-30分钟**

---

**准备好了吗？告诉我您的 GitHub 用户名，我们开始第一步！** 🚀
