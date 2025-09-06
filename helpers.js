const fs = require('fs-extra');
const path = require('path');
const slugify = require('slugify');
const { URL } = require('url');

/**
 * 判断页面是否为目录页面
 * @param {Object} pageData - 页面数据
 * @returns {boolean}
 */
function isCatalogPage(pageData) {
  return pageData.type === 'catalog' && pageData.links && pageData.links.length > 0;
}

/**
 * 判断页面是否为内容页面
 * @param {Object} pageData - 页面数据
 * @returns {boolean}
 */
function isContentPage(pageData) {
  return pageData.type === 'content' && pageData.content;
}

/**
 * 规范化URL
 * @param {string} url - 目标URL
 * @param {string} base - 基础URL
 * @returns {string}
 */
function normalizeUrl(url, base) {
  try {
    if (url.startsWith('http')) {
      return url;
    }
    return new URL(url, base).href;
  } catch (error) {
    console.warn(`URL规范化失败: ${url}`, error.message);
    return url;
  }
}

/**
 * 确保目录结构存在
 * @param {string} dirPath - 目录路径
 * @param {string} outputDir - 输出根目录
 */
async function ensureDirStructure(dirPath, outputDir) {
  const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(outputDir, dirPath);
  await fs.ensureDir(fullPath);
  return fullPath;
}

/**
 * 生成带编号的文件名
 * @param {number} index - 索引号（从1开始）
 * @param {string} title - 标题
 * @returns {string}
 */
function getNumberedName(index, title) {
  if (!title || title.trim() === '') {
    title = `untitled-${Date.now()}`;
  }
  
  // 清理标题，移除特殊字符
  const cleanTitle = slugify(title, {
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
    lower: false,
    strict: false,
    locale: 'zh'
  });
  
  // 确保索引为两位数
  const paddedIndex = index.toString().padStart(2, '0');
  
  return `${paddedIndex}-${cleanTitle}.md`;
}

/**
 * 生成带编号的目录名
 * @param {number} index - 索引号（从1开始）
 * @param {string} title - 目录标题
 * @returns {string}
 */
function getNumberedDirName(index, title) {
  if (!title || title.trim() === '') {
    title = `untitled-dir-${Date.now()}`;
  }
  
  const cleanTitle = slugify(title, {
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
    lower: false,
    strict: false,
    locale: 'zh'
  });
  
  const paddedIndex = index.toString().padStart(2, '0');
  
  return `${paddedIndex}-${cleanTitle}`;
}

/**
 * 写入Markdown文件
 * @param {string} filePath - 文件路径
 * @param {string} content - Markdown内容
 * @param {string} outputDir - 输出根目录
 */
async function writeMarkdown(filePath, content, outputDir) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(outputDir, filePath);
  
  // 确保目录存在
  await fs.ensureDir(path.dirname(fullPath));
  
  // 写入文件
  await fs.writeFile(fullPath, content, 'utf8');
  
  return fullPath;
}

/**
 * 读取状态文件
 * @param {string} outputDir - 输出目录
 * @returns {Object|null}
 */
async function readState(outputDir) {
  const stateFile = path.join(outputDir, 'crawler_state.json');
  
  try {
    const exists = await fs.pathExists(stateFile);
    if (exists) {
      const content = await fs.readFile(stateFile, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn('读取状态文件失败:', error.message);
  }
  
  return null;
}

/**
 * 保存状态文件
 * @param {Object} state - 状态对象
 * @param {string} outputDir - 输出目录
 */
async function saveState(state, outputDir) {
  const stateFile = path.join(outputDir, 'crawler_state.json');
  
  try {
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('保存状态文件失败:', error.message);
  }
}

/**
 * 清理文件名中的非法字符
 * @param {string} filename - 原始文件名
 * @returns {string}
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')  // 替换Windows非法字符
    .replace(/\s+/g, '-')           // 替换空格
    .replace(/-+/g, '-')            // 合并多个连字符
    .replace(/^-|-$/g, '');         // 移除首尾连字符
}

/**
 * 生成日志时间戳
 * @returns {string}
 */
function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').replace(/\..+/, '');
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  isCatalogPage,
  isContentPage,
  normalizeUrl,
  ensureDirStructure,
  getNumberedName,
  getNumberedDirName,
  writeMarkdown,
  readState,
  saveState,
  sanitizeFilename,
  getTimestamp,
  delay
};
