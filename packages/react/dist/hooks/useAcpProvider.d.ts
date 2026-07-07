import type { MultiAgentProviderOptions, AgentConfig } from '@acp-components/core';
export declare function useAcpProvider(options: MultiAgentProviderOptions): {
    getClient: (agentId: string) => import("@acp-components/core").AcpClient | null;
    agents: import("@acp-components/core").AgentConnection[];
    workspaces: import("@acp-components/core").WorkspaceState[];
    addAgent: (config: AgentConfig) => Promise<void>;
    removeAgent: (agentId: string) => Promise<void>;
    addWorkspace: (cwd: string) => void;
    removeWorkspace: (cwd: string) => void;
    isReady: boolean;
};
//# sourceMappingURL=useAcpProvider.d.ts.map