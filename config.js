module.exports = {
  // 默认起始URL
  startUrl: 'https://help.aliyun.com/document_detail/2584339.html',
  
  // 默认输出目录
  outputDir: './output',
  
  // Puppeteer设置
  browserOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-default-browser-check',
      '--mute-audio'
    ]
  },
  
  // 页面等待设置
  waitOptions: {
    waitUntil: 'networkidle0',     // 恢复为网络空闲，确保React内容加载
    timeout: 20000                 // 适当增加超时时间
  },
  
  // 选择器配置
  selectors: {
    content: '.aliyun-docs-content',
    title: 'h1',
    documentLinks: 'a[href*="document_detail"]',
    tocContainer: '.aliyun-docs-toc'
  },
  
  // 爬虫设置
  crawlerOptions: {
    concurrency: 8,    // 提高默认并发数
    timeout: 10000,    // 减少超时时间
    maxRetries: 2,     // 减少重试次数
    retryDelay: 500,   // 减少重试延迟
    maxDepth: 999      // 设置一个很大的默认值，实际上不限制深度
  },
  
  // 文件设置
  fileOptions: {
    encoding: 'utf8',
    stateFile: 'crawler_state.json',
    logFile: 'crawler.log',
    errorFile: 'errors.log'
  },
  
  // Markdown转换设置
  markdownOptions: {
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
  }
};
