# GitHub 自动部署准备

这个项目是 Vite 静态站点，部署流程如下。

```text
merge / push 到 main
        ↓
GitHub Actions 执行 npm ci
        ↓
执行 npm run build
        ↓
通过 SSH + rsync 上传 dist/
        ↓
Nginx 提供网站和 Vue Router 回退
```

## 1. 阿里云安全组

在 ECS 实例对应的安全组中添加入方向规则。

| 协议 | 端口 | 来源 |
| --- | --- | --- |
| TCP | 22 | 你的固定 IP，临时测试可用 `0.0.0.0/0` |
| TCP | 80 | `0.0.0.0/0` |
| TCP | 443 | 使用域名和 HTTPS 时添加 |

服务器系统按 Ubuntu 24.04 配置。网站使用 Nginx 提供静态文件，不需要在公网暴露 Vite 开发服务器端口 5173。

## 2. 配置 Ubuntu 24.04 服务器

在本地生成专门给 GitHub Actions 使用的密钥。不要复用个人登录服务器的私钥。

```bash
ssh-keygen -t ed25519 -C "github-actions-bibaidebai" -f ~/.ssh/bibaidebai_deploy
```

把初始化脚本复制到服务器，然后用 root 或具有 sudo 权限的账号执行。公钥可以作为脚本参数传入。

```bash
scp deploy/ubuntu-setup.sh root@101.132.178.161:/tmp/ubuntu-setup.sh
ssh root@101.132.178.161
bash /tmp/ubuntu-setup.sh 'ssh-ed25519 AAAA... github-actions-bibaidebai'
```

脚本会完成以下工作。

- 安装 Nginx 和 rsync
- 创建 `deploy` 用户
- 配置 GitHub Actions 的 SSH 公钥
- 创建 `/var/www/bibaidebai`
- 配置 Nginx 和 Vue Router 回退
- 启用并重新加载 Nginx

首次验证 SSH 密钥。

```bash
ssh -i ~/.ssh/bibaidebai_deploy deploy@101.132.178.161
```

## 3. 配置 GitHub Secrets

在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加以下 Secrets。

| 名称 | 内容 |
| --- | --- |
| `DEPLOY_HOST` | `101.132.178.161` |
| `DEPLOY_USER` | `deploy` |
| `DEPLOY_PATH` | `/var/www/bibaidebai` |
| `DEPLOY_SSH_KEY` | `~/.ssh/bibaidebai_deploy` 私钥全文 |

`DEPLOY_SSH_KEY` 只放在 GitHub Secret 中，不提交到仓库。

## 4. 把本地项目推送到 GitHub

当前 GitHub 仓库 `https://github.com/baibaidebai/Blog` 已创建，但目前为空。请在项目目录执行。

```bash
git init
git add .
git commit -m "chore: prepare website deployment"
git branch -M main
git remote add origin https://github.com/baibaidebai/Blog.git
git push -u origin main
```

仓库中的 `.github/workflows/deploy.yml` 会在推送后自动运行。以后每次合并到 `main`，GitHub Actions 会自动构建并更新服务器网站。

## 5. 检查部署

在 GitHub 仓库的 Actions 页面查看 `Deploy website` 工作流。成功后访问。

```text
http://101.132.178.161
```
