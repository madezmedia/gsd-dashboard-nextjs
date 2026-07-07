import type { FileTreeNode } from '@acp-components/core';
export interface UseFileTreeOptions {
    cwd: string;
}
export declare function useFileTree({ cwd }: UseFileTreeOptions): {
    files: FileTreeNode[];
    loading: boolean;
    error: string | null;
    load: () => void;
    onExpand: (path: string) => void;
    onCollapse: (path: string) => void;
};
//# sourceMappingURL=useFileTree.d.ts.map