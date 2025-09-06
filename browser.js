const puppeteer = require('puppeteer');
const config = require('./config');
const { delay, getTimestamp } = require('./helpers');

class BrowserManager {
  constructor(options = {}) {
    this.browser = null;
    this.pages = [];
    this.options = {
      ...config.browserOptions,
      ...options
    };
  }

  /**
   * 启动浏览器
   */
  async launch() {
    if (this.browser) {
      return this.browser;
    }

    console.log(`[${getTimestamp()}] 启动浏览器...`);
    this.browser = await puppeteer.launch(this.options);
    
    // 监听浏览器关闭事件
    this.browser.on('disconnected', () => {
      console.log(`[${getTimestamp()}] 浏览器连接断开`);
      this.browser = null;
      this.pages = [];
    });

    return this.browser;
  }

  /**
   * 获取新页面
   */
  async newPage() {
    if (!this.browser) {
      await this.launch();
    }

    const page = await this.browser.newPage();
    this.pages.push(page);

    // 设置页面超时
    page.setDefaultTimeout(config.crawlerOptions.timeout);
    
    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // 只禁用图片加载，保留样式表以确保动态内容正常渲染
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if(req.resourceType() === 'image' || req.resourceType() === 'font'){
        req.abort();
      } else {
        req.continue();
      }
    });
    
    // 监听页面错误
    page.on('error', (error) => {
      console.error(`[${getTimestamp()}] 页面错误:`, error.message);
    });

    page.on('pageerror', (error) => {
      console.error(`[${getTimestamp()}] 页面脚本错误:`, error.message);
    });

    return page;
  }

  /**
   * 访问页面并分析内容
   * @param {string} url - 目标URL
   * @param {number} retries - 重试次数
   */
  async analyzePage(url, retries = 0) {
    const page = await this.newPage();
    const maxRetries = config.crawlerOptions.maxRetries;

    try {
      console.log(`[${getTimestamp()}] 访问页面: ${url}`);
      
      // 访问页面
      await page.goto(url, config.waitOptions);
      
      // 等待内容加载（更灵活的等待策略）
      try {
        await page.waitForSelector(config.selectors.content, { timeout: 3000 });
      } catch (e) {
        // 如果主内容区域不存在，等待链接
        await page.waitForSelector(config.selectors.documentLinks, { timeout: 2000 });
      }

      // 页面内容提取，包含页面结构特征检测
      const pageData = await page.evaluate((selectors) => {
        const contentElement = document.querySelector(selectors.content);
        const titleElement = document.querySelector(selectors.title);
        const title = titleElement ? titleElement.textContent.trim() : '';
        const content = contentElement ? contentElement.innerHTML : '';
        
        // 检测页面结构特征
        const isDirectoryPage = document.querySelector('.markdown-body .directory') !== null;
        const isContentPage = document.querySelector('.markdown-body .icms-help-docs-content[lang="zh"]') !== null;
        
        return {
          title,
          content,
          url: location.href,
          structureHints: {
            isDirectoryPage,
            isContentPage
          }
        };
      }, config.selectors);

      // 如果没有内容，直接返回未知类型
      if (!pageData.content) {
        pageData.type = 'unknown';
        console.log(`[${getTimestamp()}] 页面分析完成: ${pageData.type} - ${pageData.title}`);
        return pageData;
      }

      // 通过分析内容来判断页面类型
      const analyzedPageData = this.analyzePageContent(pageData);
      console.log(`[${getTimestamp()}] 页面分析完成: ${analyzedPageData.type} - ${analyzedPageData.title}`);
      return analyzedPageData;

    } catch (error) {
      console.error(`[${getTimestamp()}] 访问页面失败: ${url}`, error.message);
      
      if (retries < maxRetries) {
        console.log(`[${getTimestamp()}] 重试 ${retries + 1}/${maxRetries}: ${url}`);
        await delay(config.crawlerOptions.retryDelay * (retries + 1));
        return this.analyzePage(url, retries + 1);
      }
      
      throw error;
    } finally {
      // 关闭页面
      if (page && !page.isClosed()) {
        await page.close();
        const index = this.pages.indexOf(page);
        if (index > -1) {
          this.pages.splice(index, 1);
        }
      }
    }
  }

  /**
   * 基于HTML结构和内容分析页面类型
   * @param {Object} pageData - 基本页面数据
   * @returns {Object} 完整的页面数据
   */
  analyzePageContent(pageData) {
    const MarkdownConverter = require('./converter');
    const converter = new MarkdownConverter();
    
    // 将HTML转换为Markdown
    const markdown = converter.convert(pageData.content, pageData.url);
    
    // 从 Markdown 中提取所有链接
    const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
    const validLinks = [];
    let match;
    let index = 1;
    
    while ((match = linkRegex.exec(markdown)) !== null) {
      const [, text, href] = match;
      
      // 过滤出有效的文档链接（排除导航链接）
      if (text && 
          href && 
          href.includes('document_detail') && 
          href !== pageData.url &&
          !href.startsWith('#') &&
          text.trim() !== '' &&
          // 排除常见的导航指示词
          !this.isNavigationLink(text)) {
        
        validLinks.push({
          text: text.trim(),
          href: href.trim(),
          index: index++
        });
      }
    }
    
    // 优先使用HTML结构特征判断页面类型
    const pageType = this.determinePageTypeWithStructure(pageData, markdown, validLinks);
    
    return {
      ...pageData,
      type: pageType,
      links: pageType === 'catalog' ? validLinks : [],
      markdown: markdown
    };
  }

  /**
   * 判断是否为导航链接
   * @param {string} linkText - 链接文本
   * @returns {boolean}
   */
  isNavigationLink(linkText) {
    const navigationPatterns = [
      /^上一篇[:|：]/,
      /^下一篇[:|：]/,
      /^相关文档/,
      /^参考文档/,
      /^更多信息/,
      /^详情请参见/,
      /具体操作请参见/,
      /具体内容参见/
    ];
    
    return navigationPatterns.some(pattern => pattern.test(linkText.trim()));
  }

  /**
   * 基于HTML结构特征和内容判断页面类型（优先使用HTML结构）
   * @param {Object} pageData - 页面数据，包含structureHints
   * @param {string} markdown - Markdown内容
   * @param {Array} validLinks - 有效链接列表
   * @returns {string} 'catalog' 或 'content'
   */
  determinePageTypeWithStructure(pageData, markdown, validLinks) {
    // 优先检查HTML结构特征（最准确的判断方法）
    if (pageData.structureHints) {
      // 如果包含.markdown-body .directory元素，一定是目录页面
      if (pageData.structureHints.isDirectoryPage) {
        console.log(`[HTML结构] 检测到 .markdown-body .directory 元素，判定为目录页面`);
        return 'catalog';
      }
      
      // 如果包含.markdown-body .icms-help-docs-content[lang="zh"]元素，一定是内容页面
      if (pageData.structureHints.isContentPage) {
        console.log(`[HTML结构] 检测到 .markdown-body .icms-help-docs-content[lang="zh"] 元素，判定为内容页面`);
        return 'content';
      }
    }
    
    // 如果没有明确的HTML结构特征，使用传统的内容分析方法
    console.log(`[HTML结构] 未检测到明确的HTML结构特征，使用内容分析方法`);
    return this.determinePageType(markdown, validLinks);
  }

  /**
   * 智能判断页面类型（基于内容分析）
   * @param {string} markdown - Markdown内容
   * @param {Array} validLinks - 有效链接列表
   * @returns {string} 'catalog' 或 'content'
   */
  determinePageType(markdown, validLinks) {
    // 如果没有有效链接，明显是内容页面
    if (validLinks.length === 0) {
      return 'content';
    }
    
    // 计算内容特征
    const textContent = markdown
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '') // 移除所有链接
      .replace(/#+ /g, '') // 移除标题标记
      .replace(/[\r\n]+/g, ' ') // 合并行
      .trim();
    
    const contentLength = textContent.length;
    const linkCount = validLinks.length;
    
    // 检查是否有大量代码块（内容页面的强指标）
    const codeBlockCount = (markdown.match(/```[\s\S]*?```/g) || []).length +
                          (markdown.match(/`[^`]+`/g) || []).length +
                          (markdown.match(/^\s{4}/gm) || []).length;
    
    // 如果有大量代码或内容很丰富，优先判断为内容页面
    if (codeBlockCount >= 5 || contentLength >= 2000) {
      return 'content';
    }
    
    // 优化1: 如果内容很少（<100字符）且有任何有效链接，很可能是目录页面
    if (contentLength < 100 && linkCount >= 1) {
      return 'catalog';
    }
    
    // 优化2: 如果内容较少且有2个或更多链接，可能是目录页面
    if (contentLength < 300 && linkCount >= 2) {
      return 'catalog';
    }
    
    // 优化3: 如果内容适中但链接较多，可能是目录页面（提高门槛）
    if (contentLength < 800 && linkCount >= 5) {
      return 'catalog';
    }
    
    // 链接密度判断（提高门槛，避免误判内容丰富的页面）
    const linkDensity = contentLength > 0 ? (linkCount * 100) / contentLength : 0;
    if (linkDensity > 2.0 && linkCount >= 3) {
      return 'catalog';
    }
    
    // 检查是否包含目录特征关键词
    const catalogKeywords = [
      '目录', '列表', '导航', '索引', '指南', '概述',
      '分类', '目录列表', '功能列表', '产品', '服务'
    ];
    
    const containsCatalogKeywords = catalogKeywords.some(keyword => 
      markdown.includes(keyword) || validLinks.some(link => link.text.includes(keyword)));
    
    // 如果包含目录关键词且有足够链接（提高门槛）
    if (containsCatalogKeywords && linkCount >= 3 && contentLength < 1000) {
      return 'catalog';
    }
    
    // 检查是否为纯链接列表的类型
    // 如果大部分内容都是列表项目且包含链接
    const listItems = markdown.match(/^\s*[-*+]\s+/gm) || [];
    if (listItems.length >= 3 && linkCount >= listItems.length * 0.7) {
      return 'catalog';
    }
    
    // 特殊情况：如果页面主要由链接组成（提高阈值）
    const linkTextLength = validLinks.reduce((sum, link) => sum + link.text.length, 0);
    const linkTextRatio = contentLength > 0 ? linkTextLength / contentLength : 0;
    if (linkTextRatio > 0.5 && linkCount >= 3 && contentLength < 800) {
      return 'catalog';
    }
    
    // 默认为内容页面
    return 'content';
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      console.log(`[${getTimestamp()}] 关闭浏览器...`);
      
      // 关闭所有页面
      for (const page of this.pages) {
        if (!page.isClosed()) {
          await page.close();
        }
      }
      this.pages = [];
      
      // 关闭浏览器
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 获取浏览器状态
   */
  getStatus() {
    return {
      isLaunched: !!this.browser,
      activePagesCount: this.pages.filter(page => !page.isClosed()).length
    };
  }
}

module.exports = BrowserManager;
