import { describe, it, expect, beforeEach, vi } from "vitest";
import { App, TFile } from "obsidian";
import { VaultIndexer } from "../src/indexer/vault-indexer";
import {
  createMockVault,
  clearMockVault,
  MockFileConfig,
} from "./helpers/mock-vault";

describe("VaultIndexer", () => {
  let app: App;
  let indexer: VaultIndexer;

  beforeEach(() => {
    app = new App();
    indexer = new VaultIndexer(app);
  });

  describe("Initialization", () => {
    it("should initialize and index all files in vault", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["project", "important"] },
        { path: "note2.md", tags: ["personal"] },
        { path: "note3.md", tags: ["project/alpha"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      expect(indexer.getFileCount()).toBe(3);
      expect(indexer.getAllTags()).toContain("project");
      expect(indexer.getAllTags()).toContain("personal");
      expect(indexer.getAllTags()).toContain("project/alpha");
    });

    it("should handle empty vault", async () => {
      await indexer.initialize();

      expect(indexer.getFileCount()).toBe(0);
      expect(indexer.getAllTags()).toHaveLength(0);
    });

    it("should not re-initialize if already initialized", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["test"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const firstCount = indexer.getFileCount();

      // Try to initialize again
      await indexer.initialize();

      // Should still have the same count
      expect(indexer.getFileCount()).toBe(firstCount);
    });
  });

  describe("Tag Indexing", () => {
    beforeEach(async () => {
      clearMockVault(app);
    });

    it("should index tags from frontmatter", async () => {
      const files: MockFileConfig[] = [
        {
          path: "note1.md",
          properties: { tags: ["project", "important"] },
        },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      expect(indexer.getAllTags()).toContain("project");
      expect(indexer.getAllTags()).toContain("important");
    });

    it("should index inline tags", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["#project", "#important"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      expect(indexer.getAllTags()).toContain("project");
      expect(indexer.getAllTags()).toContain("important");
    });

    it("should handle nested tags correctly", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["project/alpha/feature"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const tags = indexer.getAllTags();
      expect(tags).toContain("project");
      expect(tags).toContain("project/alpha");
      expect(tags).toContain("project/alpha/feature");
    });

    it("should normalize tags to lowercase", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["Project", "IMPORTANT", "CamelCase"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const tags = indexer.getAllTags();
      expect(tags).toContain("project");
      expect(tags).toContain("important");
      expect(tags).toContain("camelcase");
      expect(tags).not.toContain("Project");
      expect(tags).not.toContain("IMPORTANT");
    });

    it("should remove # prefix from tags", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["#project", "#important"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const tags = indexer.getAllTags();
      expect(tags).toContain("project");
      expect(tags).toContain("important");
      expect(tags.every((tag) => !tag.startsWith("#"))).toBe(true);
    });

    it("should handle files with no tags", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md" },
        { path: "note2.md", tags: ["project"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      expect(indexer.getFileCount()).toBe(2);
      expect(indexer.getAllTags()).toHaveLength(1);
    });
  });

  describe("Property Indexing", () => {
    beforeEach(async () => {
      clearMockVault(app);
    });

    it("should index frontmatter properties", async () => {
      const files: MockFileConfig[] = [
        {
          path: "note1.md",
          properties: { status: "active", priority: "high" },
        },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const filesWithStatus = indexer.getFilesWithProperty("status", "active");
      expect(filesWithStatus.size).toBe(1);

      const filesWithPriority = indexer.getFilesWithProperty("priority", "high");
      expect(filesWithPriority.size).toBe(1);
    });

    it("should skip reserved properties", async () => {
      const files: MockFileConfig[] = [
        {
          path: "note1.md",
          properties: { tags: ["test"], position: 100, custom: "value" },
        },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      // Should not index 'tags' or 'position' as properties
      const filesWithCustom = indexer.getFilesWithProperty("custom", "value");
      expect(filesWithCustom.size).toBe(1);

      // These should be empty since they're reserved
      const filesWithTags = indexer.getFilesWithProperty("tags");
      const filesWithPosition = indexer.getFilesWithProperty("position");
      expect(filesWithTags.size).toBe(0);
      expect(filesWithPosition.size).toBe(0);
    });

    it("should handle files with no properties", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md" },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const file = app.vault.getMarkdownFiles()[0];
      const props = indexer.getFileProperties(file);
      expect(Object.keys(props)).toHaveLength(0);
    });
  });

  describe("Query Methods", () => {
    beforeEach(async () => {
      clearMockVault(app);

      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["project/alpha"], properties: { status: "active" } },
        { path: "note2.md", tags: ["project/beta"], properties: { status: "active" } },
        { path: "note3.md", tags: ["project/alpha/feature"], properties: { status: "done" } },
        { path: "note4.md", tags: ["personal"], properties: { status: "active" } },
      ];

      createMockVault(app, files);
      await indexer.initialize();
    });

    it("should get files with specific tag", () => {
      const filesWithAlpha = indexer.getFilesWithTag("project/alpha");
      expect(filesWithAlpha.size).toBe(2); // note1.md and note3.md

      const filesWithBeta = indexer.getFilesWithTag("project/beta");
      expect(filesWithBeta.size).toBe(1); // note2.md
    });

    it("should get files with parent tag (includes nested)", () => {
      const filesWithProject = indexer.getFilesWithTag("project");
      expect(filesWithProject.size).toBe(3); // note1.md, note2.md, and note3.md
    });

    it("should get files with property value", () => {
      const activeFiles = indexer.getFilesWithProperty("status", "active");
      expect(activeFiles.size).toBe(3); // note1.md, note2.md, note4.md

      const doneFiles = indexer.getFilesWithProperty("status", "done");
      expect(doneFiles.size).toBe(1); // note3.md
    });

    it("should get all files with property (any value)", () => {
      const filesWithStatus = indexer.getFilesWithProperty("status");
      expect(filesWithStatus.size).toBe(4); // all files have status
    });

    it("should get nested tags under root", () => {
      const nestedTags = indexer.getNestedTagsUnder("project");
      expect(nestedTags).toContain("project");
      expect(nestedTags).toContain("project/alpha");
      expect(nestedTags).toContain("project/beta");
      expect(nestedTags).toContain("project/alpha/feature");
      expect(nestedTags).not.toContain("personal");
    });

    it("should get tags for specific file", () => {
      const files = app.vault.getMarkdownFiles();
      const file1 = files.find((f) => f.path === "note1.md");

      if (file1) {
        const tags = indexer.getFileTags(file1);
        expect(tags.has("project/alpha")).toBe(true);
        expect(tags.size).toBe(1);
      }
    });

    it("should get properties for specific file", () => {
      const files = app.vault.getMarkdownFiles();
      const file1 = files.find((f) => f.path === "note1.md");

      if (file1) {
        const props = indexer.getFileProperties(file1);
        expect(props.status).toBe("active");
      }
    });

    it("should return empty set for non-existent tag", () => {
      const files = indexer.getFilesWithTag("nonexistent");
      expect(files.size).toBe(0);
    });

    it("should return empty set for non-existent property", () => {
      const files = indexer.getFilesWithProperty("nonexistent");
      expect(files.size).toBe(0);
    });
  });

  describe("Incremental Updates", () => {
    beforeEach(async () => {
      clearMockVault(app);

      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["project"], properties: { status: "active" } },
      ];

      createMockVault(app, files);
      await indexer.initialize();
    });

    it("should handle file changes", async () => {
      const files = app.vault.getMarkdownFiles();
      const file = files[0];

      // Simulate file update
      const newMetadata = {
        tags: [{ tag: "#updated", position: { start: { line: 0, col: 0, offset: 0 }, end: { line: 0, col: 8, offset: 8 } } }],
        frontmatter: { status: "done" },
      };

      app.metadataCache.setFileCache(file, newMetadata);
      app.metadataCache.trigger("changed", file);

      // Wait for debounced update (VaultIndexer uses 300ms debounce)
      await new Promise((resolve) => setTimeout(resolve, 350));

      const tags = indexer.getAllTags();
      expect(tags).toContain("updated");

      const doneFiles = indexer.getFilesWithProperty("status", "done");
      expect(doneFiles.size).toBe(1);
    });

    it("should handle file deletion", async () => {
      const files = app.vault.getMarkdownFiles();
      const file = files[0];

      // Delete file
      app.vault.removeFile(file);
      app.vault.trigger("delete", file);

      const projectFiles = indexer.getFilesWithTag("project");
      expect(projectFiles.size).toBe(0);
    });

    it("should emit index-updated event on changes", async () => {
      const files = app.vault.getMarkdownFiles();
      const file = files[0];

      const listener = vi.fn();
      indexer.on("index-updated", listener);

      // Simulate file update
      app.metadataCache.trigger("changed", file);

      // Wait for debounced update (VaultIndexer uses 300ms debounce)
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(listener).toHaveBeenCalled();
    });
  });

  describe("Refresh", () => {
    it("should re-index entire vault on refresh", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["old"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      expect(indexer.getAllTags()).toContain("old");

      // Clear and add new files
      clearMockVault(app);
      const newFiles: MockFileConfig[] = [
        { path: "note2.md", tags: ["new"] },
      ];
      createMockVault(app, newFiles);

      await indexer.refresh();

      expect(indexer.getAllTags()).toContain("new");
      expect(indexer.getAllTags()).not.toContain("old");
    });
  });

  describe("Edge Cases", () => {
    it("should handle tags with special characters", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["tag-with-dashes", "tag_with_underscores"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const tags = indexer.getAllTags();
      expect(tags).toContain("tag-with-dashes");
      expect(tags).toContain("tag_with_underscores");
    });

    it("should handle deeply nested tags", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["a/b/c/d/e/f"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const tags = indexer.getAllTags();
      expect(tags).toContain("a");
      expect(tags).toContain("a/b");
      expect(tags).toContain("a/b/c");
      expect(tags).toContain("a/b/c/d");
      expect(tags).toContain("a/b/c/d/e");
      expect(tags).toContain("a/b/c/d/e/f");
    });

    it("should handle multiple files with same tags", async () => {
      const files: MockFileConfig[] = [
        { path: "note1.md", tags: ["shared"] },
        { path: "note2.md", tags: ["shared"] },
        { path: "note3.md", tags: ["shared"] },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const filesWithTag = indexer.getFilesWithTag("shared");
      expect(filesWithTag.size).toBe(3);
    });

    it("should handle files with many tags", async () => {
      const files: MockFileConfig[] = [
        {
          path: "note1.md",
          tags: ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
        },
      ];

      createMockVault(app, files);
      await indexer.initialize();

      const file = app.vault.getMarkdownFiles()[0];
      const tags = indexer.getFileTags(file);
      expect(tags.size).toBe(10);
    });
  });
});
