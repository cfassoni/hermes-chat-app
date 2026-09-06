import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

interface ExecResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

describe("Wiki Sync Pipeline (scripts/sync-wiki.mjs)", () => {
  const trackedTempDirs: string[] = [];
  const scriptPath = path.resolve(process.cwd(), "scripts/sync-wiki.mjs");

  const createTempDir = (prefix = "hermes-wiki-test-"): string => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
    trackedTempDirs.push(tempDir);
    return tempDir;
  };

  const runSyncWiki = (args: string[] = []): ExecResult => {
    const result = spawnSync(process.execPath, [scriptPath, ...args], {
      encoding: "utf-8",
      cwd: process.cwd(),
    });

    return {
      status: result.status,
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    };
  };

  afterEach(() => {
    while (trackedTempDirs.length > 0) {
      const dir = trackedTempDirs.pop();
      if (dir && fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it("should execute with exit code 0 and log expected summary during dry-run", () => {
    const tempDir = createTempDir("wiki-dryrun-");
    const result = runSyncWiki(["--target", tempDir, "--dry-run"]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("[Hermes Wiki Sync] Starting documentation sync...");
    expect(result.stdout).toContain("Dry run mode     : ENABLED");
    expect(result.stdout).toContain("[dry-run] Would write: Home.md");
    expect(result.stdout).toContain("[dry-run] Would write: _Sidebar.md");
    expect(result.stdout).toContain("[dry-run] Would write: _Footer.md");
    expect(result.stdout).toContain("[Hermes Wiki Sync] Completed successfully.");
    expect(result.stdout).toContain("Total files synced/generated:");

    // Verify no files were physically written to disk during dry run
    const filesInTemp = fs.readdirSync(tempDir);
    expect(filesInTemp).toHaveLength(0);
  });

  it("should synchronize documentation to target directory flattening markdown to root and preserving assets", () => {
    const targetDir = createTempDir("wiki-sync-");
    const result = runSyncWiki(["--target", targetDir]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("[Hermes Wiki Sync] Completed successfully.");

    // Verify root files
    expect(fs.existsSync(path.join(targetDir, "Home.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "_Sidebar.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "_Footer.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "backlog.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "log.md"))).toBe(true);

    // Verify root-flattened markdown files
    expect(fs.existsSync(path.join(targetDir, "spec-001-hermes-chat-core.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "sse-streaming-protocol.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "system-topology.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "quality-and-testing-strategy.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "initial-architecture-and-specs.md"))).toBe(true);

    // Verify markdown subdirectories were not created (root flattening)
    expect(fs.existsSync(path.join(targetDir, "specs"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, "architecture"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, "testing"))).toBe(false);
    expect(fs.existsSync(path.join(targetDir, "walkthroughs"))).toBe(false);

    // Verify assets folder and subdirectories ARE preserved
    expect(fs.existsSync(path.join(targetDir, "assets", "mockups", "hermes-chat-desktop-mockup.jpg"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "assets", "mockups", "hermes-chat-mobile-mockup.jpg"))).toBe(true);

    // Verify hidden directories such as .obsidian are not copied
    expect(fs.existsSync(path.join(targetDir, ".obsidian"))).toBe(false);

    // Verify frontmatter was stripped from markdown files
    const homeContent = fs.readFileSync(path.join(targetDir, "Home.md"), "utf-8");
    expect(homeContent).not.toMatch(/^---[\s\S]*?---/);
    expect(homeContent.startsWith("# Hermes Chat App - Knowledge Catalog")).toBe(true);

    const specContent = fs.readFileSync(path.join(targetDir, "spec-001-hermes-chat-core.md"), "utf-8");
    expect(specContent).not.toMatch(/^---[\s\S]*?---/);
    expect(specContent.startsWith("# SPEC-001: Master Specification")).toBe(true);

    const footerContent = fs.readFileSync(path.join(targetDir, "_Footer.md"), "utf-8");
    expect(footerContent).toContain("Synchronized automatically from the hermes-chat-app repository • Google OKF");
  });

  it("should generate _Sidebar.md with clean Gollum slug links without folder prefixes or .md extensions", () => {
    const targetDir = createTempDir("wiki-sidebar-");
    const result = runSyncWiki(["--target", targetDir]);

    expect(result.status).toBe(0);

    const sidebarPath = path.join(targetDir, "_Sidebar.md");
    expect(fs.existsSync(sidebarPath)).toBe(true);

    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

    // Title and Home link
    expect(sidebarContent).toContain("### Hermes Chat App");
    expect(sidebarContent).toContain("* [Home](Home)");

    // Section headings parsed from catalog
    expect(sidebarContent).toContain("### Project Governance & Standards");
    expect(sidebarContent).toContain("### Technical Specifications & RFCs");
    expect(sidebarContent).toContain("### Architecture & Domain Concepts");
    expect(sidebarContent).toContain("### Quality & Testing Strategy");
    expect(sidebarContent).toContain("### Project Walkthroughs");
    expect(sidebarContent).toContain("### Repository");

    // Internal navigation items must use clean slugs without .md or paths
    expect(sidebarContent).toContain("* [Product Backlog & Engineering Roadmap](backlog)");
    expect(sidebarContent).toContain("* [Audit & Change Log](log)");
    expect(sidebarContent).toContain("* [Master Specification & Architectural RFC](spec-001-hermes-chat-core)");
    expect(sidebarContent).toContain("* [System Topology & Multiplatform Architecture](system-topology)");
    expect(sidebarContent).toContain("* [Quality Assurance & Testing Strategy](quality-and-testing-strategy)");
    expect(sidebarContent).toContain("* [Initial Architecture & Specifications Walkthrough](initial-architecture-and-specs)");

    // Ensure no internal links have .md extensions
    expect(sidebarContent).not.toContain("(Home.md)");
    expect(sidebarContent).not.toContain("(backlog.md)");
    expect(sidebarContent).not.toContain("(specs/");

    // Repository links
    expect(sidebarContent).toContain("* [GitHub Repository](https://github.com/cfassoni/hermes-chat-app)");
    expect(sidebarContent).toContain("* [Project Guidelines (AGENTS.md)](https://github.com/cfassoni/hermes-chat-app/blob/main/AGENTS.md)");
    expect(sidebarContent).toContain("* [AI Dev Team Personas](https://github.com/cfassoni/hermes-chat-app/blob/main/.agents/personas/README.md)");
  });

  it("should transform external relative links, normalize internal Gollum slugs, and rewrite asset image links", () => {
    const targetDir = createTempDir("wiki-transform-");
    const testRepo = "custom-owner/custom-hermes-repo";
    const result = runSyncWiki(["--target", targetDir, "--repo", testRepo]);

    expect(result.status).toBe(0);

    const homePath = path.join(targetDir, "Home.md");
    expect(fs.existsSync(homePath)).toBe(true);

    const homeContent = fs.readFileSync(homePath, "utf-8");

    // Verify external relative links pointing outside source directory are converted to GitHub repository URLs
    expect(homeContent).toContain(`https://github.com/${testRepo}/blob/main/AGENTS.md`);
    expect(homeContent).toContain(`https://github.com/${testRepo}/blob/main/.agents/personas/README.md`);

    // Verify raw external relative paths are no longer present
    expect(homeContent).not.toContain("](..//AGENTS.md)");
    expect(homeContent).not.toContain("](../AGENTS.md)");
    expect(homeContent).not.toContain("](../.agents/personas/README.md)");

    // Verify internal markdown links are converted to clean slugs
    expect(homeContent).toContain("[Product Backlog & Engineering Roadmap](backlog)");
    expect(homeContent).toContain("[SPEC-001](spec-001-hermes-chat-core)");
    expect(homeContent).toContain("[System Topology](system-topology)");

    // Verify image links and asset links in documents
    const responsivePath = path.join(targetDir, "responsive-layout.md");
    expect(fs.existsSync(responsivePath)).toBe(true);
    const responsiveContent = fs.readFileSync(responsivePath, "utf-8");

    // Image links point to raw github usercontent
    expect(responsiveContent).toContain(
      `![Desktop Mockup](https://raw.githubusercontent.com/${testRepo}/main/documentation/assets/mockups/hermes-chat-desktop-mockup.jpg)`
    );
    expect(responsiveContent).toContain(
      `![Mobile Mockup](https://raw.githubusercontent.com/${testRepo}/main/documentation/assets/mockups/hermes-chat-mobile-mockup.jpg)`
    );

    // Regular asset link points to GitHub blob
    expect(responsiveContent).toContain(
      `[hermes-chat-desktop-mockup.jpg](https://github.com/${testRepo}/blob/main/documentation/assets/mockups/hermes-chat-desktop-mockup.jpg)`
    );

    // Internal cross-document link inside responsive-layout.md
    expect(responsiveContent).toContain("[System Topology](system-topology)");
  });

  it("should prune obsolete files and empty directories in target directory while preserving .git metadata", () => {
    const targetDir = createTempDir("wiki-prune-");

    // Pre-populate target directory with .git folder and obsolete files/directories
    const gitDir = path.join(targetDir, ".git");
    fs.mkdirSync(gitDir, { recursive: true });
    fs.writeFileSync(path.join(gitDir, "HEAD"), "ref: refs/heads/master\n");

    const obsoleteFile = path.join(targetDir, "obsolete-legacy-document.md");
    fs.writeFileSync(obsoleteFile, "# Obsolete Content");

    const obsoleteSubdir = path.join(targetDir, "legacy-folder");
    fs.mkdirSync(obsoleteSubdir, { recursive: true });
    const obsoleteNestedFile = path.join(obsoleteSubdir, "deprecated-note.txt");
    fs.writeFileSync(obsoleteNestedFile, "Deprecated text");

    const emptyLegacyDir = path.join(targetDir, "empty-legacy-dir");
    fs.mkdirSync(emptyLegacyDir, { recursive: true });

    const result = runSyncWiki(["--target", targetDir]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Pruned obsolete file: obsolete-legacy-document.md");
    expect(result.stdout).toContain("Pruned obsolete file: legacy-folder/deprecated-note.txt");
    expect(result.stdout).toContain("Pruned empty directory: empty-legacy-dir");
    expect(result.stdout).toContain("Pruned empty directory: legacy-folder");

    // Obsolete files and directories must be removed
    expect(fs.existsSync(obsoleteFile)).toBe(false);
    expect(fs.existsSync(obsoleteNestedFile)).toBe(false);
    expect(fs.existsSync(obsoleteSubdir)).toBe(false);
    expect(fs.existsSync(emptyLegacyDir)).toBe(false);

    // .git directory and files must be preserved
    expect(fs.existsSync(gitDir)).toBe(true);
    expect(fs.existsSync(path.join(gitDir, "HEAD"))).toBe(true);
    expect(fs.readFileSync(path.join(gitDir, "HEAD"), "utf-8")).toBe("ref: refs/heads/master\n");
  });
});
