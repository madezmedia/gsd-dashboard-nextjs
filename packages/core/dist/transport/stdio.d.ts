import type { Stream } from '@agentclientprotocol/sdk';
import type { AcpTransport } from './types';
interface StdioTransportOptions {
    command: string;
    args?: string[];
    env?: Record<string, string>;
}
export declare class StdioTransport implements AcpTransport {
    private options;
    private process;
    private closeHandlers;
    private errorHandlers;
    constructor(options: StdioTransportOptions);
    connect(): Promise<Stream>;
    disconnect(): void;
    onClose(handler: () => void): () => void;
    onError(handler: (err: Error) => void): () => void;
}
export {};
//# sourceMappingURL=stdio.d.ts.map