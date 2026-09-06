#!/usr/bin/env node

/**
 * sync-wiki.mjs
 *
 * Synchronizes Hermes Chat App OKF documentation to GitHub Wiki.
 *
 * Requirements:
 * - Arguments: --source <dir> (default: documentation), --target <dir> (default: wiki-dist),
 *   --repo <owner/repo> (default: cfassoni/hermes-chat-app), --dry-run
 * - Ignores .obsidian and hidden directories.
 * - Copies documentation/index.md as Home.md in target root.
 * - Copies all markdown files preserving directory structure.
 * - Copies static assets (assets/).
 * - Generates clean _Sidebar.md from documentation catalog.
 * - Generates clean _Footer.md.
 * - Transforms relative links targeting files outside documentation/ to GitHub repository URLs.
 * - Prunes obsolete files in target directory while preserving .git.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

// Parse CLI arguments
const { values } = parseArgs({
  options: {
    source: {
      type: 'string',
      default: 'documentation',
    },
    target: {
      type: 'string',
      default: 'wiki-dist',
    },
    repo: {
      type: 'string',
      default: 'cfassoni/hermes-chat-app',
    },
    'dry-run': {
      type: 'boolean',
      default: false,
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false,
    },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Hermes Wiki Documentation Sync

Usage:
  node scripts/sync-wiki.mjs [options]

Options:
  --source <dir>       Source documentation directory (default: documentation)
  --target <dir>       Target wiki directory (default: wiki-dist)
  --repo <owner/repo>  GitHub repository (default: cfassoni/hermes-chat-app)
  --dry-run            Simulate operations without modifying filesystem
  -h, --help           Show this help message
`);
  process.exit(0);
}

const sourceDir = path.resolve(process.cwd(), values.source);
const targetDir = path.resolve(process.cwd(), values.target);
const repo = values.repo;
const dryRun = Boolean(values['dry-run']);

// Locate repository root
let projectRoot = process.cwd();
const parentGit = path.join(path.resolve(sourceDir, '..'), '.git');
if (fs.existsSync(parentGit)) {
  projectRoot = path.resolve(sourceDir, '..');
}

/**
 * Recursively scans source directory for files, ignoring hidden files and directories.
 */
function scanSource(dir, relativeBase = '') {
  const items = [];
  if (!fs.existsSync(dir)) {
    throw new Error(`Source directory does not exist: ${dir}`);
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    // Ignore .obsidian and any hidden files/directories
    if (entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativeBase, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      items.push(...scanSource(fullPath, relPath));
    } else if (entry.isFile()) {
      items.push({
        fullPath,
        relPath,
        isMarkdown: entry.name.endsWith('.md'),
      });
    }
  }

  return items;
}

/**
 * Transforms markdown links in a file:
 * - Relative links pointing outside sourceDir -> GitHub repo URL
 * - Relative links pointing to index.md -> Home.md
 */
function transformMarkdownLinks(content, fileRelPath) {
  const lines = content.split('\n');
  let inCodeBlock = false;

  const linkRegex = /(!?\[(?:\\.|[^\]])*?\])\(\s*(<[^>]+>|[^)\s]+)(?:\s+((?:'[^']*'|"[^"]*"|\([^)]*\))))?\s*\)/g;

  const processedLines = lines.map((line) => {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) {
      return line;
    }

    return line.replace(linkRegex, (match, prefix, rawDest, titlePart) => {
      let dest = rawDest;
      const isAngleBracket = dest.startsWith('<') && dest.endsWith('>');
      if (isAngleBracket) {
        dest = dest.slice(1, -1);
      }

      // Preserve external URLs, protocols, and anchors
      if (/^[a-z][a-z0-9+.-]*:/i.test(dest) || dest.startsWith('#')) {
        return match;
      }

      const [pathWithQuery, ...hashParts] = dest.split('#');
      const hash = hashParts.length ? '#' + hashParts.join('#') : '';
      const [cleanPath, ...queryParts] = pathWithQuery.split('?');
      const query = queryParts.length ? '?' + queryParts.join('?') : '';

      if (!cleanPath) {
        return match;
      }

      const fileDir = path.dirname(path.join(sourceDir, fileRelPath));
      const resolved = path.resolve(fileDir, cleanPath);

      // Check if target is outside source directory
      const relToSource = path.relative(sourceDir, resolved);
      const isOutsideSource = relToSource.startsWith('..') || path.isAbsolute(relToSource);

      let newDest = dest;

      if (isOutsideSource) {
        const relToProject = path.relative(projectRoot, resolved).replace(/\\/g, '/');
        let isDir = cleanPath.endsWith('/');
        if (!isDir && fs.existsSync(resolved)) {
          try {
            isDir = fs.statSync(resolved).isDirectory();
          } catch {
            // Default to blob if stat fails
          }
        }
        const treeOrBlob = isDir ? 'tree' : 'blob';
        newDest = `https://github.com/${repo}/${treeOrBlob}/main/${relToProject}${query}${hash}`;
      } else {
        // Inside source directory: check if referencing index.md
        if (resolved === path.join(sourceDir, 'index.md')) {
          const targetRelFile = fileRelPath === 'index.md' ? 'Home.md' : fileRelPath;
          const targetFileDir = path.dirname(path.join(targetDir, targetRelFile));
          const targetHome = path.join(targetDir, 'Home.md');
          const relToHome = path.relative(targetFileDir, targetHome).replace(/\\/g, '/');
          newDest = `${relToHome}${query}${hash}`;
        }
      }

      const formattedDest = isAngleBracket ? `<${newDest}>` : newDest;
      const titleSuffix = titlePart ? ` ${titlePart}` : '';
      return `${prefix}(${formattedDest}${titleSuffix})`;
    });
  });

  return processedLines.join('\n');
}

/**
 * Generates _Sidebar.md based on documentation/index.md and directory structure.
 */
function generateSidebar(sourceDir, repo, syncedFiles) {
  const indexPath = path.join(sourceDir, 'index.md');
  const sections = [];

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    const lines = content.split('\n');
    let currentSection = null;

    for (let line of lines) {
      line = line.trim();
      const headingMatch = line.match(/^##\s+(\d+\.\s+)?(.*)$/);
      if (headingMatch) {
        let title = headingMatch[2].replace(/\(`.*?`\)/g, '').trim();
        currentSection = { title, items: [] };
        sections.push(currentSection);
        continue;
      }

      if (!currentSection) continue;

      // Table row: | spec-id | Title | status | [Link](path) |
      const tableMatch = line.match(/^\|\s*`?[^|]+`?\s*\|\s*([^|]+)\s*\|\s*`?[^|]+`?\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|/);
      if (tableMatch) {
        const title = tableMatch[1].trim();
        const dest = tableMatch[3].trim();
        currentSection.items.push({ title, dest });
        continue;
      }

      // List item: - **[Title](dest)** or - [Title](dest)
      const listMatch = line.match(/^-\s+(?:\*\*\[([^\]]+)\]\(([^)]+)\)\*\*|\[([^\]]+)\]\(([^)]+)\))/);
      if (listMatch) {
        const title = (listMatch[1] || listMatch[3]).trim();
        const dest = (listMatch[2] || listMatch[4]).trim();
        currentSection.items.push({ title, dest });
        continue;
      }
    }
  }

  const lines = [
    '### Hermes Chat App',
    '* [Home](Home.md)',
    '',
  ];

  const externalLinks = [
    { title: 'GitHub Repository', dest: `https://github.com/${repo}` },
    { title: 'Project Guidelines (AGENTS.md)', dest: `https://github.com/${repo}/blob/main/AGENTS.md` },
    { title: 'AI Dev Team Personas', dest: `https://github.com/${repo}/blob/main/.agents/personas/README.md` },
  ];

  const documentedDests = new Set(['Home.md']);

  for (const section of sections) {
    const internalDocs = section.items.filter((item) => item.dest.endsWith('.md') && !item.dest.startsWith('..'));
    if (internalDocs.length === 0) continue;

    lines.push(`### ${section.title}`);
    for (const item of internalDocs) {
      documentedDests.add(item.dest);
      lines.push(`* [${item.title}](${item.dest})`);
    }
    lines.push('');
  }

  // Include any synced markdown files that were not listed in index.md
  const unlisted = syncedFiles.filter(
    (f) => f.endsWith('.md') && !documentedDests.has(f) && f !== '_Sidebar.md' && f !== '_Footer.md'
  );
  if (unlisted.length > 0) {
    lines.push('### Additional Documentation');
    for (const file of unlisted) {
      const title = path.basename(file, '.md').replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`* [${title}](${file})`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('### Repository');
  for (const ext of externalLinks) {
    lines.push(`* [${ext.title}](${ext.dest})`);
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates _Footer.md.
 */
function generateFooter() {
  return `Synchronized automatically from the hermes-chat-app repository • Google OKF\n`;
}

/**
 * Recursively cleans files in targetDir that are not present in validFiles,
 * preserving .git and removing empty directories.
 */
function cleanObsoleteFiles(targetDir, validFiles, dryRun) {
  if (!fs.existsSync(targetDir)) return [];

  const removed = [];

  function cleanDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      // Must preserve .git completely
      if (entry.name === '.git') continue;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        cleanDir(fullPath);
        if (!dryRun) {
          const remaining = fs.readdirSync(fullPath);
          if (remaining.length === 0) {
            fs.rmdirSync(fullPath);
          }
        }
      } else {
        const rel = path.relative(targetDir, fullPath).replace(/\\/g, '/');
        if (!validFiles.has(rel)) {
          removed.push(rel);
          if (!dryRun) {
            fs.unlinkSync(fullPath);
          }
        }
      }
    }
  }

  cleanDir(targetDir);
  return removed;
}

/**
 * Main execution
 */
async function main() {
  console.log(`[Hermes Wiki Sync] Starting documentation sync...`);
  console.log(`  Source directory : ${sourceDir}`);
  console.log(`  Target directory : ${targetDir}`);
  console.log(`  Repository       : ${repo}`);
  console.log(`  Dry run mode     : ${dryRun ? 'ENABLED' : 'DISABLED'}`);

  const sourceItems = scanSource(sourceDir);
  console.log(`  Discovered ${sourceItems.length} source files.`);

  const filesToWrite = new Map(); // targetRelPath -> Buffer or string
  const validTargetFiles = new Set();

  for (const item of sourceItems) {
    const targetRelPath = item.relPath === 'index.md' ? 'Home.md' : item.relPath;
    validTargetFiles.add(targetRelPath);

    if (item.isMarkdown) {
      const rawContent = fs.readFileSync(item.fullPath, 'utf8');
      const transformedContent = transformMarkdownLinks(rawContent, item.relPath);
      filesToWrite.set(targetRelPath, transformedContent);
    } else {
      const binaryContent = fs.readFileSync(item.fullPath);
      filesToWrite.set(targetRelPath, binaryContent);
    }
  }

  // Generate _Sidebar.md and _Footer.md
  validTargetFiles.add('_Sidebar.md');
  const sidebarContent = generateSidebar(sourceDir, repo, Array.from(validTargetFiles));
  filesToWrite.set('_Sidebar.md', sidebarContent);

  validTargetFiles.add('_Footer.md');
  const footerContent = generateFooter();
  filesToWrite.set('_Footer.md', footerContent);

  // Write or log planned files
  for (const [relPath, content] of filesToWrite.entries()) {
    const destFullPath = path.join(targetDir, relPath);
    const size = typeof content === 'string' ? Buffer.byteLength(content, 'utf8') : content.length;

    if (dryRun) {
      console.log(`  [dry-run] Would write: ${relPath} (${size} bytes)`);
    } else {
      fs.mkdirSync(path.dirname(destFullPath), { recursive: true });
      fs.writeFileSync(destFullPath, content);
      console.log(`  Wrote: ${relPath} (${size} bytes)`);
    }
  }

  // Clean obsolete files from target directory
  const removed = cleanObsoleteFiles(targetDir, validTargetFiles, dryRun);
  for (const file of removed) {
    if (dryRun) {
      console.log(`  [dry-run] Would prune obsolete file: ${file}`);
    } else {
      console.log(`  Pruned obsolete file: ${file}`);
    }
  }

  console.log(`[Hermes Wiki Sync] Completed successfully.`);
  console.log(`  Total files synced/generated: ${filesToWrite.size}`);
  console.log(`  Total obsolete files pruned: ${removed.length}`);
}

main().catch((err) => {
  console.error(`[Hermes Wiki Sync] Error:`, err);
  process.exit(1);
});
