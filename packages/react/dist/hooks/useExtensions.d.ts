export declare function useExtensions(): {
    callExtMethod: (agentId: string, method: string, params: Record<string, unknown>) => Promise<Record<string, unknown>>;
    sendExtNotification: (agentId: string, method: string, params: Record<string, unknown>) => Promise<void>;
};
//# sourceMappingURL=useExtensions.d.ts.map