import { ViewState, DEFAULT_VIEW_STATE } from "../types/view-state";
import {
  HierarchyConfig,
  EXAMPLE_HIERARCHY_CONFIGS,
} from "../types/hierarchy-config";

/**
 * Plugin settings schema
 */
export interface TagTreeSettings {
  /** All saved view configurations */
  savedViews: HierarchyConfig[];

  /** Name of the default view to load for new instances */
  defaultViewName: string;

  /** Per-view UI state storage (keyed by view name) */
  viewStates: Record<string, ViewState>;
}

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: TagTreeSettings = {
  // Initialize with example configurations
  savedViews: [...EXAMPLE_HIERARCHY_CONFIGS],

  // Default to "All Tags" view
  defaultViewName: "All Tags",

  viewStates: {
    // Default view state for "All Tags"
    "All Tags": { ...DEFAULT_VIEW_STATE },
  },
};

/**
 * Migrate settings from old schema to new schema
 * Handles backward compatibility when updating the plugin
 */
export function migrateSettings(settings: TagTreeSettings): void {
  // Migrate view configs
  settings.savedViews.forEach((view: any) => {
    // Old sortMode property → new defaultFileSortMode and defaultNodeSortMode
    if ('sortMode' in view) {
      // If sortMode exists, use it as the default for both (best effort migration)
      if (!view.defaultFileSortMode) {
        view.defaultFileSortMode = view.sortMode;
      }
      if (!view.defaultNodeSortMode) {
        view.defaultNodeSortMode = view.sortMode;
      }
      // Remove old property
      delete view.sortMode;
    }

    // Set defaults if missing
    if (!view.defaultNodeSortMode) {
      view.defaultNodeSortMode = "alpha-asc";
    }
    if (!view.defaultFileSortMode) {
      view.defaultFileSortMode = "alpha-asc";
    }
  });

  // Migrate view states
  Object.values(settings.viewStates).forEach((state: any) => {
    // Old sortMode property → new fileSortMode
    if ('sortMode' in state) {
      if (!state.fileSortMode) {
        state.fileSortMode = state.sortMode;
      }
      // Remove old property
      delete state.sortMode;
    }

    // Initialize levelSortOverrides if missing
    if (!state.levelSortOverrides) {
      state.levelSortOverrides = {};
    }
  });
}
