import { useState, Fragment } from 'react'
import { Outlet, useLocation, Link } from 'react-router-dom'
import { IconMenu2 } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { NavMain } from '@/components/nav-main'
import { DashHead } from '@/components/dash-head'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

const PATH_LABELS: Record<string, string> = {
  '': 'Dashboard',
  inventory: 'Inventory',
  alerts: 'Alerts',
  planner: 'Planner',
  transactions: 'Transactions',
  reports: 'Reports',
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const paths = segments.length ? segments : ['']

  return (
    <div className="flex min-h-svh w-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div>
            <div className="font-semibold text-sidebar-foreground">ParquetPro</div>
            <div className="text-xs text-muted-foreground">MANAGEMENT SYSTEM</div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <NavMain />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="flex w-64 flex-col p-0 [&>button]:hidden bg-sidebar text-sidebar-foreground border-sidebar-border"
        >
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
            <div className="font-semibold text-sidebar-foreground">ParquetPro</div>
            <div className="text-xs text-muted-foreground">MANAGEMENT SYSTEM</div>
          </div>
          <div className="flex-1 overflow-auto p-2" onClick={() => setMobileOpen(false)}>
            <NavMain />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex flex-1 flex-col bg-background w-full overflow-x-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-6 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-1 size-7 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Toggle menu"
            >
              <IconMenu2 className="size-5" />
            </Button>
            <span className="hidden md:inline-block text-sm font-semibold text-foreground">ParquetPro</span>
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {paths.map((seg, i) => (
                  <Fragment key={seg}>
                    <BreadcrumbItem className="hidden md:block">
                      {i === paths.length - 1 ? (
                        <span className="font-medium text-foreground">
                          {PATH_LABELS[seg] ?? seg}
                        </span>
                      ) : (
                        <Link to={`/${paths.slice(0, i + 1).join('/')}`}>
                          {PATH_LABELS[seg] ?? seg}
                        </Link>
                      )}
                    </BreadcrumbItem>
                    {i < paths.length - 1 && (
                      <BreadcrumbSeparator className="hidden md:block" />
                    )}
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <DashHead />
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4 md:p-6 md:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
