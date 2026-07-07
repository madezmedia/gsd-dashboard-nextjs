import type { AvailableCommand } from '@acp-components/core';
export interface CommandPaletteProps {
    commands: AvailableCommand[];
    onSelect: (command: AvailableCommand) => void;
    disabled?: boolean;
    /** Inline mode: no trigger button, no search input, controlled externally */
    inline?: boolean;
    /** External control of open state (inline mode) */
    open?: boolean;
    /** External query text (inline mode) */
    query?: string;
    /** External active index (inline mode, for keyboard nav) */
    activeIndex?: number;
    /** Called when the palette requests close (Escape key) */
    onClose?: () => void;
    /** Additional class name for the wrapper */
    className?: string;
}
export declare function CommandPalette({ commands, onSelect, disabled, inline, open: openProp, query: queryProp, activeIndex: activeIndexProp, onClose, className, }: CommandPaletteProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=CommandPalette.d.ts.map