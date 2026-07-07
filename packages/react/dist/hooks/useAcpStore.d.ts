import { acpStore } from '@acp-components/core';
type AcpStoreState = ReturnType<typeof acpStore.getState>;
export declare function useAcpStore(): AcpStoreState;
export declare function useAcpStore<T>(selector: (state: AcpStoreState) => T): T;
export {};
//# sourceMappingURL=useAcpStore.d.ts.map