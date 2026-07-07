import type { SessionId, AvailableCommand } from '@acp-components/core';
export interface ChatComposerProps {
    sessionId: SessionId | null;
    isStreaming: boolean;
    availableCommands?: AvailableCommand[];
    editText?: string;
    onEditTextConsumed?: () => void;
}
export declare function ChatComposer({ sessionId, isStreaming, availableCommands, editText, onEditTextConsumed }: ChatComposerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ChatComposer.d.ts.map