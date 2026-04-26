import { Link } from '@inertiajs/react';

export default function NavLink({
    active = true,
    className = '',
    icon: Icon,
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'w-full flex items-center px-4 py-3 rounded-xl transition-all group ' +
                (active ?
                    'bg-gradient-to-r from-cyber-accent/10 to-indigo-500/10 dark:from-cyber-accent/20 dark:to-indigo-500/20 text-indigo-700 dark:text-white shadow-md shadow-cyan-500/20 dark:shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold ' :
                    'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-cyber-accent/10 hover:to-indigo-500/10 dark:hover:from-cyber-accent/20 dark:hover:to-indigo-500/20 hover:text-indigo-700 dark:hover:text-white hover:shadow-md hover:shadow-cyan-500/20 dark:hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] font-medium ') +
                className
            }
        >
            {Icon && (
                <Icon className={
                    'size-5 mr-3 transition-colors ' +
                    (active ? 'text-indigo-700 dark:text-cyber-accent' : 'text-slate-500 dark:text-slate-400 group-hover:text-cyber-accent')} 
                />
            )}
            {children}
        </Link>
    );
}
