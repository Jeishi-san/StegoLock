export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-xl border border-slate-200 dark:border-cyber-border bg-white dark:bg-cyber-surface/50 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:text-slate-400 shadow-sm transition duration-150 ease-in-out hover:bg-slate-50 dark:hover:bg-cyber-surface focus:outline-none focus:ring-2 focus:ring-cyber-accent focus:ring-offset-2 dark:focus:ring-offset-cyber-void disabled:opacity-25 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
