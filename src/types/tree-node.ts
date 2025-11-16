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
    propertyValue: any;
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
  depth: number
): TreeNode {
  const segments = tagPath.split("/");
  const name = segments[segments.length - 1];

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
  depth: number
): TreeNode {
  return {
    id: `prop:${propertyKey}:${propertyValue}`,
    name: String(propertyValue),
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
