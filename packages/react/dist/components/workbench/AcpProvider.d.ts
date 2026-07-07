import React from 'react';
import type { AgentConfig, TerminalHandler, FileSystemProviderOptions } from '@acp-components/core';
import type { ExtMethodHandler, ExtNotificationHandler } from '@acp-components/core';
export interface AcpProviderProps {
    agents: AgentConfig[];
    theme?: 'light' | 'dark';
    children: React.ReactNode;
    onTerminal?: TerminalHandler;
    onExtMethod?: ExtMethodHandler;
    onExtNotification?: ExtNotificationHandler;
    defaultCwd?: string;
    /** Unified file system options: file tree browsing + ACP file read/write handlers */
    fileSystem?: FileSystemProviderOptions;
    /** Host-provided file open handler. When set, built-in FileViewer is bypassed — host opens the file in its own editor. */
    onOpenFile?: (path: string, line?: number | null) => void;
}
export declare function AcpProvider({ agents, theme: initialTheme, children, onTerminal, onExtMethod, onExtNotification, defaultCwd, fileSystem, onOpenFile, }: AcpProviderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AcpProvider.d.ts.map