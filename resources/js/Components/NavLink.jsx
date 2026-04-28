import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    icon: Icon,
    variant = 'cyber', // 'cyber' (cyan) or 'indigo' (indigo/violet)
    children,
    ...props
}) {
    const isIndigo = variant === 'indigo';

    const activeClasses = isIndigo
        ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 text-indigo-700 dark:text-white shadow-md shadow-indigo-500/20 dark:shadow-[0_0_10px_rgba(99,102,241,0.2)] font-bold '
        : 'bg-gradient-to-r from-cyber-accent/10 to-cyan-500/10 dark:from-cyber-accent/20 dark:to-cyan-500/20 text-cyan-700 dark:text-white shadow-md shadow-cyan-500/20 dark:shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold ';

    const inactiveClasses = isIndigo
        ? 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-violet-500/10 dark:hover:from-indigo-500/20 dark:hover:to-violet-500/20 hover:text-indigo-700 dark:hover:text-white hover:shadow-md hover:shadow-indigo-500/20 dark:hover:shadow-[0_0_10px_rgba(99,102,241,0.2)] font-medium '
        : 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-cyber-accent/10 hover:to-cyan-500/10 dark:hover:from-cyber-accent/20 dark:hover:to-cyan-500/20 hover:text-cyan-700 dark:hover:text-white hover:shadow-md hover:shadow-cyan-500/20 dark:hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] font-medium ';

    const iconActiveClasses = isIndigo 
        ? 'text-indigo-700 dark:text-indigo-400' 
        : 'text-cyan-700 dark:text-cyber-accent';
    
    const iconInactiveClasses = 'text-slate-500 dark:text-slate-400 group-hover:text-' + (isIndigo ? 'indigo-500' : 'cyber-accent');

    return (
        <Link
            {...props}
            className={
                'w-full flex items-center px-4 py-3 rounded-xl transition-all group ' +
                (active ? activeClasses : inactiveClasses) +
                className
            }
        >
            {Icon && (
                <Icon className={
                    'size-5 mr-3 transition-colors ' +
                    (active ? iconActiveClasses : iconInactiveClasses)
                } />
            )}
            {children}
        </Link>
    );
}

