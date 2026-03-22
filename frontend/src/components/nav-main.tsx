import { Link, useLocation } from 'react-router-dom'
import {
  IconLayoutDashboard,
  IconPackage,
  IconAlertTriangle,
  IconMap,
  IconReceipt,
  IconChartBar,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Хяналтын самбар', icon: IconLayoutDashboard },
  { to: '/inventory', label: 'Агуулах', icon: IconPackage },
  { to: '/alerts', label: 'Сэрэмжлүүлэг', icon: IconAlertTriangle },
  { to: '/planner', label: 'Байршлын төлөвлөгч', icon: IconMap },
  { to: '/transactions', label: 'Гүйлгээ', icon: IconReceipt },
  { to: '/reports', label: 'Тайлангууд', icon: IconChartBar },
]

export function NavMain() {
  const { pathname } = useLocation()

  return (
    <nav className="flex flex-col gap-0.5 p-3" role="navigation">
      {navItems.map(({ to, label, icon: Icon }) => {
        const isActive = pathname === to || (to !== '/' && pathname.startsWith(to))
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:scale-[0.99]'
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden strokeWidth={isActive ? 2.25 : 1.75} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
