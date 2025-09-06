# 一键安装指南 🛠️

本指南提供不同系统下的快速安装方法，让你 **5分钟内** 开始使用阿里云文档爬虫！

## 🚀 快速安装（推荐）

### macOS/Linux 用户

```bash
# 1. 克隆项目
git clone https://github.com/YOUR_USERNAME/aliyun-docs-crawler.git
cd aliyun-docs-crawler

# 2. 一键安装并运行示例
npm install && npm run dry-run
```

### Windows 用户

```powershell
# 1. 克隆项目
git clone https://github.com/YOUR_USERNAME/aliyun-docs-crawler.git
cd aliyun-docs-crawler

# 2. 一键安装并运行示例
npm install ; npm run dry-run
```

## 📋 系统要求检查

### 必需环境
- **Node.js**: 16.x 或更高版本 
- **npm**: 7.x 或更高版本
- **Git**: 用于克隆项目

### ✅ 环境检测命令

```bash
# 检查 Node.js 版本（要求 >= 16.x）
node --version

# 检查 npm 版本（要求 >= 7.x）
npm --version

# 检查 Git 版本
git --version
```

## 🔧 详细安装步骤

### 1. 安装 Node.js（如果未安装）

#### macOS (推荐使用 Homebrew)
```bash
# 安装 Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node
```

#### Windows (推荐使用官方安装包)
1. 访问 [Node.js官网](https://nodejs.org/zh-cn/)
2. 下载 LTS 版本
3. 运行安装包，按默认设置安装

#### Ubuntu/Debian Linux
```bash
# 更新包管理器
sudo apt update

# 安装 Node.js
sudo apt install nodejs npm

# 如果版本过低，使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. 克隆和安装项目

```bash
# 克隆项目
git clone https://github.com/YOUR_USERNAME/aliyun-docs-crawler.git
cd aliyun-docs-crawler

# 安装依赖（自动安装所有需要的包）
npm install
```

### 3. 验证安装

```bash
# 运行试验模式，验证一切正常
npm run dry-run
```

如果看到类似以下输出，说明安装成功：

```
🚀 阿里云文档爬虫启动
==================================================
[HTML结构] 检测到 .icms-help-docs-content[lang="zh"] 元素，判定为内容页面
✓ [时间戳] 已保存: 某某文档
```

## 🎯 立即开始使用

安装完成后，你可以：

```bash
# 1. 抓取默认HTTPDNS文档到桌面
node index.js -o ~/Desktop/httpdns

# 2. 抓取到指定目录，使用3个并发
node index.js -o ~/Documents/aliyun-docs -c 3

# 3. 抓取特定文档页面
node index.js -u "https://help.aliyun.com/document_detail/435219.html" -o ~/Desktop/product-intro
```

## ⚠️ 常见问题解决

### Node.js 版本太旧
```bash
# 错误：node version is too old
# 解决：升级Node.js到16.x或更高版本

# 使用 n（Node.js版本管理器）
sudo npm install -g n
sudo n latest
```

### npm 安装失败
```bash
# 错误：npm install failed
# 解决：清除缓存重试

npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 权限问题（Linux/macOS）
```bash
# 错误：permission denied
# 解决：修复npm权限

npm config set prefix ~/npm-global
echo 'export PATH=~/npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Windows 路径问题
```powershell
# 错误：path too long
# 解决：启用长路径支持

# 以管理员身份运行PowerShell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

## 🌟 高级安装选项

### 使用 yarn 替代 npm（可选）
```bash
# 安装 yarn
npm install -g yarn

# 使用 yarn 安装依赖（更快）
yarn install

# 使用 yarn 运行
yarn dry-run
```

### 使用 nvm 管理 Node.js 版本（推荐开发者）
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重启终端或执行
source ~/.bashrc

# 安装并使用项目推荐的 Node.js 版本
nvm install 18.17.0
nvm use 18.17.0

# 设为默认版本
nvm alias default 18.17.0
```

## 🆘 获得帮助

如果遇到问题：

1. **查看日志**: 检查 `crawler.log` 和 `errors.log` 文件
2. **GitHub Issues**: [提交问题](https://github.com/YOUR_USERNAME/aliyun-docs-crawler/issues)
3. **检查文档**: 阅读 [README.md](README.md) 和 [QUICKSTART.md](QUICKSTART.md)

---

安装完成后，建议先阅读 [**快速开始指南**](QUICKSTART.md) 学习基本用法！ 🎉
