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
                `inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-cyber-border bg-white dark:bg-cyber-surface/50 px-6 py-3 text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 shadow-sm transition-all duration-150 ease-in-out hover:bg-slate-50 dark:hover:bg-cyber-border/30 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:focus:ring-offset-cyber-void active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    disabled && 'opacity-50'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
