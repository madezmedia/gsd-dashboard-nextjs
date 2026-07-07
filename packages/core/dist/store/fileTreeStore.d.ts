import type { FileTreeNode, DirectoryReadHandler } from '../types';
export interface WorkspaceFileTreeState {
    rootNodes: FileTreeNode[];
    loading: boolean;
    error: string | null;
    directoryReader: DirectoryReadHandler | null;
}
interface FileTreeStoreState {
    workspaces: Map<string, WorkspaceFileTreeState>;
    initWorkspace: (cwd: string, directoryReader?: DirectoryReadHandler) => void;
    removeWorkspace: (cwd: string) => void;
    setReader: (cwd: string, fn: DirectoryReadHandler) => void;
    setLoading: (cwd: string, loading: boolean) => void;
    setError: (cwd: string, error: string | null) => void;
    setRootNodes: (cwd: string, nodes: FileTreeNode[]) => void;
    updateNode: (cwd: string, path: string, update: Partial<FileTreeNode>) => void;
    replaceChildren: (cwd: string, path: string, children: FileTreeNode[]) => void;
}
export declare function findNodeByPath(nodes: FileTreeNode[], path: string): FileTreeNode | null;
export declare const fileTreeStore: import("zustand/vanilla").StoreApi<FileTreeStoreState>;
export {};
//# sourceMappingURL=fileTreeStore.d.ts.map