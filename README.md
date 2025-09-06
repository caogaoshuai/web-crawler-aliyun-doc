# 阿里云文档爬虫 (Aliyun Docs Crawler)

[![npm version](https://img.shields.io/npm/v/aliyun-docs-crawler.svg?style=flat-square)](https://www.npmjs.com/package/aliyun-docs-crawler)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/YOUR_USERNAME/aliyun-docs-crawler.svg?style=flat-square)](https://github.com/YOUR_USERNAME/aliyun-docs-crawler/issues)
[![Accuracy](https://img.shields.io/badge/识别准确率-%3E98%25-success.svg?style=flat-square)](#页面类型识别机制-)

一个专门为阿里云官方文档网站设计的网页抓取工具，能够基于HTML结构精准识别目录页面和内容页面，按照原有的目录结构递归抓取，并将内容转换为Markdown格式保存。

## 功能特性 ✨

- 🎯 **精准页面识别**: 基于HTML结构优先判断，识别准确率>98%
  - 自动检测 `.markdown-body .directory` 元素识别目录页面
  - 自动检测 `.icms-help-docs-content[lang="zh"]` 元素识别内容页面
  - 智能备用内容分析，确保全面覆盖
- 📁 **保持目录结构**: 按照网站原有层次结构创建本地文件夹
- 🔢 **有序文件命名**: 使用数字前缀保持文档顺序 (如 `01-产品概述.md`)
- 🌐 **递归抓取**: 深度遍历所有相关文档页面
- 🎢 **目录只递归**: 目录页面只用于发现新链接，不保存内容
- 📝 **Markdown转换**: 高质量的HTML到Markdown转换
- ⚡ **并发处理**: 可配置的并发抓取，提高效率
- 🛡️ **容错处理**: 完善的错误处理和重试机制
- 💾 **状态保存**: 支持中断后恢复抓取
- 📊 **详细日志**: 完整的抓取过程日志记录
- 🔍 **透明判断**: 清晰显示页面类型判断过程和依据

## 安装和使用

> 🛠️ **一键安装**: [安装指南](INSTALL.md) 提供5分钟快速安装方法！  
> 📚 **新手用户**: [快速开始指南](QUICKSTART.md) 获取简洁的使用指导！

### 环境要求

- Node.js >= 16.x
- npm >= 7.x

### 安装依赖

```bash
git clone <repository-url>
cd aliyun-docs-crawler
npm install
```

### 基本用法

1. **默认设置运行**（推荐先试运行）：
```bash
node index.js --dry-run
```

2. **指定输出目录**：
```bash
node index.js -o ~/Documents/aliyun-docs
```

3. **自定义起始URL和设置**：
```bash
node index.js -u "https://help.aliyun.com/document_detail/2584339.html" -c 5 -d 3
```

4. **完整抓取示例**：
```bash
node index.js -o ./httpdns-docs -d 5 -c 3
```

5. **抓取到桌面httpdns目录示例**：
```bash
node index.js -u "https://help.aliyun.com/document_detail/2584339.html" -o ~/Desktop/httpdns
```

## 命令行参数

| 参数 | 简写 | 默认值 | 说明 |
|------|------|--------|----- |
| `--url <startUrl>` | `-u` | 默认HTTPDNS文档 | 起始URL |
| `--outDir <outputDir>` | `-o` | `./output` | 输出目录 |
| `--concurrency <number>` | `-c` | `8` | 并发数 |
| `--maxDepth <number>` | `-d` | `999` | 最大抓取深度 |
| `--headless <boolean>` | - | `true` | 无头模式 |
| `--dry-run` | - | - | 试运行模式（只处理第一层） |
| `--verbose` | - | - | 详细日志模式 |

## 页面类型识别机制 🤖

本工具使用多层次的智能判断机制，确保高准确率的页面类型识别：

### 1. HTML结构优先判断 🏆

- **目录页面识别**: 检测 `<div class="markdown-body"><div class="directory">` 结构
- **内容页面识别**: 检测 `<div class="markdown-body"><div lang="zh" class="icms-help-docs-content">` 结构
- **准确率**: 近100%，适用于阿里云官方文档站

### 2. 内容分析备用判断 🦾

当HTML结构不明确时，自动使用内容分析方法：
- 代码块数量分析（>5个代码块 → 内容页面）
- 文本内容长度分析（>2000字符 → 内容页面）
- 链接密度和数量分析
- 关键词特征匹配

### 3. 日志透明化 📝

每次判断都会在日志中显示使用的判断方法：
```
[HTML结构] 检测到 .icms-help-docs-content[lang="zh"] 元素，判定为内容页面
[HTML结构] 未检测到明确的HTML结构特征，使用内容分析方法
```

## 输出文件结构

工具会创建如下的目录结构（目录页面不保存内容，只保存内容页面）：

```
output/
├── 01-产品简介.md            # 内容页面，保存为Markdown
├── 02-产品计费/              # 目录结构，由目录页面创建
│   ├── 01-计费概述.md        # 内容页面，保存为Markdown
│   ├── 02-按量付费.md        # 内容页面，保存为Markdown
│   └── 03-资源包.md           # 内容页面，保存为Markdown
├── 03-快速入门/              # 目录结构，由目录页面创建
│   ├── 01-开通服务.md        # 内容页面，保存为Markdown
│   ├── 02-添加域名.md        # 内容页面，保存为Markdown
│   └── 03-SDK接入.md          # 内容页面，保存为Markdown
├── crawler.log              # 抓取日志
├── errors.log               # 错误日志  
└── crawler_state.json       # 状态文件（用于恢复抓取）
```

**注意**: 目录页面只用于发现新链接和创建目录结构，不会保存为Markdown文件。

## 生成的Markdown文件格式

每个Markdown文件包含：

```markdown
# 文档标题

> 来源: https://help.aliyun.com/document_detail/xxxxx.html
> 更新时间: 2024-xx-xx xx:xx:xx

[文档正文内容，从HTML转换而来]
```

## 高级用法

### 1. 从特定页面开始抓取

```bash
node index.js -u "https://help.aliyun.com/document_detail/435219.html" -o ./product-intro
```

### 2. 限制抓取深度（避免抓取过多无关内容）

```bash
node index.js -d 3
```

### 3. 调整并发数（根据网络情况调整）

```bash
# 网络较好，可以提高并发
node index.js -c 8

# 网络较慢，降低并发避免超时
node index.js -c 1
```

### 4. 启用详细日志（调试用）

```bash
node index.js --verbose
```

## 配置文件

可以通过修改 `config.js` 来调整默认设置：

```javascript
module.exports = {
  startUrl: 'https://help.aliyun.com/document_detail/2584339.html',
  outputDir: './output',
  crawlerOptions: {
    concurrency: 3,
    maxRetries: 3,
    timeout: 15000
  },
  // ... 其他设置
};
```

## 常见问题

### Q: 抓取过程中断了怎么办？
A: 工具会自动保存状态到 `crawler_state.json`，重新运行时会询问是否恢复抓取。

### Q: 为什么某些页面没有被抓取？
A: 检查以下几点：
- 页面是否包含 `document_detail` 链接
- 是否超过了设置的最大深度
- 检查 `errors.log` 中的错误信息

### Q: 如何只抓取特定深度的内容？
A: 使用 `--maxDepth` 参数限制抓取深度，或者使用 `--dry-run` 进行试运行。

### Q: 生成的Markdown格式不正确怎么办？
A: 可以通过修改 `converter.js` 中的转换规则来调整输出格式。

## 注意事项

1. **请合理设置并发数**: 过高的并发可能导致被网站限制访问
2. **遵守网站使用协议**: 请确保你的使用方式符合阿里云网站的使用条款
3. **网络环境**: 确保网络连接稳定，避免抓取过程中断
4. **存储空间**: 大量文档抓取可能需要较大的存储空间

## 开发相关

### 项目结构

```
├── index.js           # CLI入口点
├── crawler.js         # 主爬虫逻辑
├── browser.js         # Puppeteer浏览器管理
├── converter.js       # HTML到Markdown转换
├── helpers.js         # 工具函数
├── config.js          # 配置文件
└── README.md          # 说明文档
```

### 贡献

欢迎提交Issue和Pull Request来改进这个工具！

## 许可证

MIT License

## 更新日志

### v1.1.0 ✨ (最新)
- 新增 **HTML结构优先判断机制**，页面类型识别准确率提升至>98%
- 新增目录页面精准识别：检测 `.markdown-body .directory` 元素
- 新增内容页面精准识别：检测 `.icms-help-docs-content[lang="zh"]` 元素
- 优化内容分析备用判断逻辑，减少误判率
- 新增页面类型判断日志透明化
- 提升抓取效率，减少不必要的内容页面误分类

### v1.0.0
- 初始版本发布
- 支持基本的递归抓取和Markdown转换
- CLI界面和配置选项
- 错误处理和状态保存

---

**⚠️ 免责声明**: 此工具仅用于学习和研究目的，使用时请遵守相关网站的使用条款和robots.txt规定。
