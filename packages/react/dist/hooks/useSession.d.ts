import type { Message, ToolCallState, PermissionRequest } from '@acp-components/core';
import type { SessionId, PlanEntry, UsageUpdate, SessionConfigOption, AvailableCommand } from '@acp-components/core';
export declare function useSession(sessionId: SessionId | null): {
    messages: Message[];
    isStreaming: boolean;
    pendingToolCalls: ToolCallState[];
    pendingPermissions: PermissionRequest[];
    plan: PlanEntry[];
    usage: UsageUpdate | null;
    configOptions: SessionConfigOption[];
    availableCommands: AvailableCommand[];
};
//# sourceMappingURL=useSession.d.ts.map