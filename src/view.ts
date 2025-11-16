import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_TAG_TREE = "tag-tree-view";

export class TagTreeView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_TAG_TREE;
  }

  getDisplayText() {
    return "Tag Tree";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("div", { text: "Tag Tree View Loaded" });
  }

  async onClose() {
    // Cleanup if needed
  }
}