export interface SettingsContextValue {
    theme: 'dark' | 'light';
    setTheme: (theme: 'dark' | 'light') => void;
}
export declare const SettingsContext: import("react").Context<SettingsContextValue | null>;
export declare function useSettings(): SettingsContextValue;
//# sourceMappingURL=SettingsContext.d.ts.map