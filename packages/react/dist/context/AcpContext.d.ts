import type { AcpClient, AgentConfig, AgentConnection, WorkspaceState } from '@acp-components/core';
export interface AcpContextValue {
    getClient(agentId: string): AcpClient | null;
    agents: AgentConnection[];
    workspaces: WorkspaceState[];
    addAgent(config: AgentConfig): Promise<void>;
    removeAgent(agentId: string): Promise<void>;
    isReady: boolean;
    addWorkspace: (cwd: string) => void;
    removeWorkspace: (cwd: string) => void;
    /** Host-provided file open handler (plugin/IDE integration). When set, built-in editor is bypassed. */
    onOpenFile?: (path: string, line?: number | null) => void;
    /** Host-provided file content reader. Used by FileViewer to read file contents. */
    onFileContentRead?: (path: string) => Promise<string>;
}
export declare const AcpContext: import("react").Context<AcpContextValue | null>;
export declare function useAcpContext(): AcpContextValue;
//# sourceMappingURL=AcpContext.d.ts.map