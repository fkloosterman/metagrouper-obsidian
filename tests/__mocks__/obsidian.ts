/**
 * Mock implementation of Obsidian API for testing
 */

export class Events {
  private handlers: Map<string, Array<(...args: any[]) => void>> = new Map();

  on(name: string, callback: (...args: any[]) => void): void {
    if (!this.handlers.has(name)) {
      this.handlers.set(name, []);
    }
    this.handlers.get(name)!.push(callback);
  }

  off(name: string, callback: (...args: any[]) => void): void {
    const callbacks = this.handlers.get(name);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  trigger(name: string, ...args: any[]): void {
    const callbacks = this.handlers.get(name);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
}

export class TFile {
  path: string;
  basename: string;
  extension: string;
  name: string;

  constructor(path: string) {
    this.path = path;
    this.name = path.split("/").pop() || "";
    this.basename = this.name.replace(/\.md$/, "");
    this.extension = "md";
  }
}

export interface TagCache {
  tag: string;
  position: {
    start: { line: number; col: number; offset: number };
    end: { line: number; col: number; offset: number };
  };
}

export interface CachedMetadata {
  tags?: TagCache[];
  frontmatter?: Record<string, any>;
  [key: string]: any;
}

export class MetadataCache extends Events {
  private cache: Map<TFile, CachedMetadata> = new Map();
  initialized: boolean = true;

  getFileCache(file: TFile): CachedMetadata | null {
    return this.cache.get(file) || null;
  }

  setFileCache(file: TFile, metadata: CachedMetadata): void {
    this.cache.set(file, metadata);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export class Vault extends Events {
  private files: TFile[] = [];

  getMarkdownFiles(): TFile[] {
    return this.files;
  }

  setFiles(files: TFile[]): void {
    this.files = files;
  }

  addFile(file: TFile): void {
    this.files.push(file);
  }

  removeFile(file: TFile): void {
    const index = this.files.indexOf(file);
    if (index > -1) {
      this.files.splice(index, 1);
    }
  }

  clear(): void {
    this.files = [];
  }
}

export class Workspace extends Events {}

export class App {
  vault: Vault;
  metadataCache: MetadataCache;
  workspace: Workspace;

  constructor() {
    this.vault = new Vault();
    this.metadataCache = new MetadataCache();
    this.workspace = new Workspace();
  }
}

export class Plugin {
  app: App;
  manifest: any;

  constructor(app: App, manifest: any) {
    this.app = app;
    this.manifest = manifest;
  }

  registerEvent(event: any): void {}
  addCommand(command: any): void {}
  addRibbonIcon(icon: string, title: string, callback: () => void): void {}
  registerView(type: string, creator: (leaf: any) => any): void {}
}

export class ItemView {
  containerEl: HTMLElement;

  constructor(leaf: any) {
    this.containerEl = document.createElement("div");
  }

  getViewType(): string {
    return "";
  }

  getDisplayText(): string {
    return "";
  }

  async onOpen(): Promise<void> {}
  async onClose(): Promise<void> {}
}

export class PluginSettingTab {
  app: App;
  plugin: any;

  constructor(app: App, plugin: any) {
    this.app = app;
    this.plugin = plugin;
  }

  display(): void {}
  hide(): void {}
}
