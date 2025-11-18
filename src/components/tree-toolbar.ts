import { setIcon, DropdownComponent, ButtonComponent, ToggleComponent } from "obsidian";
import { SortMode, FileSortMode } from "../types/view-state";
import { HierarchyConfig } from "../types/hierarchy-config";

/**
 * Toolbar configuration for callbacks
 */
export interface TreeToolbarCallbacks {
  onFileSortChange: (mode: FileSortMode) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onExpandToDepth: (depth: number) => void;
  onToggleFiles: () => void;
  onViewChange?: (viewName: string) => void;
}

/**
 * TreeToolbar - Full-featured toolbar with expansion and sorting controls
 *
 * Phase 2.3: Implements collapse/expand controls, depth selector, and file visibility toggle
 */
export class TreeToolbar {
  private container: HTMLElement | null = null;
  private callbacks: TreeToolbarCallbacks;
  private currentFileSortMode: FileSortMode;
  private showFiles: boolean = true;
  private savedViews: HierarchyConfig[];
  private currentViewName: string;

  // File sort mode labels for dropdown
  private readonly fileSortModeLabels: Record<FileSortMode, string> = {
    "alpha-asc": "A → Z",
    "alpha-desc": "Z → A",
    "created-desc": "Created ↓",
    "created-asc": "Created ↑",
    "modified-desc": "Modified ↓",
    "modified-asc": "Modified ↑",
    "size-desc": "Size ↓",
    "size-asc": "Size ↑",
    "none": "Unsorted",
  };

  // Depth options for expansion
  private readonly depthOptions = [
    { value: 0, label: "Top level" },
    { value: 1, label: "1 level" },
    { value: 2, label: "2 levels" },
    { value: 3, label: "3 levels" },
    { value: -1, label: "All" },
  ];

  constructor(
    callbacks: TreeToolbarCallbacks,
    initialFileSortMode: FileSortMode = "alpha-asc",
    initialShowFiles: boolean = true,
    savedViews: HierarchyConfig[] = [],
    currentViewName: string = "All Tags"
  ) {
    this.callbacks = callbacks;
    this.currentFileSortMode = initialFileSortMode;
    this.showFiles = initialShowFiles;
    this.savedViews = savedViews;
    this.currentViewName = currentViewName;
  }

  /**
   * Render the toolbar
   */
  render(container: HTMLElement): void {
    this.container = container;
    container.empty();

    const toolbar = container.createDiv("nav-header");

    // Row 0: View switcher (at the very top)
    if (this.savedViews.length > 0 && this.callbacks.onViewChange) {
      const viewSwitcherRow = toolbar.createDiv("nav-buttons-container");
      this.renderViewSwitcher(viewSwitcherRow);
    }

    // Row 1: Expansion controls
    const expansionRow = toolbar.createDiv("nav-buttons-container");
    this.renderExpansionControls(expansionRow);

    // Row 2: File visibility and sort controls
    const controlsRow = toolbar.createDiv("nav-buttons-container");
    this.renderFileVisibilityToggle(controlsRow);
    this.renderSortControl(controlsRow);
  }

  /**
   * Render view switcher dropdown
   */
  private renderViewSwitcher(row: HTMLElement): void {
    // View label with icon
    const viewLabel = row.createSpan("setting-item-name");
    const viewIcon = viewLabel.createSpan();
    viewIcon.style.marginRight = "4px";
    viewIcon.style.display = "inline-flex";
    viewIcon.style.alignItems = "center";
    setIcon(viewIcon, "layout-list");
    viewLabel.createSpan({ text: "View:" });

    // View dropdown using DropdownComponent
    new DropdownComponent(row)
      .addOptions(
        Object.fromEntries(
          this.savedViews.map((view) => [view.name, view.name])
        )
      )
      .setValue(this.currentViewName)
      .onChange((value) => {
        this.currentViewName = value;
        if (this.callbacks.onViewChange) {
          this.callbacks.onViewChange(value);
        }
      });
  }

  /**
   * Render expansion controls (collapse/expand buttons and depth selector)
   */
  private renderExpansionControls(row: HTMLElement): void {
    // Collapse All button
    new ButtonComponent(row)
      .setButtonText("Collapse All")
      .setIcon("fold-vertical")
      .setTooltip("Collapse all nodes")
      .onClick(() => {
        this.callbacks.onCollapseAll();
      });

    // Expand All button
    new ButtonComponent(row)
      .setButtonText("Expand All")
      .setIcon("unfold-vertical")
      .setTooltip("Expand all nodes")
      .onClick(() => {
        this.callbacks.onExpandAll();
      });

    // Depth selector label
    const depthLabel = row.createSpan("setting-item-name");
    depthLabel.style.marginLeft = "8px";
    depthLabel.style.marginRight = "4px";
    const depthIcon = depthLabel.createSpan();
    depthIcon.style.marginRight = "4px";
    depthIcon.style.display = "inline-flex";
    depthIcon.style.alignItems = "center";
    setIcon(depthIcon, "layers");
    depthLabel.createSpan({ text: "Depth:" });

    // Create depth level buttons using clickable-icon
    for (const option of this.depthOptions) {
      const btn = row.createEl("button", {
        cls: "clickable-icon",
        text: option.value === -1 ? "All" : String(option.value),
        attr: {
          "aria-label": `Expand to ${option.label}`,
          "title": `Expand to ${option.label}`,
        },
      });

      btn.addEventListener("click", () => {
        if (option.value === -1) {
          this.callbacks.onExpandAll();
        } else {
          this.callbacks.onExpandToDepth(option.value);
        }
      });
    }
  }

  /**
   * Render file visibility toggle
   */
  private renderFileVisibilityToggle(row: HTMLElement): void {
    // Label
    const label = row.createSpan("setting-item-name");
    const icon = label.createSpan();
    icon.style.marginRight = "4px";
    icon.style.display = "inline-flex";
    icon.style.alignItems = "center";
    setIcon(icon, "file");
    label.createSpan({ text: "Show Files:" });

    // Toggle button using clickable-icon
    const toggle = row.createEl("button", {
      cls: this.showFiles ? "clickable-icon is-active" : "clickable-icon",
      attr: {
        "aria-label": "Toggle file visibility",
        "role": "switch",
        "aria-checked": String(this.showFiles)
      },
    });

    setIcon(toggle, this.showFiles ? "eye" : "eye-off");

    toggle.addEventListener("click", () => {
      this.showFiles = !this.showFiles;

      // Update button state
      if (this.showFiles) {
        toggle.addClass("is-active");
        toggle.setAttribute("aria-checked", "true");
      } else {
        toggle.removeClass("is-active");
        toggle.setAttribute("aria-checked", "false");
      }

      // Update icon
      toggle.empty();
      setIcon(toggle, this.showFiles ? "eye" : "eye-off");

      // Trigger callback
      this.callbacks.onToggleFiles();
    });
  }

  /**
   * Render the file sort control dropdown
   */
  private renderSortControl(row: HTMLElement): void {
    // Sort label with icon
    const sortLabel = row.createSpan("setting-item-name");
    sortLabel.style.marginLeft = "8px";
    const sortIcon = sortLabel.createSpan();
    sortIcon.style.marginRight = "4px";
    sortIcon.style.display = "inline-flex";
    sortIcon.style.alignItems = "center";
    setIcon(sortIcon, "arrow-up-down");
    sortLabel.createSpan({ text: "Sort files:" });

    // Sort dropdown using DropdownComponent
    const fileSortModes: FileSortMode[] = [
      "alpha-asc",
      "alpha-desc",
      "created-desc",
      "created-asc",
      "modified-desc",
      "modified-asc",
      "size-desc",
      "size-asc",
    ];

    new DropdownComponent(row)
      .addOptions(
        Object.fromEntries(
          fileSortModes.map((mode) => [mode, this.fileSortModeLabels[mode]])
        )
      )
      .setValue(this.currentFileSortMode)
      .onChange((value) => {
        this.currentFileSortMode = value as FileSortMode;
        this.callbacks.onFileSortChange(this.currentFileSortMode);
      });
  }

  /**
   * Update the current file sort mode
   */
  setFileSortMode(mode: FileSortMode): void {
    if (this.currentFileSortMode === mode) {
      return;
    }

    this.currentFileSortMode = mode;

    // Re-render toolbar to update dropdown
    if (this.container) {
      this.render(this.container.parentElement!);
    }
  }

  /**
   * Get current file sort mode
   */
  getFileSortMode(): FileSortMode {
    return this.currentFileSortMode;
  }

  /**
   * Set file visibility state (for state restoration)
   */
  setFileVisibility(show: boolean): void {
    if (this.showFiles === show) {
      return;
    }

    this.showFiles = show;

    // Re-render toolbar to update toggle
    if (this.container) {
      this.render(this.container.parentElement!);
    }
  }

  /**
   * Update the saved views list (e.g., when views are added/removed in settings)
   */
  updateSavedViews(savedViews: HierarchyConfig[]): void {
    this.savedViews = savedViews;

    // Re-render if toolbar is already rendered
    if (this.container) {
      this.render(this.container);
    }
  }

  /**
   * Update the current view name
   */
  setCurrentViewName(viewName: string): void {
    if (this.currentViewName === viewName) {
      return;
    }

    this.currentViewName = viewName;

    // Re-render toolbar to update view dropdown
    if (this.container) {
      this.render(this.container.parentElement!);
    }
  }
}
