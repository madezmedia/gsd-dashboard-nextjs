import type { SessionId, ContentBlock, PromptResponse } from '@agentclientprotocol/sdk';
import type { AcpClient } from '../client/AcpClient';
export declare function sendPrompt(client: AcpClient, sessionId: SessionId, contentBlocks: ContentBlock[]): Promise<PromptResponse>;
export declare function cancelPrompt(client: AcpClient, sessionId: SessionId): Promise<void>;
//# sourceMappingURL=prompt.d.ts.map