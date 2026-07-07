import type { Stream } from '@agentclientprotocol/sdk';
import type { AcpTransport } from './types';
interface WsTransportOptions {
    url: string;
}
export declare class WebSocketTransport implements AcpTransport {
    private options;
    private ws;
    private closeHandlers;
    private errorHandlers;
    constructor(options: WsTransportOptions);
    connect(): Promise<Stream>;
    disconnect(): void;
    onClose(handler: () => void): () => void;
    onError(handler: (err: Error) => void): () => void;
}
export {};
//# sourceMappingURL=ws.d.ts.map