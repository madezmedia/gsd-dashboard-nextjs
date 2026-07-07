export interface UseResizableOptions {
    /** Initial width in pixels */
    initialWidth: number;
    /** Minimum width in pixels */
    minWidth?: number;
    /** Maximum width in pixels */
    maxWidth?: number;
    /**
     * Drag direction semantics:
     * - 'left': moving pointer right increases width (sidebar on the left)
     * - 'right': moving pointer left increases width (panel on the right)
     */
    direction: 'left' | 'right';
    /** Called while dragging */
    onChange?: (width: number) => void;
}
export interface UseResizableReturn {
    width: number;
    isResizing: boolean;
    /** Reset to initial width */
    reset: () => void;
    /** Imperatively set width (clamped) */
    setWidth: (w: number) => void;
    /** Props to spread on the drag handle element */
    handleProps: {
        onPointerDown: (e: React.PointerEvent) => void;
        onDoubleClick: () => void;
        onKeyDown: (e: React.KeyboardEvent) => void;
    };
}
export declare function useResizable({ initialWidth, minWidth, maxWidth, direction, onChange, }: UseResizableOptions): UseResizableReturn;
//# sourceMappingURL=useResizable.d.ts.map