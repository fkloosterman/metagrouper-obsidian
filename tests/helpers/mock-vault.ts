import { TFile, CachedMetadata, App, TagCache } from "obsidian";

export interface MockFileConfig {
  path: string;
  tags?: string[];
  properties?: Record<string, any>;
}

/**
 * Create a mock TFile instance
 */
export function createMockFile(path: string): TFile {
  return new TFile(path);
}

/**
 * Create mock metadata for a file
 */
export function createMockMetadata(
  tags: string[] = [],
  properties: Record<string, any> = {}
): CachedMetadata {
  const metadata: CachedMetadata = {};

  // Add tags if provided
  if (tags.length > 0) {
    metadata.tags = tags.map(
      (tag, index): TagCache => ({
        tag: tag.startsWith("#") ? tag : `#${tag}`,
        position: {
          start: { line: index, col: 0, offset: 0 },
          end: { line: index, col: tag.length, offset: tag.length },
        },
      })
    );
  }

  // Add frontmatter properties if provided
  if (Object.keys(properties).length > 0) {
    metadata.frontmatter = { ...properties };
  }

  return metadata;
}

/**
 * Create a mock vault with files and metadata
 */
export function createMockVault(
  app: App,
  files: MockFileConfig[]
): Map<TFile, CachedMetadata> {
  const fileMetadataMap = new Map<TFile, CachedMetadata>();

  const tfiles = files.map((config) => {
    const file = createMockFile(config.path);
    const metadata = createMockMetadata(config.tags || [], config.properties || {});

    // Set up the app's vault and metadata cache
    app.vault.addFile(file);
    app.metadataCache.setFileCache(file, metadata);

    fileMetadataMap.set(file, metadata);

    return file;
  });

  return fileMetadataMap;
}

/**
 * Clear the mock vault
 */
export function clearMockVault(app: App): void {
  app.vault.clear();
  app.metadataCache.clearCache();
}
