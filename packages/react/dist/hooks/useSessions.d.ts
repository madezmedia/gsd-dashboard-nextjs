import type { SessionId } from '@acp-components/core';
import type { SessionMeta } from '@acp-components/core';
export declare function useSessions(): {
    sessions: SessionMeta[];
    activeSessionId: string | null;
    sessionListCursors: string[];
    setActiveSession: (id: SessionId | null) => void;
    selectSession: (sessionId: SessionId) => Promise<void>;
    createSession: (agentId: string, cwd: string) => Promise<string>;
    loadSession: (sessionId: SessionId, cwd: string) => Promise<void>;
    closeSession: (sessionId: SessionId) => Promise<void>;
    deleteSession: (sessionId: SessionId) => Promise<void>;
    forkSession: (sourceSessionId: SessionId) => Promise<string>;
    refreshSessions: (agentId: string, cwd: string) => Promise<void>;
    loadMoreSessions: (agentId: string, cwd: string) => Promise<void>;
};
//# sourceMappingURL=useSessions.d.ts.map