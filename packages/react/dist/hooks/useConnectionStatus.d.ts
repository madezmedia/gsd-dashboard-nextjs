export declare function useConnectionStatus(agentId: string): {
    agentId: string;
    status: import("@acp-components/core").ConnectionStatus;
    isConnected: boolean;
    isConnecting: boolean;
    hasError: boolean;
    agentName: string;
    agentVersion: string | undefined;
};
export declare function useAllAgentStatuses(): {
    agents: import("@acp-components/core").AgentConnection[];
    overallStatus: string;
};
//# sourceMappingURL=useConnectionStatus.d.ts.map