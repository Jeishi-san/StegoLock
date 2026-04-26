export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-sm font-medium text-slate-500 dark:text-slate-400 ` +
                className
            }
        >
            {value ? value : children}
        </label>
    );
}
