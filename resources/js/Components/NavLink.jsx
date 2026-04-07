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
                'w-full flex items-center px-4 py-3 rounded-xl transition-all ' +
                (active ?
                    'bg-gradient-to-r from-indigo-200 to-purple-100 text-indigo-700 shadow-md' :
                    'text-gray-700 hover:bg-gray-200 ') +
                className
            }
        >
            <Icon className={
                'size-5 mr-2 text-gray-500' +
                (active ? ' text-indigo-600' : ' text-gray-500')} />
            {children}
        </Link>
    );
}
