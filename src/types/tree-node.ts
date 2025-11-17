import { TFile } from "obsidian";

/**
 * Represents a node in the tag tree hierarchy
 */
export interface TreeNode {
  /** Unique identifier (full path or composite key) */
  id: string;

  /** Display name (last segment) */
  name: string;

  /** Node type */
  type: "tag" | "property-group" | "file";

  /** Child nodes */
  children: TreeNode[];

  /** Optional parent reference */
  parent?: TreeNode;

  /** Distance from root */
  depth: number;

  /** Files at this exact node */
  files: TFile[];

  /** Total files (including descendants) */
  fileCount: number;

  /** Node metadata */
  metadata?: {
    /** Full tag path for tag nodes */
    tagPath?: string;

    /** Property name for property nodes */
    propertyKey?: string;

    /** Property value for property nodes */
    propertyValue?: any;
  };

  /** UI state (managed by TreeComponent) */
  isExpanded?: boolean;
}

/**
 * Factory function to create a tag node
 */
export function createTagNode(
  tagPath: string,
  files: TFile[],
  depth: number,
  options?: {
    label?: string;
    showFullPath?: boolean;
  }
): TreeNode {
  const segments = tagPath.split("/");
  let name: string;

  // Determine the tag portion to display
  let tagName: string;
  if (options?.showFullPath) {
    // Show full tag path
    tagName = tagPath;
  } else {
    // Default: show last segment only
    tagName = segments[segments.length - 1];
  }

  // Prepend label if provided and not empty
  if (options?.label && options.label.trim() !== "") {
    name = `${options.label}: ${tagName}`;
  } else {
    name = tagName;
  }

  return {
    id: `tag:${tagPath}`,
    name,
    type: "tag",
    children: [],
    depth,
    files,
    fileCount: files.length,
    metadata: { tagPath },
  };
}

/**
 * Factory function to create a property group node
 */
export function createPropertyGroupNode(
  propertyKey: string,
  propertyValue: any,
  files: TFile[],
  depth: number,
  options?: {
    label?: string;
    showPropertyName?: boolean;
  }
): TreeNode {
  let name: string;
  const valueName = String(propertyValue);

  // Determine if we should prepend property name
  if (options?.showPropertyName) {
    // Use label if provided and not empty, otherwise use property key
    const prefix = (options?.label && options.label.trim() !== "")
      ? options.label
      : propertyKey;
    name = `${prefix} = ${valueName}`;
  } else {
    // Just show value
    name = valueName;
  }

  return {
    id: `prop:${propertyKey}:${propertyValue}`,
    name,
    type: "property-group",
    children: [],
    depth,
    files,
    fileCount: files.length,
    metadata: { propertyKey, propertyValue },
  };
}

/**
 * Factory function to create a file node
 */
export function createFileNode(file: TFile, depth: number): TreeNode {
  return {
    id: `file:${file.path}`,
    name: file.basename,
    type: "file",
    children: [],
    depth,
    files: [file],
    fileCount: 1,
  };
}
