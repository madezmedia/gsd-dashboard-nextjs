import React from 'react';
import type { Message, SessionId } from '@acp-components/core';
export interface MessageBubbleProps {
    sessionId: SessionId | null;
    messages: Message[];
    isStreaming?: boolean;
    onNavigateFile?: (path: string, line?: number | null) => void;
}
export declare const MessageBubble: React.NamedExoticComponent<MessageBubbleProps>;
//# sourceMappingURL=MessageBubble.d.ts.map