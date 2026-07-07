import { AcpClient } from './client/AcpClient';
import type { ExtMethodHandler, ExtNotificationHandler } from './client/AcpClient';
import type { TerminalHandler } from './types';
import type { AgentConfig } from './types';
import type { FileSystemProviderOptions } from './fileSystem/provider';
export interface MultiAgentProviderOptions {
    agents: AgentConfig[];
    onTerminal?: TerminalHandler;
    onExtMethod?: ExtMethodHandler;
    onExtNotification?: ExtNotificationHandler;
    /** Unified file system options: file tree browsing + ACP file read/write handlers */
    fileSystem?: FileSystemProviderOptions;
}
export interface MultiAgentProviderInstance {
    ready: boolean;
    subscribe(fn: () => void): () => void;
    destroy(): void;
    getClient(agentId: string): AcpClient | null;
    addAgent(config: AgentConfig): Promise<void>;
    removeAgent(agentId: string): Promise<void>;
}
export declare function createAcpProvider({ agents, onTerminal, onExtMethod, onExtNotification, fileSystem }: MultiAgentProviderOptions): MultiAgentProviderInstance;
//# sourceMappingURL=provider.d.ts.map