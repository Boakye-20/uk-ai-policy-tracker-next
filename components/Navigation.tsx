'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Search,
    TrendingUp,
    CheckSquare,
    Building2,
    Tag,
    Info
} from 'lucide-react';

const navigation = [
    { name: 'Executive Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Policy Explorer', href: '/policy-explorer', icon: Search },
    { name: 'Analytics & Insights', href: '/analytics', icon: TrendingUp },
    { name: 'Regulations', href: '/regulations', icon: CheckSquare },
    { name: 'Department Analysis', href: '/departments', icon: Building2 },
    { name: 'Topic Intelligence', href: '/topics', icon: Tag },
    { name: 'About', href: '/about', icon: Info },
];

export default function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-8 overflow-x-auto">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  flex items-center gap-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${isActive
                                        ? 'border-primary-500 text-primary-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                `}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
