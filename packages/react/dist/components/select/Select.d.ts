export interface SelectOption {
    value: string;
    label: string;
}
export interface SelectOptionGroup {
    label: string;
    options: SelectOption[];
}
export interface SelectProps {
    /** Flat options or grouped options */
    options: (SelectOption | SelectOptionGroup)[];
    /** Currently selected value */
    value: string;
    /** Called with the newly selected value */
    onChange: (value: string) => void;
    /** Text shown when no value is selected */
    placeholder?: string;
    disabled?: boolean;
    /** Hide the trigger border for a cleaner inline appearance */
    borderless?: boolean;
    className?: string;
    'aria-label'?: string;
    id?: string;
}
export declare function Select({ options, value, onChange, placeholder, disabled, borderless, className, 'aria-label': ariaLabel, id, }: SelectProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Select.d.ts.map