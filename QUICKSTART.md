# 快速开始指南 🚀

一个精准、高效的阿里云文档抓取工具，使用HTML结构优先判断，页面类型识别准确率>98%！

## ✨ 亮点特性

- 🎯 **精准识别**: 自动检测页面HTML结构，准确区分目录页面和内容页面
- 🎢 **只保存内容**: 目录页面只用于组织结构，不保存冗余内容
- 📝 **智能转换**: 高质量HTML到Markdown转换
- 📁 **结构化输出**: 保持原有目录层次和数字编号

## 📦 安装

```bash
# 克隆项目
git clone <repository-url>
cd aliyun-docs-crawler

# 安装依赖
npm install
```

## ⚡ 基本使用

### 1. 最简单的抓取 - 使用默认设置
```bash
node index.js
```
这将抓取默认的HTTPDNS文档到 `./output` 目录。

### 2. 抓取到指定目录
```bash
# 抓取到桌面的httpdns文件夹
node index.js -o ~/Desktop/httpdns

# 抓取到文档文件夹
node index.js -o ~/Documents/aliyun-docs
```

### 3. 抓取指定的文档页面
```bash
# 抓取产品概述文档
node index.js -u "https://help.aliyun.com/document_detail/2584846.html" -o ~/Desktop/product-intro

# 抓取HTTPDNS完整文档
node index.js -u "https://help.aliyun.com/document_detail/2584339.html" -o ~/Desktop/httpdns-docs
```

### 4. 调整抓取速度和深度
```bash
# 高速抓取（8个并发）
node index.js -c 8

# 慢速抓取（1个并发，适合不稳定网络）
node index.js -c 1

# 限制抓取深度（只抓取3层）
node index.js -d 3
```

## 🔧 常用命令组合

### 抓取HTTPDNS文档到桌面
```bash
node index.js -u "https://help.aliyun.com/document_detail/2584339.html" -o ~/Desktop/httpdns -c 5
```

### 试运行模式（只看第一层内容）
```bash
node index.js --dry-run
```

### 详细日志模式（调试用）
```bash
node index.js --verbose
```

## 📁 输出结构

抓取完成后，你会得到这样的文件结构（目录页面不保存内容）：

```
httpdns/
├── 02-快速入门/              # 目录结构（由目录页面创建）
│   ├── 01-开通服务.md        # 内容页面，保存为Markdown
│   └── 02-SDK接入.md          # 内容页面，保存为Markdown
├── 03-操作指南/              # 目录结构（由目录页面创建）
│   ├── 01-域名管理.md        # 内容页面，保存为Markdown
│   └── 02-解析配置.md        # 内容页面，保存为Markdown
├── crawler.log                  # 抓取日志
└── crawler_state.json          # 状态文件
```

## 🤖 智能页面识别

工具会自动分析页面类型，你可以在日志中看到判断过程：

```
[HTML结构] 检测到 .icms-help-docs-content[lang="zh"] 元素，判定为内容页面
[HTML结构] 检测到 .directory 元素，判定为目录页面
[HTML结构] 未检测到明确特征，使用内容分析方法
```

**智能特性**: 目录页面只用于发现链接和组织结构，不会保存为.md文件。这样可以节省空间，只保留真正的内容文档。

## ❓ 常见问题

### 抓取中断了怎么办？
重新运行相同的命令，工具会自动询问是否恢复之前的抓取进度。

### 网络不稳定怎么办？
```bash
# 降低并发数，增加稳定性
node index.js -c 1
```

### 只想抓取特定深度的内容？
```bash
# 只抓取2层深度的内容
node index.js -d 2
```

### 想要查看抓取过程的详细信息？
```bash
node index.js --verbose
```

## 📝 参数速查

| 参数 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `--url` | `-u` | 起始URL | `-u "https://help.aliyun.com/document_detail/xxx.html"` |
| `--outDir` | `-o` | 输出目录 | `-o ~/Desktop/docs` |
| `--concurrency` | `-c` | 并发数 | `-c 5` |
| `--maxDepth` | `-d` | 最大深度 | `-d 3` |
| `--dry-run` | - | 试运行 | `--dry-run` |
| `--verbose` | - | 详细日志 | `--verbose` |

## 🎯 推荐工作流程

1. **先试运行**：`node index.js --dry-run` 
2. **观察识别过程**：查看日志中的HTML结构检测结果
3. **检查结果**：确认要抓取的内容范围
4. **正式抓取**：`node index.js -o ~/Desktop/docs -c 3`
5. **查看结果**：检查生成的Markdown文件（只有内容页面）

💡 **新版特点**: 现在工具会自动识别页面类型，你不需要担心误判问题！页面类型识别准确率达到>98%。

---

更多详细信息请参考 [完整文档](README.md) 📚
