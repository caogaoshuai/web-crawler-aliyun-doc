#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const AliyunDocsCrawler = require('./crawler');
const config = require('./config');
const pkg = require('./package.json');

const program = new Command();

program
  .name('aliyun-docs-crawler')
  .description('阿里云官网文档网页抓取工具')
  .version(pkg.version || '1.0.0');

program
  .option('-u, --url <startUrl>', '起始URL', config.startUrl)
  .option('-o, --outDir <outputDir>', '输出目录', config.outputDir)
  .option('-c, --concurrency <number>', '并发数', parseInt, config.crawlerOptions.concurrency)
  .option('-d, --maxDepth <number>', '最大抓取深度', parseInt, 999)
  .option('--headless <boolean>', '无头模式 (true/false)', 'true')
  .option('--dry-run', '试运行模式，只处理第一层链接')
  .option('--verbose', '详细日志模式')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 阿里云文档爬虫启动'));
      console.log(chalk.gray('='.repeat(50)));
      
      // 解析选项
      const crawlerOptions = {
        startUrl: options.url,
        outputDir: path.resolve(options.outDir),
        concurrency: options.concurrency,
        maxDepth: options.dryRun ? 1 : options.maxDepth,
        headless: options.headless === 'true'
      };
      
      // 显示配置信息
      console.log(chalk.blue('📋 爬取配置:'));
      console.log(chalk.gray(`   起始URL: ${crawlerOptions.startUrl}`));
      console.log(chalk.gray(`   输出目录: ${crawlerOptions.outputDir}`));
      console.log(chalk.gray(`   并发数: ${crawlerOptions.concurrency}`));
      console.log(chalk.gray(`   最大深度: ${crawlerOptions.maxDepth}`));
      console.log(chalk.gray(`   无头模式: ${crawlerOptions.headless}`));
      
      if (options.dryRun) {
        console.log(chalk.yellow('⚠️  试运行模式：只会处理第一层链接'));
      }
      
      if (options.verbose) {
        console.log(chalk.yellow('📝 详细日志模式已启用'));
      }
      
      console.log(chalk.gray('='.repeat(50)));
      
      // 创建爬虫实例
      const crawler = new AliyunDocsCrawler(crawlerOptions);
      
      // 设置进程退出处理
      let isShuttingDown = false;
      
      const gracefulShutdown = async (signal) => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        
        console.log(chalk.yellow(`\n🛑 收到 ${signal} 信号，正在优雅关闭...`));
        
        try {
          await crawler.cleanup();
          console.log(chalk.green('✅ 清理完成'));
          process.exit(0);
        } catch (error) {
          console.error(chalk.red('❌ 清理失败:'), error.message);
          process.exit(1);
        }
      };
      
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      
      // 启动爬虫
      await crawler.start();
      
      console.log(chalk.green('🎉 爬取任务完成！'));
      
      // 显示统计信息
      const status = crawler.getStatus();
      console.log(chalk.blue('\n📊 爬取统计:'));
      console.log(chalk.gray(`   处理页面: ${status.processedCount}`));
      console.log(chalk.gray(`   错误页面: ${status.errorCount}`));
      console.log(chalk.gray(`   访问总数: ${status.visitedCount}`));
      
    } catch (error) {
      console.error(chalk.red('❌ 爬取失败:'), error.message);
      
      if (options.verbose) {
        console.error(chalk.red('错误详情:'), error.stack);
      }
      
      process.exit(1);
    }
  });

// 添加示例命令
program
  .command('example')
  .description('显示使用示例')
  .action(() => {
    console.log(chalk.blue('📖 使用示例:\n'));
    
    console.log(chalk.gray('1. 基本用法:'));
    console.log(chalk.green('   node index.js\n'));
    
    console.log(chalk.gray('2. 指定输出目录:'));
    console.log(chalk.green('   node index.js --outDir ~/Documents/aliyun-docs\n'));
    
    console.log(chalk.gray('3. 自定义起始URL和并发数:'));
    console.log(chalk.green('   node index.js --url "https://help.aliyun.com/document_detail/2584339.html" --concurrency 5\n'));
    
    console.log(chalk.gray('4. 试运行模式（只处理第一层）:'));
    console.log(chalk.green('   node index.js --dry-run\n'));
    
    console.log(chalk.gray('5. 显示详细日志:'));
    console.log(chalk.green('   node index.js --verbose\n'));
    
    console.log(chalk.gray('6. 限制抓取深度:'));
    console.log(chalk.green('   node index.js --maxDepth 3\n'));
  });

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('未处理的Promise拒绝:'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('未捕获的异常:'), error.message);
  process.exit(1);
});

// 解析命令行参数
program.parse();

// 如果没有提供任何命令，显示帮助信息
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
