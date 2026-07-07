import React from 'react';
type DropdownPlacement = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
export interface DropdownProps {
    children: React.ReactNode;
    placement?: DropdownPlacement;
    className?: string;
}
declare function DropdownRoot({ children, placement, className }: DropdownProps): import("react/jsx-runtime").JSX.Element;
export interface DropdownTriggerProps {
    children: React.ReactNode;
    /** When true, clones child element and attaches ref/onClick directly (no wrapper button). */
    asChild?: boolean;
    className?: string;
}
declare function Trigger({ children, asChild, className }: DropdownTriggerProps): import("react/jsx-runtime").JSX.Element;
export interface DropdownContentProps {
    children: React.ReactNode;
    className?: string;
    /** Panel width in pixels. Default: 220 */
    width?: number;
}
declare function Content({ children, className, width }: DropdownContentProps): import("react/jsx-runtime").JSX.Element | null;
export interface DropdownSectionProps {
    children: React.ReactNode;
    label?: string;
}
declare function Section({ children, label }: DropdownSectionProps): import("react/jsx-runtime").JSX.Element;
export interface DropdownItemProps {
    /** Icon element rendered on the left */
    icon?: React.ReactNode;
    /** Primary label text */
    label: React.ReactNode;
    /** Secondary value text rendered on the right (before children/chevron) */
    value?: React.ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    /** Extra slot on the right edge (e.g. toggle switch, badge) */
    children?: React.ReactNode;
    className?: string;
    /** ARIA role override. Default: "menuitem" */
    role?: string;
    /** For switch-like items */
    'aria-checked'?: boolean;
}
declare function Item({ icon, label, value, disabled, onClick, children, className, role, 'aria-checked': ariaChecked, }: DropdownItemProps): import("react/jsx-runtime").JSX.Element;
export interface DropdownSubmenuProps {
    icon?: React.ReactNode;
    label: React.ReactNode;
    value?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}
declare function Submenu({ icon, label, value, children, className }: DropdownSubmenuProps): import("react/jsx-runtime").JSX.Element;
export interface DropdownSubmenuItemProps {
    label: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    className?: string;
}
declare function SubmenuItem({ label, active, onClick, className }: DropdownSubmenuItemProps): import("react/jsx-runtime").JSX.Element;
export declare const Dropdown: typeof DropdownRoot & {
    Trigger: typeof Trigger;
    Content: typeof Content;
    Section: typeof Section;
    Item: typeof Item;
    Submenu: typeof Submenu;
    SubmenuItem: typeof SubmenuItem;
};
export {};
//# sourceMappingURL=Dropdown.d.ts.map