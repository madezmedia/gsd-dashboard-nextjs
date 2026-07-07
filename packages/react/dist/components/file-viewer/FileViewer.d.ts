import type { OpenFileEntry } from '../../hooks/useFileViewer';
export interface FileViewerProps {
    /** Open file entries (tabs) */
    openFiles: OpenFileEntry[];
    /** Currently active file */
    activeFile: OpenFileEntry | null;
    /** Close a file tab */
    onCloseFile: (path: string) => void;
    /** Switch active tab */
    onSelectFile: (path: string) => void;
    /** Line to reveal in the editor */
    revealLine?: number | null;
    /** Called after revealLine has been consumed */
    onRevealLineConsumed?: () => void;
    /** Additional CSS class */
    className?: string;
}
export declare function FileViewer({ openFiles, activeFile, onCloseFile, onSelectFile, revealLine, onRevealLineConsumed, className, }: FileViewerProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=FileViewer.d.ts.map