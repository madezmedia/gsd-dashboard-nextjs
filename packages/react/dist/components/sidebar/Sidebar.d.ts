export interface SidebarProps {
    onBrowse?: () => Promise<string | null>;
    onNavigateFile?: (path: string, line?: number | null) => void;
    className?: string;
}
export declare function Sidebar({ onBrowse, onNavigateFile, className }: SidebarProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Sidebar.d.ts.map