const PQueue = require('p-queue').default;
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const BrowserManager = require('./browser');
const MarkdownConverter = require('./converter');
const config = require('./config');
const {
  isCatalogPage,
  isContentPage,
  normalizeUrl,
  ensureDirStructure,
  getNumberedName,
  getNumberedDirName,
  writeMarkdown,
  readState,
  saveState,
  getTimestamp,
  delay
} = require('./helpers');

class AliyunDocsCrawler {
  constructor(options = {}) {
    this.options = {
      startUrl: config.startUrl,
      outputDir: config.outputDir,
      concurrency: config.crawlerOptions.concurrency,
      maxDepth: 999, // 默认不限制深度
      ...options
    };
    
    this.browserManager = new BrowserManager();
    this.converter = new MarkdownConverter();
    this.queue = new PQueue({ concurrency: this.options.concurrency });
    
    // 状态管理
    this.visitedUrls = new Set();
    this.processedCount = 0;
    this.errorCount = 0;
    this.folderStack = [];
    this.currentDepth = 0;
    
    // 日志文件路径
    this.logFile = path.join(this.options.outputDir, config.fileOptions.logFile);
    this.errorFile = path.join(this.options.outputDir, config.fileOptions.errorFile);
  }

  /**
   * 开始爬取
   */
  async start() {
    try {
      console.log(chalk.green(`[${getTimestamp()}] 开始爬取阿里云文档...`));
      console.log(chalk.blue(`起始URL: ${this.options.startUrl}`));
      console.log(chalk.blue(`输出目录: ${path.resolve(this.options.outputDir)}`));
      console.log(chalk.blue(`并发数: ${this.options.concurrency}`));
      
      // 确保输出目录存在
      await ensureDirStructure('', this.options.outputDir);
      
      // 尝试恢复状态
      const savedState = await readState(this.options.outputDir);
      if (savedState) {
        console.log(chalk.yellow(`[${getTimestamp()}] 发现已保存的爬取状态`));
        const resume = await this.askForResume();
        if (resume) {
          this.restoreState(savedState);
        }
      }
      
      // 启动浏览器
      await this.browserManager.launch();
      
      // 添加初始任务
      if (this.visitedUrls.size === 0) {
        this.addToQueue(this.options.startUrl, [], 0);
      }
      
      // 等待所有任务完成
      await this.queue.onIdle();
      
      console.log(chalk.green(`[${getTimestamp()}] 爬取完成!`));
      console.log(chalk.green(`处理页面: ${this.processedCount}`));
      console.log(chalk.green(`错误页面: ${this.errorCount}`));
      
    } catch (error) {
      console.error(chalk.red(`[${getTimestamp()}] 爬取失败:`), error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 添加URL到队列
   * @param {string} url - 目标URL
   * @param {Array} pathStack - 当前路径栈
   * @param {number} depth - 当前深度
   * @param {number} order - 在当前层级的顺序
   */
  addToQueue(url, pathStack = [], depth = 0, order = 1) {
    if (this.visitedUrls.has(url) || depth > this.options.maxDepth) {
      return;
    }
    
    this.visitedUrls.add(url);
    
    this.queue.add(async () => {
      await this.processUrl(url, pathStack, depth, order);
      
      // 定期保存状态
      if (this.processedCount % 10 === 0) {
        await this.saveCurrentState();
      }
    });
  }

  /**
   * 处理单个URL
   * @param {string} url - 目标URL
   * @param {Array} pathStack - 当前路径栈
   * @param {number} depth - 当前深度
   * @param {number} order - 在当前层级的顺序
   */
  async processUrl(url, pathStack, depth, order) {
    try {
      this.log(`处理URL: ${url} (深度: ${depth}, 顺序: ${order})`);
      
      // 分析页面
      const pageData = await this.browserManager.analyzePage(url);
      
      if (isCatalogPage(pageData)) {
        await this.processCatalogPage(pageData, pathStack, depth, order);
      } else if (isContentPage(pageData)) {
        await this.processContentPage(pageData, pathStack, depth, order);
      } else {
        this.logError(`未知页面类型: ${url}`);
      }
      
      this.processedCount++;
      
    } catch (error) {
      this.errorCount++;
      this.logError(`处理URL失败: ${url}`, error);
    }
  }

  /**
   * 处理目录页面（只递归，不保存内容）
   * @param {Object} pageData - 页面数据
   * @param {Array} pathStack - 当前路径栈
   * @param {number} depth - 当前深度
   * @param {number} order - 在当前层级的顺序
   */
  async processCatalogPage(pageData, pathStack, depth, order) {
    this.log(`处理目录页面: ${pageData.title} (${pageData.links.length} 个链接) - 只递归，不保存内容`);
    
    console.log(chalk.blue(`→ [${getTimestamp()}] 目录页面: ${pageData.title} - 发现 ${pageData.links.length} 个链接`));
    
    // 创建目录（用于子页面）
    let newPathStack = pathStack;
    if (pageData.title && depth > 0) {
      const dirName = getNumberedDirName(order, pageData.title);
      newPathStack = [...pathStack, dirName];
      await ensureDirStructure(path.join(...newPathStack), this.options.outputDir);
      console.log(chalk.gray(`  创建目录: ${path.join(...newPathStack)}`));
    }
    
    // 处理链接（只递归，不保存目录页面内容）
    for (let i = 0; i < pageData.links.length; i++) {
      const link = pageData.links[i];
      const linkUrl = normalizeUrl(link.href, pageData.url);
      
      if (linkUrl && !this.visitedUrls.has(linkUrl)) {
        this.addToQueue(linkUrl, newPathStack, depth + 1, i + 1);
        
        // 减少延迟频率和时间，提高效率
        if (i > 0 && i % 10 === 0) {
          await delay(200); // 减少延迟时间
        }
      }
    }
    
    console.log(chalk.green(`✓ [${getTimestamp()}] 目录页面处理完成: ${pageData.title}`));
  }

  /**
   * 处理内容页面
   * @param {Object} pageData - 页面数据
   * @param {Array} pathStack - 当前路径栈
   * @param {number} depth - 当前深度
   * @param {number} order - 在当前层级的顺序
   */
  async processContentPage(pageData, pathStack, depth, order) {
    this.log(`处理内容页面: ${pageData.title}`);
    
    try {
      // 使用已生成的 markdown，只需要添加头部信息
      const documentMarkdown = this.converter.createDocumentFromMarkdown(pageData);
      
      // 生成文件路径
      const fileName = getNumberedName(order, pageData.title);
      const dirPath = pathStack.length > 0 ? path.join(...pathStack) : '';
      const filePath = path.join(dirPath, fileName);
      
      // 写入文件
      const fullPath = await writeMarkdown(filePath, documentMarkdown, this.options.outputDir);
      
      this.log(`保存文件: ${fullPath}`);
      console.log(chalk.green(`✓ [${getTimestamp()}] 已保存: ${pageData.title}`));
      
    } catch (error) {
      this.logError(`保存内容页面失败: ${pageData.title}`, error);
    }
  }

  /**
   * 询问是否恢复状态
   */
  async askForResume() {
    // 在真实应用中，这里应该使用inquirer或类似库来询问用户
    // 为了简化，这里直接返回false，表示不恢复状态
    return false;
  }

  /**
   * 恢复状态
   * @param {Object} state - 保存的状态
   */
  restoreState(state) {
    if (state.visitedUrls) {
      this.visitedUrls = new Set(state.visitedUrls);
    }
    if (state.processedCount) {
      this.processedCount = state.processedCount;
    }
    if (state.errorCount) {
      this.errorCount = state.errorCount;
    }
    
    console.log(chalk.yellow(`[${getTimestamp()}] 已恢复状态: 已处理 ${this.processedCount} 页面`));
  }

  /**
   * 保存当前状态
   */
  async saveCurrentState() {
    const state = {
      visitedUrls: Array.from(this.visitedUrls),
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      timestamp: new Date().toISOString()
    };
    
    await saveState(state, this.options.outputDir);
  }

  /**
   * 记录日志
   * @param {string} message - 日志消息
   */
  log(message) {
    const logMessage = `[${getTimestamp()}] ${message}`;
    console.log(chalk.gray(logMessage));
    
    // 写入日志文件
    fs.appendFile(this.logFile, logMessage + '\n').catch(() => {});
  }

  /**
   * 记录错误日志
   * @param {string} message - 错误消息
   * @param {Error} error - 错误对象
   */
  logError(message, error = null) {
    const errorMessage = error ? `${message}: ${error.message}` : message;
    const logMessage = `[${getTimestamp()}] ERROR: ${errorMessage}`;
    
    console.error(chalk.red(logMessage));
    
    // 写入错误日志文件
    fs.appendFile(this.errorFile, logMessage + '\n').catch(() => {});
  }

  /**
   * 清理资源
   */
  async cleanup() {
    console.log(chalk.blue(`[${getTimestamp()}] 清理资源...`));
    
    // 保存最终状态
    await this.saveCurrentState();
    
    // 关闭浏览器
    await this.browserManager.close();
    
    // 清空队列
    this.queue.clear();
  }

  /**
   * 获取爬虫状态
   */
  getStatus() {
    return {
      processedCount: this.processedCount,
      errorCount: this.errorCount,
      visitedCount: this.visitedUrls.size,
      queueSize: this.queue.size,
      queuePending: this.queue.pending,
      browserStatus: this.browserManager.getStatus()
    };
  }
}

module.exports = AliyunDocsCrawler;
