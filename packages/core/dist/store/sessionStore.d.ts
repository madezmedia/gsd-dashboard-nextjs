import type { Message, ToolCallState, PermissionRequest, TerminalState } from '../types';
import type { SessionId, ContentBlock, StopReason, PlanEntry, UsageUpdate, SessionConfigOption, AvailableCommand, TerminalExitStatus } from '@agentclientprotocol/sdk';
interface SessionData {
    messages: Message[];
    isStreaming: boolean;
    pendingToolCalls: Map<string, ToolCallState>;
    pendingPermissions: PermissionRequest[];
    plan: PlanEntry[];
    usage: UsageUpdate | null;
    configOptions: SessionConfigOption[];
    availableCommands: AvailableCommand[];
    terminals: Map<string, TerminalState>;
}
interface SessionStoreState {
    sessions: Map<SessionId, SessionData>;
    ensureSession: (id: SessionId) => void;
    removeSession: (id: SessionId) => void;
    resetSession: (id: SessionId) => void;
    addMessage: (sessionId: SessionId, msg: Message) => void;
    updateMessage: (sessionId: SessionId, id: string, update: Partial<Message>) => void;
    appendContent: (sessionId: SessionId, messageId: string, role: Message['role'], block: ContentBlock) => void;
    appendThought: (sessionId: SessionId, messageId: string, role: Message['role'], block: ContentBlock) => void;
    setIsStreaming: (sessionId: SessionId, v: boolean) => void;
    setStopReason: (sessionId: SessionId, r: StopReason) => void;
    upsertToolCall: (sessionId: SessionId, tc: ToolCallState) => void;
    updateToolCall: (sessionId: SessionId, id: string, update: Partial<ToolCallState>) => void;
    addPermissionRequest: (sessionId: SessionId, req: PermissionRequest) => void;
    removePermissionRequest: (sessionId: SessionId, requestId?: string) => void;
    setPlan: (sessionId: SessionId, entries: PlanEntry[]) => void;
    setUsage: (sessionId: SessionId, usage: UsageUpdate) => void;
    setConfigOptions: (sessionId: SessionId, configOptions: SessionConfigOption[]) => void;
    setAvailableCommands: (sessionId: SessionId, commands: AvailableCommand[]) => void;
    setPartExpanded: (sessionId: SessionId, messageId: string, partIndex: number, expanded: boolean) => void;
    addTerminal: (sessionId: SessionId, terminal: TerminalState) => void;
    updateTerminalOutput: (sessionId: SessionId, terminalId: string, output: string, truncated: boolean) => void;
    updateTerminalExit: (sessionId: SessionId, terminalId: string, exitStatus: TerminalExitStatus | null) => void;
    removeTerminal: (sessionId: SessionId, terminalId: string) => void;
}
export declare const sessionStore: import("zustand/vanilla").StoreApi<SessionStoreState>;
export {};
//# sourceMappingURL=sessionStore.d.ts.map