# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Development Commands

### Installation and Setup
```bash
# Install dependencies
npm install

# Check Node.js version (requires >= 16.x)
node --version
```

### Running the Crawler
```bash
# Basic usage - crawl default HTTPDNS docs
node index.js

# Dry run mode (process only first layer)
npm run dry-run
# or
node index.js --dry-run

# Custom crawl with specific parameters
node index.js -u "https://help.aliyun.com/document_detail/2584339.html" -o ~/Desktop/httpdns -c 5 -d 3

# Verbose logging for debugging
node index.js --verbose

# Show usage examples
node index.js example
```

### Development Scripts
```bash
# Start with default settings
npm start

# Run example crawl
npm run example

# Basic test (currently just echoes "No tests specified yet")
npm test
```

## Architecture Overview

This is a Node.js-based web crawler specifically designed for Aliyun (阿里云) documentation websites. The system uses Puppeteer for browser automation and implements an intelligent page classification system with >98% accuracy based on HTML structure analysis.

The crawler follows this high-level data flow:
1. **CLI Entry Point** (`index.js`) → parses arguments and orchestrates the crawling process
2. **Crawler Engine** (`crawler.js`) → manages the overall crawling workflow with concurrent processing
3. **Browser Manager** (`browser.js`) → handles Puppeteer instances and page analysis
4. **Content Classification** → uses HTML structure detection to distinguish directory vs. content pages
5. **Markdown Conversion** (`converter.js`) → transforms HTML content to structured Markdown
6. **File System Management** (`helpers.js`) → handles directory creation and state persistence

The architecture emphasizes **directory pages vs. content pages**:
- **Directory pages**: Only used for link discovery and folder structure creation (not saved as .md files)
- **Content pages**: Converted to Markdown and saved with numbered filenames

## Core Components and Relationships

### `AliyunDocsCrawler` (crawler.js)
Main orchestrator class that manages:
- Queue-based concurrent processing using `p-queue`
- State persistence and recovery mechanisms
- Page type routing to directory or content processors
- Progress tracking and logging

### `BrowserManager` (browser.js)
Handles Puppeteer browser lifecycle and page analysis:
- Browser instance management with custom options for stability
- Implements intelligent page classification using HTML structure detection:
  - Detects `.markdown-body .directory` elements for directory pages
  - Detects `.icms-help-docs-content[lang="zh"]` elements for content pages
- Falls back to content analysis when HTML structure is ambiguous
- Request interception to disable images/fonts for performance

### `MarkdownConverter` (converter.js)
Converts HTML to high-quality Markdown:
- Uses `turndown` with GitHub Flavored Markdown support
- Custom rules for code blocks, tables, images, and links
- Handles absolute URL conversion for images and links
- Language detection for syntax highlighting in code blocks

### Page Classification System
The crawler implements a two-tier classification approach:

1. **Primary: HTML Structure Detection** (>98% accuracy)
   - Directory pages: `<div class="markdown-body"><div class="directory">`
   - Content pages: `<div class="markdown-body"><div lang="zh" class="icms-help-docs-content">`

2. **Fallback: Content Analysis**
   - Code block counting (>5 blocks → content page)
   - Text length analysis (>2000 characters → content page)
   - Link density and keyword matching

### State Management and Recovery
- Persistent state saved to `crawler_state.json`
- Tracks visited URLs, processing counts, and error statistics
- Supports graceful shutdown and resumption of interrupted crawls

### File Organization Strategy
- Numbered file/folder naming: `01-filename.md`, `02-folder/`
- Maintains original documentation hierarchy
- Directory pages create folder structure only (no .md files)
- Content pages saved as individual Markdown files with metadata headers

## Dependencies and Libraries

### Core Dependencies
- **`puppeteer`**: Browser automation and page rendering
- **`p-queue`**: Concurrent task processing with rate limiting
- **`turndown`**: HTML to Markdown conversion
- **`commander`**: CLI argument parsing
- **`chalk`**: Terminal output coloring
- **`slugify`**: Safe filename generation
- **`fs-extra`**: Enhanced file system operations

### Configuration
- `config.js` centralizes browser options, selectors, timeouts, and retry logic
- `.nvmrc` specifies Node.js version requirements
- Headless browser mode with optimized Chromium flags for server environments

## Key Files
- `index.js`: CLI entry point with argument parsing
- `crawler.js`: Main crawling logic and queue management
- `browser.js`: Puppeteer browser management and page analysis
- `converter.js`: HTML to Markdown conversion
- `helpers.js`: Utility functions for file operations and state management
- `config.js`: Central configuration for all components

## Environment Requirements
- Node.js >= 16.x
- npm >= 7.x
- Sufficient disk space for crawled content
- Stable internet connection for accessing Aliyun documentation

For detailed usage instructions, see `README.md` and `QUICKSTART.md`.
