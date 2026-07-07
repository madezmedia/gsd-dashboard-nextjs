import type { FileTreeNode } from '@acp-components/core';
export type { FileTreeNode };
export interface FileTreeProps {
    /** Root nodes of the file tree */
    files: FileTreeNode[];
    /** Called when the user clicks a file node */
    onNavigate?: (path: string) => void;
    /** Additional class name */
    className?: string;
    /** Whether to show the root nodes' parent path */
    showRoot?: boolean;
    /** Called when a collapsed directory is clicked */
    onExpand?: (path: string) => void;
    /** Called when an expanded directory is clicked */
    onCollapse?: (path: string) => void;
}
export declare function FileTree({ files, onNavigate, className, showRoot, onExpand, onCollapse, }: FileTreeProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FileTree.d.ts.map