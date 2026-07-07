import type { FileReadHandler, FileWriteHandler } from '../client/AcpClient';
import type { DirectoryReadHandler, FileTreeWatchCallbacks } from '../types';
export interface FileSystemProviderOptions {
    /** Platform-specific directory reader (enables file tree) */
    onDirectoryRead?: DirectoryReadHandler;
    /** Optional file change watcher. Return an unsubscribe function. */
    onFileTreeWatch?: (callbacks: FileTreeWatchCallbacks) => (() => void) | void;
    /** Auto-load strategy: 'onWorkspaceAdd' loads file tree when workspace is added, 'manual' requires explicit load */
    autoLoad?: 'onWorkspaceAdd' | 'manual';
    /** Handler for ACP readTextFile requests from agents */
    onFileRead?: FileReadHandler;
    /** Handler for ACP writeTextFile requests from agents */
    onFileWrite?: FileWriteHandler;
    /** Host-provided file content reader for the built-in FileViewer component */
    onFileContentRead?: (path: string) => Promise<string>;
}
export interface FileSystemProviderInstance {
    /** Load file tree for a workspace */
    loadFileTree(cwd: string): Promise<void>;
    /** Refresh entire file tree for a workspace */
    refreshFileTree(cwd: string): Promise<void>;
    /** Refresh a single directory node */
    refreshNode(cwd: string, path: string): Promise<void>;
    /** Register or replace the directory reader for a specific workspace */
    setDirectoryReader(cwd: string, fn: DirectoryReadHandler): void;
    /** Destroy the provider and clean up all watchers */
    destroy(): void;
}
export declare function createFileSystemProvider(options: FileSystemProviderOptions): FileSystemProviderInstance;
//# sourceMappingURL=provider.d.ts.map