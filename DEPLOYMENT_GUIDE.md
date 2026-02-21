# 老孔记账本 - 微信小程序部署指南

## ✅ 已完成配置

### 1. AppID 已配置
- **AppID**: `wx044489dfcfd837b5`
- **项目名称**: 老孔记账本
- **描述**: 专为老年人设计的电子记账本

配置文件已更新：
- ✅ `project.config.json` - AppID 和项目信息
- ✅ `src/app.config.ts` - 导航栏标题

---

## 📋 接下来需要完成的步骤

### 步骤1：配置小程序基本信息（5分钟）

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **设置** → **基本设置**
3. 填写以下信息：
   - **小程序名称**: `老孔记账本`
   - **简介**: `专为65岁老年人设计的电子记账本，支持语音记账、智能识别、Excel导出，操作简单，字体清晰。`
   - **服务类目**: `工具` → `效率`
   - **头像**: 建议上传一个简洁的记账本图标

### 步骤2：配置服务器域名（10分钟）

#### 2.1 获取服务器地址
您需要一个后端服务器来托管小程序的API接口。

**选项A：使用云服务器（推荐）**
- 腾讯云CVM：https://cloud.tencent.com/product/cvm
- 阿里云ECS：https://www.aliyun.com/product/ecs
- 价格：约100-200元/月

**选项B：使用Serverless（免运维）**
- 腾讯云Serverless：https://cloud.tencent.com/product/scf
- 按使用量付费，无需管理服务器

#### 2.2 配置合法域名
在微信公众平台，进入 **开发** → **开发管理** → **开发设置** → **服务器域名**，添加：

```
request合法域名: https://your-domain.com
uploadFile合法域名: https://your-domain.com
downloadFile合法域名: https://your-domain.com
```

**注意**：
- 必须是 `https` 开头
- 域名需要备案（大陆服务器）
- 开发阶段可以暂时不配置，使用开发者工具调试

### 步骤3：配置环境变量（5分钟）

在项目根目录创建或修改 `.env` 文件：

```env
# 项目域名（您的后端服务器地址）
PROJECT_DOMAIN=https://your-domain.com

# Supabase 配置（数据库）
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# S3/OSS 配置（对象存储）
S3_ENDPOINT=your-s3-endpoint
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=your-region

# AI 服务配置（LLM）
LLM_API_KEY=your-llm-api-key
LLM_API_URL=your-llm-api-url
```

### 步骤4：部署后端服务（20分钟）

#### 4.1 安装依赖
```bash
cd server
pnpm install
```

#### 4.2 构建项目
```bash
pnpm build
```

#### 4.3 启动服务
```bash
# 开发环境
pnpm start:dev

# 生产环境
pnpm start:prod
```

#### 4.4 使用 PM2 守护进程（推荐）
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start dist/main.js --name "laokong-account"

# 设置开机自启
pm2 startup
pm2 save
```

### 步骤5：配置 Nginx 反向代理（10分钟）

创建 Nginx 配置文件 `/etc/nginx/sites-available/laokong-account`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置并重启 Nginx：
```bash
sudo ln -s /etc/nginx/sites-available/laokong-account /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤6：配置 SSL 证书（HTTPS 必须，15分钟）

#### 使用 Let's Encrypt 免费证书：
```bash
sudo apt-get install certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 步骤7：构建小程序代码（5分钟）

在项目根目录执行：

```bash
# 构建小程序
pnpm build:weapp

# 生成的文件在 dist 目录
```

### 步骤8：上传代码到微信（5分钟）

1. 打开 **微信开发者工具**
2. 选择 **导入项目**
3. 选择项目的 `dist` 目录
4. 填入 AppID：`wx044489dfcfd837b5`
5. 点击 **导入**

### 步骤9：上传代码版本（2分钟）

1. 在微信开发者工具中，点击右上角 **上传**
2. 填写版本号：`1.0.0`
3. 填写备注：`初始版本上线`
4. 点击 **确定**

### 步骤10：提交审核（2分钟）

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **版本管理**
3. 点击 **开发版本** 的 **提交审核**
4. 填写审核信息
5. 等待审核（通常 1-3 天）

### 步骤11：发布上线（1分钟）

审核通过后，点击 **发布** 即可正式上线！

---

## 🎯 快速开始（开发环境测试）

如果您想先在本地测试，可以使用以下步骤：

### 1. 启动后端服务
```bash
cd /workspace/projects/server
pnpm start:dev
```

### 2. 启动前端开发服务器
```bash
cd /workspace/projects
pnpm dev
```

### 3. 在微信开发者工具中预览
- 导入 `dist` 目录
- AppID：`wx044489dfcfd837b5`
- 点击 **预览** 扫码在手机上测试

---

## 📱 测试清单

在正式发布前，请测试以下功能：

- [ ] 新增账单（手动输入）
- [ ] 新增账单（语音识别）
- [ ] 新增账单（图片识别）
- [ ] 编辑账单
- [ ] 删除账单
- [ ] 查看账单详情
- [ ] 按时间分组查看
- [ ] 按金额排序
- [ ] 按付款状态排序
- [ ] 搜索账单
- [ ] 导出 Excel
- [ ] 打开并分享 Excel
- [ ] 日期筛选
- [ ] 删除后自动刷新

---

## 🔧 常见问题

### Q1: 提示"不在以下 request 合法域名列表中"
**原因**：未配置服务器域名
**解决**：
- 开发阶段：在微信开发者工具中关闭 **详情** → **本地设置** → **不校验合法域名**
- 生产环境：在微信公众平台配置服务器域名

### Q2: 上传图片失败
**原因**：对象存储配置错误
**解决**：检查 `.env` 文件中的 S3/OSS 配置

### Q3: 语音识别失败
**原因**：AI 服务配置错误或网络问题
**解决**：检查 `.env` 文件中的 LLM 配置

### Q4: 导出 Excel 无法打开
**原因**：文件路径问题或权限问题
**解决**：检查 `USER_DATA_PATH` 路径是否正确

### Q5: 审核被驳回
**原因**：内容违规或信息不完整
**解决**：
- 检查小程序名称和描述
- 确保没有违规内容
- 补充完整的服务类目信息

---

## 📞 技术支持

如果您在部署过程中遇到问题，可以：
1. 查看微信开发者工具的 **控制台日志**
2. 查看服务器的 **应用日志**
3. 在 Coze 对话中向我提问

---

## 📝 后续维护

### 代码版本管理
```bash
# 初始化 Git 仓库
git init
git add .
git commit -m "初始版本"

# 推送到 GitHub/GitLab
git remote add origin https://github.com/your-username/laokong-account.git
git push -u origin main
```

### 定期备份
- 数据库：Supabase 有自动备份
- 对象存储：定期导出文件
- 配置文件：备份 `.env` 文件

### 监控和日志
- 使用 Sentry 监控错误
- 查看 PM2 日志：`pm2 logs laokong-account`
- 查看应用日志：`tail -f /path/to/logs/app.log`

---

## 🎉 完成后您将拥有

✅ 一个正式上线的微信小程序
✅ 可在微信中搜索"老孔记账本"
✅ 您父亲可以使用这个电子记账本
✅ 完整的后端服务和数据存储
✅ 持续的维护和更新能力

---

**祝您的记账本上线顺利！有任何问题随时问我！** 🚀
