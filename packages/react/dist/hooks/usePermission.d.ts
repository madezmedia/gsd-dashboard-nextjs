import type { SessionId } from '@acp-components/core';
export declare function usePermission(sessionId: SessionId | null): {
    pendingPermissions: import("@acp-components/core").PermissionRequest[];
    currentRequest: import("@acp-components/core").PermissionRequest;
    respond: (sid: SessionId, optionId: string) => void;
    deny: (sid: SessionId) => void;
};
//# sourceMappingURL=usePermission.d.ts.map