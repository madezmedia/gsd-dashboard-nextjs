import React from 'react';
import type { ToolCallState, SessionId } from '@acp-components/core';
export interface ToolCallCardProps {
    sessionId: SessionId | null;
    toolCall: ToolCallState;
    onNavigate?: (path: string, line?: number | null) => void;
    expanded: boolean;
    onExpandedChange: (expanded: boolean) => void;
}
export declare const ToolCallCard: React.NamedExoticComponent<ToolCallCardProps>;
//# sourceMappingURL=ToolCallCard.d.ts.map