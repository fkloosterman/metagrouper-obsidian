import { App, Plugin, PluginManifest, WorkspaceLeaf } from "obsidian";
import { TagTreeView, VIEW_TYPE_TAG_TREE } from "./view";

export default class TagTreePlugin extends Plugin {
  async onload() {
    this.registerView(
      VIEW_TYPE_TAG_TREE,
      (leaf: WorkspaceLeaf) => new TagTreeView(leaf)
    );

    this.addRibbonIcon("tree-deciduous", "Open Tag Tree", () => {
      this.activateView();
    });
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_TAG_TREE);
  }

  async activateView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TAG_TREE);
    if (leaves.length === 0) {
      const leaf = this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: VIEW_TYPE_TAG_TREE,
          active: true,
        });
      }
    }
    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE_TAG_TREE)[0]
    );
  }
}