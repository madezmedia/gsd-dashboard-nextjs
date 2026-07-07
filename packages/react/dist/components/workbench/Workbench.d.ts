import React from 'react';
export interface WorkbenchProps {
    sidebar?: React.ReactNode;
    main?: React.ReactNode;
    panel?: React.ReactNode;
    className?: string;
    /** Initial sidebar width in pixels (default: 260) */
    sidebarWidth?: number;
    /** Initial panel width in pixels (default: 360) */
    panelWidth?: number;
    /** Minimum sidebar width (default: 180) */
    minSidebarWidth?: number;
    /** Maximum sidebar width (default: 480) */
    maxSidebarWidth?: number;
    /** Minimum panel width (default: 240) */
    minPanelWidth?: number;
    /** Maximum panel width (default: 600) */
    maxPanelWidth?: number;
    /** Called when sidebar width changes during drag */
    onSidebarWidthChange?: (width: number) => void;
    /** Called when panel width changes during drag */
    onPanelWidthChange?: (width: number) => void;
}
export declare function Workbench({ sidebar, main, panel, className, sidebarWidth, panelWidth, minSidebarWidth, maxSidebarWidth, minPanelWidth, maxPanelWidth, onSidebarWidthChange, onPanelWidthChange, }: WorkbenchProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Workbench.d.ts.map