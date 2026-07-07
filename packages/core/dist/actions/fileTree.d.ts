/** Load the file tree root for a workspace. */
export declare function loadFileTree(cwd: string): Promise<void>;
/** Expand a directory node, loading its children if not already loaded. */
export declare function expandDirectory(cwd: string, path: string): Promise<void>;
/** Collapse a directory node. */
export declare function collapseDirectory(cwd: string, path: string): void;
/**
 * Refresh the entire file tree for a workspace, preserving expanded state.
 * Expanded subdirectories are re-read from disk, not just restored from old state.
 */
export declare function refreshFileTree(cwd: string): Promise<void>;
/** Refresh children of a single directory node. */
export declare function refreshNode(cwd: string, path: string): Promise<void>;
//# sourceMappingURL=fileTree.d.ts.map