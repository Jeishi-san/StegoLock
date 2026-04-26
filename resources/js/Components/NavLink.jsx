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
                'w-full flex items-center px-4 py-3 rounded-xl transition-all font-medium ' +
                (active ?
                    'bg-cyber-accent text-cyber-void shadow-glow-cyan' :
                    'text-slate-400 hover:bg-cyber-surface hover:text-white') +
                ' ' + className
            }
        >
            {Icon && (
                <Icon className={
                    'size-5 mr-3 ' +
                    (active ? 'text-cyber-void' : 'text-slate-500 group-hover:text-cyber-accent')} 
                />
            )}
            {children}
        </Link>
    );
}
