import type { SessionId } from '@agentclientprotocol/sdk';
import type { AcpClient } from '../client/AcpClient';
export declare function createSession(client: AcpClient, agentId: string, cwd: string): Promise<SessionId>;
export declare function forkSession(client: AcpClient, sourceSessionId: SessionId): Promise<SessionId>;
export declare function loadSession(client: AcpClient, sessionId: SessionId, cwd: string): Promise<void>;
export declare function selectSession(client: AcpClient, sessionId: SessionId): Promise<void>;
export declare function closeSession(client: AcpClient, sessionId: SessionId): Promise<void>;
export declare function deleteSession(client: AcpClient, sessionId: SessionId): Promise<void>;
export declare function refreshSessions(client: AcpClient, agentId: string, cwd: string): Promise<void>;
export declare function loadMoreSessions(client: AcpClient, agentId: string, cwd: string, cursor: string): Promise<void>;
export declare function setSessionConfigOption(client: AcpClient, sessionId: SessionId, configId: string, value: string | boolean): Promise<void>;
export declare function authenticate(client: AcpClient, methodId: string): Promise<void>;
export declare function authenticateWithEnv(client: AcpClient, agentId: string, methodId: string, envVars: Record<string, string>): Promise<void>;
//# sourceMappingURL=sessions.d.ts.map