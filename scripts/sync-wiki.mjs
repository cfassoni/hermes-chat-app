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
 * - Flattens all markdown files to target root (e.g. index.md -> Home.md, specs/foo.md -> foo.md).
 * - Copies assets preserving subdirectories under assets/.
 * - Strips YAML frontmatter from all markdown files so raw metadata is not rendered.
 * - Transforms internal markdown links to clean Gollum slugs without path prefixes or .md extensions.
 * - Transforms image links to raw GitHub usercontent URLs for reliable rendering.
 * - Transforms relative links pointing outside documentation/ to GitHub repository URLs.
 * - Generates clean _Sidebar.md with slug links and _Footer.md.
 * - Prunes obsolete files and empty directories in target while strictly preserving .git/.
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
 * Strips YAML frontmatter from the beginning of markdown content.
 */
function stripFrontmatter(content) {
  return content.replace(/^\ufeff?---\r?\n[\s\S]*?\r?\n---\r?\n*/, '');
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
 * - Internal markdown links -> clean Gollum slug (Home or [basename-without-ext])
 * - Image links referencing assets -> raw GitHub usercontent URL
 * - Other internal asset references -> GitHub repo blob URL
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

      // Preserve external URLs, protocols, and intra-page anchors
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
      const relToSource = path.relative(sourceDir, resolved).replace(/\\/g, '/');
      const isOutsideSource = relToSource.startsWith('..') || path.isAbsolute(relToSource);
      const isImage = prefix.startsWith('!');

      let newDest = dest;

      if (isOutsideSource) {
        const relToProject = path.relative(projectRoot, resolved).replace(/\\/g, '/');
        if (isImage) {
          newDest = `https://raw.githubusercontent.com/${repo}/main/${relToProject}${query}${hash}`;
        } else {
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
        }
      } else {
        // Target is inside source directory
        if (isImage) {
          // Point image references directly to raw GitHub content for bulletproof rendering in Wiki
          newDest = `https://raw.githubusercontent.com/${repo}/main/documentation/${relToSource}${query}${hash}`;
        } else if (cleanPath.endsWith('.md') || relToSource.endsWith('.md')) {
          // Internal documentation markdown link -> clean Gollum slug
          const isHome = relToSource === 'index.md' || path.basename(relToSource) === 'index.md';
          const slug = isHome ? 'Home' : path.basename(relToSource, '.md');
          newDest = `${slug}${query}${hash}`;
        } else {
          // Non-markdown asset file linked as regular link -> link to repository blob view
          let isDir = cleanPath.endsWith('/');
          if (!isDir && fs.existsSync(resolved)) {
            try {
              isDir = fs.statSync(resolved).isDirectory();
            } catch {
              // Default to blob
            }
          }
          const treeOrBlob = isDir ? 'tree' : 'blob';
          newDest = `https://github.com/${repo}/${treeOrBlob}/main/documentation/${relToSource}${query}${hash}`;
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
 * Generates _Sidebar.md based on documentation/index.md and directory structure
 * using clean slugs without folder prefixes and without .md extensions.
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
    '* [Home](Home)',
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
      const slug = item.dest === 'index.md' ? 'Home' : path.basename(item.dest, '.md');
      documentedDests.add(`${slug}.md`);
      lines.push(`* [${item.title}](${slug})`);
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
      const slug = path.basename(file, '.md');
      const title = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      lines.push(`* [${title}](${slug})`);
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
 * Recursively cleans files and directories in targetDir that are not present in validFiles,
 * strictly preserving .git metadata and removing empty directories.
 */
function cleanObsoleteFiles(targetDir, validFiles, dryRun) {
  if (!fs.existsSync(targetDir)) return { files: [], dirs: [] };

  const removedFiles = [];
  const removedDirs = [];

  function cleanDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    let hasValidChild = false;

    for (const entry of entries) {
      // Must preserve .git completely
      if (entry.name === '.git') {
        hasValidChild = true;
        continue;
      }

      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        const childHasValid = cleanDir(fullPath);
        if (childHasValid) {
          hasValidChild = true;
        } else {
          const rel = path.relative(targetDir, fullPath).replace(/\\/g, '/');
          removedDirs.push(rel);
          if (!dryRun) {
            try {
              fs.rmdirSync(fullPath);
            } catch {
              // Ignore rmdir errors if directory is not empty
            }
          }
        }
      } else {
        const rel = path.relative(targetDir, fullPath).replace(/\\/g, '/');
        if (!validFiles.has(rel)) {
          removedFiles.push(rel);
          if (!dryRun) {
            fs.unlinkSync(fullPath);
          }
        } else {
          hasValidChild = true;
        }
      }
    }

    return hasValidChild;
  }

  cleanDir(targetDir);
  return { files: removedFiles, dirs: removedDirs };
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
  const markdownBasenames = new Map();

  for (const item of sourceItems) {
    let targetRelPath;
    if (item.isMarkdown) {
      const base = item.relPath === 'index.md' ? 'Home.md' : path.basename(item.relPath);
      if (markdownBasenames.has(base)) {
        throw new Error(
          `Collision detected during root flattening: "${item.relPath}" and "${markdownBasenames.get(
            base
          )}" both map to "${base}". Basenames must be unique across documentation.`
        );
      }
      markdownBasenames.set(base, item.relPath);
      targetRelPath = base;
    } else {
      // Preserve relative path for non-markdown assets under target (e.g. assets/...)
      targetRelPath = item.relPath;
    }

    validTargetFiles.add(targetRelPath);

    if (item.isMarkdown) {
      const rawContent = fs.readFileSync(item.fullPath, 'utf8');
      const strippedContent = stripFrontmatter(rawContent);
      const transformedContent = transformMarkdownLinks(strippedContent, item.relPath);
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

  // Clean obsolete files and empty directories from target directory
  const { files: removedFiles, dirs: removedDirs } = cleanObsoleteFiles(targetDir, validTargetFiles, dryRun);
  for (const file of removedFiles) {
    if (dryRun) {
      console.log(`  [dry-run] Would prune obsolete file: ${file}`);
    } else {
      console.log(`  Pruned obsolete file: ${file}`);
    }
  }
  for (const dir of removedDirs) {
    if (dryRun) {
      console.log(`  [dry-run] Would prune empty directory: ${dir}`);
    } else {
      console.log(`  Pruned empty directory: ${dir}`);
    }
  }

  console.log(`[Hermes Wiki Sync] Completed successfully.`);
  console.log(`  Total files synced/generated: ${filesToWrite.size}`);
  console.log(`  Total obsolete files pruned: ${removedFiles.length}`);
  console.log(`  Total empty directories pruned: ${removedDirs.length}`);
}

main().catch((err) => {
  console.error(`[Hermes Wiki Sync] Error:`, err);
  process.exit(1);
});
