const TurndownService = require('turndown');
const gfm = require('turndown-plugin-gfm');
const { URL } = require('url');
const config = require('./config');

class MarkdownConverter {
  constructor() {
    this.turndownService = new TurndownService({
      ...config.markdownOptions,
      emDelimiter: '*'
    });
    
    // 使用GitHub Flavored Markdown插件
    this.turndownService.use(gfm.gfm);
    
    // 添加自定义规则
    this.addCustomRules();
  }

  /**
   * 添加自定义转换规则
   */
  addCustomRules() {
    // 处理图片 - 将相对URL转换为绝对URL
    this.turndownService.addRule('images', {
      filter: 'img',
      replacement: (content, node, options) => {
        const src = node.getAttribute('src') || '';
        const alt = node.getAttribute('alt') || '';
        const title = node.getAttribute('title') || '';
        
        let absoluteSrc = src;
        if (src && !src.startsWith('http') && !src.startsWith('data:')) {
          try {
            absoluteSrc = new URL(src, 'https://help.aliyun.com').href;
          } catch (e) {
            console.warn(`图片URL转换失败: ${src}`);
          }
        }
        
        const titlePart = title ? ` "${title}"` : '';
        return `![${alt}](${absoluteSrc}${titlePart})`;
      }
    });

    // 处理代码块
    this.turndownService.addRule('codeBlocks', {
      filter: (node) => {
        return node.nodeName === 'PRE' && node.firstChild && node.firstChild.nodeName === 'CODE';
      },
      replacement: (content, node, options) => {
        const codeElement = node.firstChild;
        const className = codeElement.getAttribute('class') || '';
        const language = this.extractLanguageFromClass(className);
        const code = codeElement.textContent || '';
        
        return `\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
      }
    });

    // 处理内联代码
    this.turndownService.addRule('inlineCode', {
      filter: (node) => {
        return node.nodeName === 'CODE' && 
               (!node.parentNode || node.parentNode.nodeName !== 'PRE');
      },
      replacement: (content, node, options) => {
        const code = node.textContent || '';
        return `\`${code}\``;
      }
    });

    // 处理表格
    this.turndownService.addRule('tables', {
      filter: 'table',
      replacement: (content, node, options) => {
        const rows = Array.from(node.querySelectorAll('tr'));
        if (rows.length === 0) return '';
        
        let markdown = '\n';
        
        rows.forEach((row, index) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          const cellContents = cells.map(cell => {
            return (cell.textContent || '').trim().replace(/\|/g, '\\|');
          });
          
          markdown += `| ${cellContents.join(' | ')} |\n`;
          
          // 添加表头分隔符
          if (index === 0 && row.querySelector('th')) {
            const separator = cells.map(() => '---').join(' | ');
            markdown += `| ${separator} |\n`;
          }
        });
        
        return markdown + '\n';
      }
    });

    // 处理链接 - 确保链接指向正确的位置
    this.turndownService.addRule('links', {
      filter: 'a',
      replacement: (content, node, options) => {
        const href = node.getAttribute('href') || '';
        const title = node.getAttribute('title') || '';
        
        if (!href || href === '#') {
          return content;
        }
        
        let absoluteHref = href;
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
          try {
            absoluteHref = new URL(href, 'https://help.aliyun.com').href;
          } catch (e) {
            console.warn(`链接URL转换失败: ${href}`);
          }
        }
        
        const titlePart = title ? ` "${title}"` : '';
        return `[${content}](${absoluteHref}${titlePart})`;
      }
    });

    // 处理引用块
    this.turndownService.addRule('blockquotes', {
      filter: 'blockquote',
      replacement: (content, node, options) => {
        return content.trim().split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
      }
    });

    // 移除不需要的元素
    this.turndownService.remove(['script', 'style', 'nav', 'footer', 'header']);
  }

  /**
   * 从CSS类名中提取编程语言
   * @param {string} className - CSS类名
   * @returns {string}
   */
  extractLanguageFromClass(className) {
    if (!className) return '';
    
    const languages = {
      'javascript': 'javascript',
      'js': 'javascript',
      'typescript': 'typescript',
      'ts': 'typescript',
      'python': 'python',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c++': 'cpp',
      'csharp': 'csharp',
      'c#': 'csharp',
      'php': 'php',
      'ruby': 'ruby',
      'go': 'go',
      'rust': 'rust',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'bash': 'bash',
      'shell': 'bash',
      'sh': 'bash'
    };
    
    const lowerClassName = className.toLowerCase();
    
    for (const [key, value] of Object.entries(languages)) {
      if (lowerClassName.includes(key)) {
        return value;
      }
    }
    
    // 尝试匹配language-xxx或lang-xxx模式
    const match = lowerClassName.match(/(?:language-|lang-)([a-zA-Z0-9+#-]+)/);
    if (match) {
      return match[1];
    }
    
    return '';
  }

  /**
   * 转换HTML为Markdown
   * @param {string} html - HTML内容
   * @param {string} baseUrl - 基础URL，用于解析相对链接
   * @returns {string}
   */
  convert(html, baseUrl = 'https://help.aliyun.com') {
    if (!html || typeof html !== 'string') {
      return '';
    }
    
    try {
      // 预处理HTML - 清理一些问题
      let cleanedHtml = this.preprocessHtml(html, baseUrl);
      
      // 转换为Markdown
      const markdown = this.turndownService.turndown(cleanedHtml);
      
      // 后处理Markdown
      return this.postprocessMarkdown(markdown);
      
    } catch (error) {
      console.error('HTML转换Markdown失败:', error.message);
      return `<!-- 转换失败: ${error.message} -->\n\n${html}`;
    }
  }

  /**
   * 预处理HTML
   * @param {string} html - 原始HTML
   * @param {string} baseUrl - 基础URL
   * @returns {string}
   */
  preprocessHtml(html, baseUrl) {
    return html
      // 移除注释
      .replace(/<!--[\s\S]*?-->/g, '')
      // 移除多余的空白
      .replace(/\s+/g, ' ')
      // 修复破损的HTML标签
      .replace(/<([^>]+)(?<!\/)\s*>/g, (match, tag) => {
        return `<${tag.trim()}>`;
      });
  }

  /**
   * 后处理Markdown
   * @param {string} markdown - 转换后的Markdown
   * @returns {string}
   */
  postprocessMarkdown(markdown) {
    return markdown
      // 移除多余的空行
      .replace(/\n{3,}/g, '\n\n')
      // 确保代码块前后有空行
      .replace(/([^\n])\n```/g, '$1\n\n```')
      .replace(/```\n([^\n])/g, '```\n\n$1')
      // 清理表格格式
      .replace(/\|\s*\|/g, '|')
      // 移除行首行末的空白
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // 确保文档以换行符结尾
      .trim() + '\n';
  }

  /**
   * 从页面数据创建完整的Markdown文档
   * @param {Object} pageData - 页面数据
   * @returns {string}
   */
  createDocument(pageData) {
    let markdown = '';
    
    // 添加标题
    if (pageData.title) {
      markdown += `# ${pageData.title}\n\n`;
    }
    
    // 添加元数据
    markdown += `> 来源: ${pageData.url}\n`;
    markdown += `> 更新时间: ${new Date().toISOString().replace('T', ' ').replace(/\..+/, '')}\n\n`;
    
    // 添加内容
    if (pageData.content) {
      const contentMarkdown = this.convert(pageData.content, pageData.url);
      markdown += contentMarkdown;
    }
    
    return markdown;
  }

  /**
   * 从已生成的Markdown创建完整文档（性能优化版本）
   * @param {Object} pageData - 页面数据（包含 markdown 字段）
   * @returns {string}
   */
  createDocumentFromMarkdown(pageData) {
    let markdown = '';
    
    // 添加标题
    if (pageData.title) {
      markdown += `# ${pageData.title}\n\n`;
    }
    
    // 添加元数据
    markdown += `> 来源: ${pageData.url}\n`;
    markdown += `> 更新时间: ${new Date().toISOString().replace('T', ' ').replace(/\..+/, '')}\n\n`;
    
    // 添加已转换的Markdown内容
    if (pageData.markdown) {
      markdown += pageData.markdown;
    }
    
    return markdown;
  }
}

module.exports = MarkdownConverter;
