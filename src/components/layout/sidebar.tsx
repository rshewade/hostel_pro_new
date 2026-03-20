'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Home, FileText, CreditCard, DoorOpen, CalendarDays,
  FolderOpen, Settings, ClipboardCheck,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'dashboard', href: '/dashboard/student', icon: Home, roles: ['STUDENT'] },
  { label: 'fees', href: '/dashboard/student/fees', icon: CreditCard, roles: ['STUDENT'] },
  { label: 'leave', href: '/dashboard/student/leave', icon: CalendarDays, roles: ['STUDENT'] },
  { label: 'documents', href: '/dashboard/student/documents', icon: FolderOpen, roles: ['STUDENT'] },
  { label: 'room', href: '/dashboard/student/room', icon: DoorOpen, roles: ['STUDENT'] },
  { label: 'dashboard', href: '/dashboard/superintendent', icon: Home, roles: ['SUPERINTENDENT'] },
  { label: 'rooms', href: '/dashboard/superintendent/rooms', icon: DoorOpen, roles: ['SUPERINTENDENT'] },
  { label: 'leaves', href: '/dashboard/superintendent/leaves', icon: CalendarDays, roles: ['SUPERINTENDENT'] },
  { label: 'config', href: '/dashboard/superintendent/config', icon: Settings, roles: ['SUPERINTENDENT'] },
  { label: 'dashboard', href: '/dashboard/trustee', icon: Home, roles: ['TRUSTEE'] },
  { label: 'applications', href: '/dashboard/trustee/applications', icon: FileText, roles: ['TRUSTEE'] },
  { label: 'interviews', href: '/dashboard/trustee/interviews', icon: ClipboardCheck, roles: ['TRUSTEE'] },
  { label: 'dashboard', href: '/dashboard/accounts', icon: Home, roles: ['ACCOUNTS'] },
  { label: 'dashboard', href: '/dashboard/parent', icon: Home, roles: ['PARENT'] },
  { label: 'leave', href: '/dashboard/parent/leave', icon: CalendarDays, roles: ['PARENT'] },
];

export function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const t = useTranslations('Common');

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/" className="text-xl font-bold text-blue-700">
          {t('appName')}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label.charAt(0).toUpperCase() + item.label.slice(1)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
