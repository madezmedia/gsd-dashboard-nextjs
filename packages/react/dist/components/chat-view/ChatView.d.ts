import type { SessionId } from '@acp-components/core';
export interface ChatViewProps {
    sessionId: SessionId | null;
    onNavigateFile?: (path: string, line?: number | null) => void;
}
export declare function ChatView({ sessionId, onNavigateFile }: ChatViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ChatView.d.ts.map