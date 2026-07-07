import type { AcpClient } from '../client/AcpClient';
export declare function callExtMethod(client: AcpClient, method: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
export declare function sendExtNotification(client: AcpClient, method: string, params: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=extensions.d.ts.map