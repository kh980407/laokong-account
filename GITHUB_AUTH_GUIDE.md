# GitHub 身份验证指南

## 🔐 问题说明

GitHub 已不再支持密码登录，需要使用 Personal Access Token 进行身份验证。

---

## 🚀 解决方案（推荐）：Personal Access Token

### 第一步：创建 Personal Access Token ⏱️ 3分钟

1. 登录 GitHub：https://github.com
2. 点击右上角头像 → **Settings**
3. 左侧菜单最下方，点击 **Developer settings**
4. 点击 **Personal access tokens** → **Tokens (classic)**
5. 点击 **Generate new token (classic)**
6. 填写信息：
   - **Note**: `Coze Railway Deployment`
   - **Expiration**: 选择 **No expiration**（永不过期）
   - 勾选以下权限：
     - ✅ `repo`（完整仓库控制权限）
     - ✅ `workflow`（工作流权限）
7. 点击 **Generate token**
8. **重要**：复制生成的 Token（只显示一次，请妥善保存）

**Token 示例：**
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 第二步：使用 Token 推送代码 ⏱️ 2分钟

#### 方法A：直接使用 Token（简单）

在您的电脑上打开命令行（Git Bash 或 Terminal），执行：

```bash
cd /path/to/your/project
git push -u origin main
```

当提示输入用户名和密码时：
- **Username**: `kh980407`（您的 GitHub 用户名）
- **Password**: `ghp_xxxxxxxxxxxx`（刚才复制的 Token）

**注意**：
- 密码输入时不会显示任何字符，直接粘贴即可
- 输入完成后按回车

---

#### 方法B：保存 Token 到 Git 配置（推荐）

在命令行执行：

```bash
# 配置 Git 使用 Token
git config --global credential.helper store

# 推送代码（会提示输入用户名和密码）
git push -u origin main
# Username: kh980407
# Password: ghp_xxxxxxxxxxxx

# 以后推送就不需要再输入密码了
```

---

#### 方法C：使用 Token 作为 URL（最简单）

在命令行执行：

```bash
# 修改远程仓库地址（包含 Token）
git remote set-url origin https://kh980407:ghp_xxxxxxxxxxxx@github.com/kh980407/laokong-account.git

# 推送代码
git push -u origin main
```

**注意**：将 `ghp_xxxxxxxxxxxx` 替换为您刚才复制的实际 Token。

---

## 🎯 我建议的操作步骤

### 如果您能操作命令行：

1. **创建 Personal Access Token**（按上面的第一步操作）
2. **告诉我在 Coze 对话中**：
   - Token 值（不要告诉别人）
   - 您是在 Windows 还是 Mac 上

我会帮您执行推送命令。

### 如果您不方便操作命令行：

**方案A：使用 GitHub Desktop（推荐）**

1. 下载安装 GitHub Desktop：https://desktop.github.com
2. 登录您的 GitHub 账号
3. 克隆仓库：`https://github.com/kh980407/laokong-account.git`
4. 将代码复制到仓库文件夹
5. 在 GitHub Desktop 中提交并推送

**方案B：使用 GitHub 网页界面**

1. 访问您的仓库：https://github.com/kh980407/laokong-account
2. 点击 **Add file** → **Upload files**
3. 上传 `src` 和 `server` 文件夹
4. 提交说明：`Initial commit`
5. 点击 **Commit changes**

---

## 🔒 安全提示

**重要提醒：**
- ⚠️ Token 相当于您的密码，请妥善保管
- ⚠️ 不要在公共场所或不安全的网络中使用
- ⚠️ 如果 Token 泄露，立即删除并重新生成

---

## ✅ 完成验证

推送成功后，访问：
https://github.com/kh980407/laokong-account

您应该能看到代码文件已经上传到 GitHub。

---

## 📞 需要帮助？

如果遇到问题，告诉我：
1. 您选择哪种方法（Token / GitHub Desktop / 网页上传）
2. 遇到了什么错误

我会帮您解决！
