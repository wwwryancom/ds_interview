# 部署指南 — 让异地也能用「小猪」

她不在你身边时，需要把应用部署到 **24 小时在线的服务器**，再发她一个 **HTTPS 链接**（不要发 `localhost`）。

## 数据存在哪里？

| 环境 | 数据库文件 |
| --- | --- |
| 你本机开发 | `pip-interview-prep/prisma/dev.db`（本地文件夹名可不变） |
| Docker / 云部署 | 卷里的 `/data/dev.db`（`DATABASE_URL=file:/data/dev.db`） |

里面是她的：练习笔记、自评、Mock 记录、进度、复习队列。**备份这个文件 = 备份全部进度。**

## 推荐方案 A：Docker（VPS 或家里 NAS）

适合：有一台小云服务器（阿里云 / 腾讯云 / DigitalOcean 等），想要完全掌控数据。

1. 在服务器安装 Docker。
2. 把本项目拷上去，在项目根目录创建 `.env`：

```bash
APP_PASSWORD=给她单独设一个长密码
```

3. 启动：

```bash
docker compose up -d --build
```

4. 浏览器访问：`http://服务器IP:3001`（建议前面再加 **Nginx + HTTPS**，见下）。
5. 把链接和密码发她；浏览器会弹出登录框（用户名默认 `piggy`，密码即 `APP_PASSWORD`）。

升级版本：

```bash
git pull
docker compose up -d --build
```

数据在 `piggy-data` 卷里，不会因为重建容器而丢失。

## 推荐方案 B：Railway（省事、有 HTTPS）

适合：不想自己管 Nginx，快速拿一个 `https://xxx.up.railway.app` 链接。

1. 注册 [Railway](https://railway.app)，新建项目 → **Deploy from GitHub**（先把仓库推到 GitHub）。
2. 选择本仓库，Railway 用根目录 `Dockerfile` 构建。
3. **Variables** 里设置：
   - `APP_PASSWORD` = 她的访问密码（必填，否则链接公开）
   - `APP_USER` = `piggy`（可选）
   - `DATABASE_URL` = `file:/data/dev.db`
4. **Volumes**：挂载路径 `/data`（和 `DATABASE_URL` 一致），否则重启会丢数据。
5. 生成 **Public URL**，把链接 + 账号密码发她。

可选：`OPENAI_API_KEY` 或 `ANTHROPIC_API_KEY` 开启真 AI 点评。

## 发给她之后怎么用？

1. 打开你给的 **https://…** 链接（手机 / 电脑均可）。
2. 输入你设的 **用户名 + 密码**（HTTP Basic Auth，整站私密）。
3. 界面是中文「小猪」，题目内容是英文（贴近真实面试）。
4. 她所有练习都会写在服务器上的 `dev.db`，和你本机那份 **不是同一份库**。

## 本机先验证「生产模式」

```bash
cd pip-interview-prep
npm install
npm run build
APP_PASSWORD=test123 NODE_ENV=production DATABASE_URL="file:./prisma/dev.db" npm run start:prod
```

打开 http://localhost:3001（一个端口同时有页面和 API）。

## HTTPS（强烈建议）

裸 `http://IP:3001` 密码会明文传输。生产环境请：

- Railway：自带 HTTPS。
- 自建 VPS：用 Caddy / Nginx 反代到 `localhost:3001`，申请 Let’s Encrypt 证书。

## 和你本机开发的关系

| | 本机 `npm run dev` | 部署后 |
| --- | --- | --- |
| 她能否访问 | 否（除非同一 Wi‑Fi + 你电脑开着） | 是 |
| 数据位置 | 你 Mac 上的 `prisma/dev.db` | 服务器 `/data/dev.db` |
| 题库更新 | 你改 seed 后 `db:seed` | 重新 deploy + 容器启动时会 seed |

部署后若要同步你本机已练进度，需要把本机 `prisma/dev.db` 拷到服务器卷里（进阶操作，一般不必）。
