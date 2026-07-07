import type { SessionId } from '@acp-components/core';
export interface TerminalViewProps {
    sessionId?: SessionId | null;
    /** If provided, only this terminal is shown (targeted subscription). */
    terminalId?: string;
}
export declare function TerminalView({ sessionId, terminalId }: TerminalViewProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=TerminalView.d.ts.map