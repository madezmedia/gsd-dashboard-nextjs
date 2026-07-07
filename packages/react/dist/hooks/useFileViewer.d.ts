export interface OpenFileEntry {
    /** Absolute file path */
    path: string;
    /** File content (empty while loading) */
    content: string;
    /** Detected language for syntax highlighting */
    language: string;
    /** Whether content is currently being fetched */
    loading: boolean;
    /** Error message if content fetch failed */
    error: string | null;
}
export interface UseFileViewerReturn {
    /** List of open file tabs */
    openFiles: OpenFileEntry[];
    /** Currently active (visible) file entry, or null */
    activeFile: OpenFileEntry | null;
    /** Open a file — fetches content and adds/activates tab. If host `onOpenFile` is set, delegates to host instead. */
    openFile: (path: string, line?: number | null) => void;
    /** Close a file tab */
    closeFile: (path: string) => void;
    /** Switch the active tab */
    setActiveFile: (path: string) => void;
    /** Line number to reveal in the editor (consumed after use) */
    revealLine: number | null;
    /** Clear the reveal line after it has been consumed */
    clearRevealLine: () => void;
}
export declare function useFileViewer(): UseFileViewerReturn;
//# sourceMappingURL=useFileViewer.d.ts.map