import { sessionStore } from '@acp-components/core';
type SessionStoreState = ReturnType<typeof sessionStore.getState>;
export declare function useSessionStore(): SessionStoreState;
export declare function useSessionStore<T>(selector: (state: SessionStoreState) => T): T;
export {};
//# sourceMappingURL=useSessionStore.d.ts.map