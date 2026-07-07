import React from 'react';
export interface ResizeHandleProps {
    /** Props from useResizable handleProps (onPointerDown, onDoubleClick, onKeyDown) */
    onPointerDown: (e: React.PointerEvent) => void;
    onDoubleClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    /** Whether the handle is currently being dragged */
    isResizing?: boolean;
    /** Optional aria label for screen readers */
    'aria-label'?: string;
    /** Optional aria-valuenow (current width) */
    'aria-valuenow'?: number;
    /** Optional aria-valuemin */
    'aria-valuemin'?: number;
    /** Optional aria-valuemax */
    'aria-valuemax'?: number;
    /** Extra className */
    className?: string;
}
export declare function ResizeHandle({ onPointerDown, onDoubleClick, onKeyDown, isResizing, 'aria-label': ariaLabel, 'aria-valuenow': valueNow, 'aria-valuemin': valueMin, 'aria-valuemax': valueMax, className, }: ResizeHandleProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ResizeHandle.d.ts.map