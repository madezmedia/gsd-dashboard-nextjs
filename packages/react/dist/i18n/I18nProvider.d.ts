import React from 'react';
export interface I18nProviderProps {
    defaultLocale?: string;
    customLocales?: Record<string, Record<string, string>>;
    children: React.ReactNode;
}
export declare function I18nProvider({ defaultLocale, customLocales, children }: I18nProviderProps): React.FunctionComponentElement<import("react-i18next").I18nextProviderProps>;
//# sourceMappingURL=I18nProvider.d.ts.map