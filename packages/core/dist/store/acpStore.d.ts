import type { SessionMeta, AgentConnection, WorkspaceState } from '../types';
import type { SessionId, SessionInfo } from '@agentclientprotocol/sdk';
interface PendingAuth {
    agentId: string;
}
export declare function findWorkspaceBySession(workspaces: Map<string, WorkspaceState>, sessionId: SessionId): string | null;
interface AcpStoreState {
    agents: Map<string, AgentConnection>;
    workspaces: Map<string, WorkspaceState>;
    activeSessionId: SessionId | null;
    pendingAuth: PendingAuth | null;
    addWorkspace: (cwd: string) => void;
    removeWorkspace: (cwd: string) => void;
    addAgent: (agent: AgentConnection) => void;
    removeAgent: (id: string) => void;
    updateAgent: (id: string, update: Partial<AgentConnection>) => void;
    setSessions: (sessions: SessionInfo[], agentId: string, cwd: string) => void;
    appendSessions: (sessions: SessionInfo[], agentId: string, cwd: string, nextCursor: string | null) => void;
    addSession: (session: SessionMeta) => void;
    removeSession: (id: SessionId) => void;
    updateSession: (id: SessionId, update: Partial<SessionMeta>) => void;
    setActiveSession: (id: SessionId | null) => void;
    setAuthRequired: (agentId: string) => void;
    clearAuthRequired: () => void;
}
export declare const acpStore: import("zustand/vanilla").StoreApi<AcpStoreState>;
export {};
//# sourceMappingURL=acpStore.d.ts.map