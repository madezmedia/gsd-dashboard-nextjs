import type { SessionId, ContentBlock, PromptResponse } from '@acp-components/core';
export declare function usePrompt(sessionId: SessionId | null): {
    send: (contentBlocks: ContentBlock[]) => Promise<PromptResponse | undefined>;
    cancel: () => Promise<void>;
};
//# sourceMappingURL=usePrompt.d.ts.map