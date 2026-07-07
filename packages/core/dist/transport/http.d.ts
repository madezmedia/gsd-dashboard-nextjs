import type { Stream } from '@agentclientprotocol/sdk';
import type { AcpTransport } from './types';
interface HttpTransportOptions {
    url: string;
    headers?: Record<string, string>;
}
export declare class HttpTransport implements AcpTransport {
    private options;
    private abortController;
    private closeHandlers;
    private errorHandlers;
    constructor(options: HttpTransportOptions);
    connect(): Promise<Stream>;
    disconnect(): void;
    onClose(handler: () => void): () => void;
    onError(handler: (err: Error) => void): () => void;
}
export {};
//# sourceMappingURL=http.d.ts.map