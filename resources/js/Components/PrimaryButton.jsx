export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-xl border border-transparent bg-cyber-accent px-6 py-3 text-sm font-bold text-white dark:text-cyber-void transition-all duration-150 ease-in-out hover:bg-slate-900 dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-cyber-accent focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-cyber-void shadow-lg dark:shadow-glow-cyan active:scale-95 ${
                    disabled && 'opacity-50 cursor-not-allowed'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
