# Railway 修复「总是部署老版本」步骤

按顺序在 Railway 网页上操作，完成后每次 push 到 main 都会自动部署最新代码。

---

## 第一步：打开服务设置

1. 浏览器打开 https://railway.app ，登录。
2. 进入你的项目（有 server、域名 server-production-9812.up.railway.app 的那个）。
3. 点击左侧或中间的 **server** 服务卡片。
4. 在服务内顶部或左侧找到并点击 **Settings**（设置）。

---

## 第二步：检查并修正「来源」

1. 在 Settings 页面找到 **Source** / **Repository** / **Connected Repo** 区域。
2. 确认：
   - **Repository** 为：`kh980407/laokong-account`
   - **Branch** 为：`main`
3. 若有 **Production Branch** 或 **Deploy Branch**，设为 `main`。
4. 找到 **Deploy on push** / **Auto Deploy** / **Watch** 等开关，确保为 **开启**（On）。
5. 若没有该开关，继续第三步「重新连接仓库」。

---

## 第三步：若无「Deploy on push」则重新连接仓库

1. 在同一 Settings 里找到 **Disconnect** / **Unlink repository** / **Remove source**，点击断开当前 GitHub 连接。
2. 断开后，点击 **Connect repository** / **Deploy from GitHub**。
3. 选择仓库：**kh980407/laokong-account**。
4. 选择分支：**main**。
5. 连接时若出现「Deploy on every push」或类似选项，勾选 **是**。
6. 保存。Railway 会重新配置 webhook，之后每次推送到 main 都会触发新部署。

---

## 第四步：设置根目录（重要）

1. 仍在 Settings 中找 **Root Directory** / **Monorepo** / **Service Root**。
2. 若当前为 `server`，改为 **空**（清空输入框）或 `.`，表示使用仓库根目录。
3. 本仓库的构建在根目录执行（nixpacks.toml、pnpm run build:server），必须用根目录才能构建到最新代码。
4. 保存。

---

## 第五步：保存并触发一次新部署

1. 确认上述所有项已保存。
2. 在本地项目根目录执行（或已由助手执行）：
   ```bash
   git commit --allow-empty -m "chore: trigger deploy again"
   git push origin main
   ```
3. 回到 Railway 的 **Deployments** 标签，约 1～2 分钟内应出现一条**新部署**，commit 为刚才的「chore: trigger deploy again」或最新提交。
4. 等该部署状态变为 **Deployment successful** / **ACTIVE**。

---

## 第六步：配置 Coze 相关变量（语音识别、AI 解析必需）

从 Coze 托管迁移到 Railway 自部署后，需在 Railway Variables 中手动添加 Coze 凭证，否则语音识别和 AI 解析会 503/400。

**在 Railway → server → Variables 中添加：**

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `COZE_WORKLOAD_IDENTITY_API_KEY` | Coze 工作负载 API 密钥（必填，语音+AI） | 从 Coze 开发者平台获取 |
| `COZE_INTEGRATION_BASE_URL` | 可选，默认 `https://api.coze.com` | `https://api.coze.com` |
| `COZE_INTEGRATION_MODEL_BASE_URL` | 可选，默认 `https://model.coze.com` | `https://model.coze.com` |
| `PUBLIC_URL` | 临时音频 URL 的域名（建议） | `https://server-production-9812.up.railway.app` |

**获取 COZE_WORKLOAD_IDENTITY_API_KEY：**
- 登录 Coze 开发者平台（https://www.coze.cn 或 https://developer.coze.com）
- 进入「项目 / 应用」→「API 密钥」或「工作负载身份」
- 创建或复制 API Key，填入 Railway Variables

**已有变量（数据库）：**
- `COZE_SUPABASE_URL`、`COZE_SUPABASE_ANON_KEY` 用于账单列表

**可选（图片/音频上传到对象存储）：**
- `COZE_BUCKET_ENDPOINT_URL`、`COZE_BUCKET_NAME` 不配置时，图片上传 503，语音用内存暂存。

---

## 验证

- 新部署成功后，访问或请求：  
  `POST https://server-production-9812.up.railway.app/api/upload/audio-base64`  
  若返回 **400**（如「缺少 audioBase64」）说明新接口已生效，语音上传可用。
- 之后每次执行 `git push origin main`，Railway 都会自动用最新代码部署。
