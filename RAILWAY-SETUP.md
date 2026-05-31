# Railway 部署手把手（她在美国的场景）

按顺序做，大约 **30–45 分钟**。做完后你会得到一个 `https://xxxx.up.railway.app` 链接发给她。

---

## 第 0 步：准备访问密码（先想好）

想一个 **只有你们知道** 的长密码，例如：`PigPrep2026!HerName`

后面在 Railway 里填到 `APP_PASSWORD`。她打开链接时浏览器会要：

- 用户名：`piggy`（默认，可改）
- 密码：你设的这个

---

## 第 1 步：把代码放到 GitHub

Railway 从 GitHub **拉代码并自动部署**，不是「打开 github.com 就能练题」。

### 1.1 注册 / 登录 GitHub

打开 https://github.com ，没有账号就注册。

### 1.2 新建一个 **私有** 仓库

1. 右上角 **+** → **New repository**
2. Name 填：`piggy-interview-prep`（或你喜欢的名字）
3. 选 **Private**（题库和部署配置不想公开的话）
4. **不要**勾选 “Add a README”（本地已有代码）
5. 点 **Create repository**

记下页面上的仓库地址，类似：

`https://github.com/你的用户名/piggy-interview-prep.git`

### 1.3 在本机 Mac 终端上传代码

打开终端，**逐行**执行（把 `你的用户名` 换成真的）：

```bash
cd /Users/ryan/Documents/pip-interview-prep

git init
git add .
git commit -m "Initial commit: 小猪 interview prep"

git branch -M main
git remote add origin https://github.com/你的用户名/piggy-interview-prep.git
git push -u origin main
```

第一次 `git push` 可能会让你登录 GitHub（浏览器或 token）。

**确认**：刷新 GitHub 仓库页面，应能看到 `Dockerfile`、`web/`、`src/` 等文件夹。  
**不应出现**：`node_modules/`、`prisma/dev.db`、`.env`（已在 `.gitignore` 里）。

---

## 第 2 步：注册 Railway 并连 GitHub

1. 打开 https://railway.app
2. **Login** → 选 **Login with GitHub**
3. 授权 Railway 访问你的 GitHub（允许访问私有仓库，若它询问）

---

## 第 3 步：新建项目并部署

1. 点 **New Project**
2. 选 **Deploy from GitHub repo**
3. 在列表里选 **`piggy-interview-prep`**（若看不到，点 **Configure GitHub App** 给 Railway 开通仓库权限）
4. Railway 会开始 **Build**（用仓库里的 `Dockerfile`，第一次约 **3–8 分钟**）

### 若构建失败

点进 **Deployments** → 看日志。常见原因：

- 没选到正确仓库根目录（本项目的 `Dockerfile` 在根目录，一般不用改）
- GitHub 上代码没推全 → 回到第 1 步检查

---

## 第 4 步：设置环境变量（必做）

在项目里点进 **你的服务**（通常叫 `piggy-interview-prep`）→ **Variables** → **Add Variable**，加这些：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `APP_PASSWORD` | 你在第 0 步设的密码 | **必填**，否则谁都能进 |
| `APP_USER` | `piggy` | 可选，登录用户名 |
| `DATABASE_URL` | `file:/data/dev.db` | 数据库路径，必须和卷一致 |
| `NODE_ENV` | `production` | 生产模式 |

**不要**把 `.env` 文件上传到 GitHub；只在 Railway 网页里填。

加完后 Railway 会 **自动重新部署** 一次。

---

## 第 5 步：挂载 Volume（必做，否则丢进度）

她的练习记录存在 SQLite 文件里，必须放在 **持久盘** 上。

1. 同一服务页面 → **Volumes**（或 Settings 里的 Volume）
2. **Add Volume**
3. **Mount path** 填：`/data`
4. 保存

这和 `DATABASE_URL=file:/data/dev.db` 对应（数据库文件在 `/data/dev.db`）。

---

## 第 6 步：生成公网链接

1. 服务 → **Settings** → **Networking**（或 **Public Networking**）
2. 点 **Generate Domain**
3. 会得到类似：`piggy-interview-prep-production-xxxx.up.railway.app`

这就是 **发给她的网址**（已是 HTTPS）。

---

## 第 7 步：你自己先测一遍

1. 浏览器打开上面的 `https://….up.railway.app`
2. 弹出登录框：
   - 用户名：`piggy`
   - 密码：你设的 `APP_PASSWORD`
3. 应看到 **小猪** 首页（不是空白壳）
4. 点 **练习** → 能加载题目 → 写几句 → **让小猪点评** 能出结果

若 **401 / 一直要密码**：检查 `APP_PASSWORD` 是否填对、是否 redeploy 完成。

若 **页面空白 / 502**：等部署变绿 **Active**，或看 **Deploy Logs**。

---

## 第 8 步：发给她

发微信 / iMessage 即可，例如：

```
小猪面试练习（私密）
链接：https://xxxx.up.railway.app
用户名：piggy
密码：（你设的那个）

题面是英文，界面是中文。用 Chrome 或 Safari 打开就行。
```

她在美国，用这个 `.up.railway.app` 地址一般速度没问题。

---

## 费用与限额（建议做）

1. Railway 左下角 **Account** → **Billing**
2. 设 **Usage limit**（例如 $10/月），避免意外超支
3. 这种单用户小应用，多数月份大约 **$5–15**

---

## 以后你改代码怎么更新？

本机改完后：

```bash
cd /Users/ryan/Documents/pip-interview-prep
git add .
git commit -m "描述你改了什么"
git push
```

Railway 会自动重新构建部署；**Volume 里的她的进度会保留**。

若要更新题库：改 `src/seedData.ts` 后 push，容器启动时会 `seed`（upsert，不会重复插坏）。

---

## 可选：真 AI 点评

在 Railway Variables 再加（二选一）：

- `OPENAI_API_KEY` = `sk-...`
- 或 `ANTHROPIC_API_KEY` = `sk-ant-...`

不填则继续用免费的本地 rubric 评分（已经能用）。

---

## 清单（打勾自检）

- [ ] GitHub 私有仓库已有代码
- [ ] Railway 部署状态 **Success / Active**
- [ ] `APP_PASSWORD` 已设置
- [ ] Volume 挂在 `/data`
- [ ] `DATABASE_URL=file:/data/dev.db`
- [ ] 已生成 Public Domain
- [ ] 自己用链接+密码登录成功
- [ ] 已发她链接、用户名、密码
