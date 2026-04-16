import type { Table } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  hideSearch?: boolean
  searchColumn?: string
  searchPlaceholder?: string
  actions?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  hideSearch = false,
  searchColumn = 'name',
  searchPlaceholder = 'Filter...',
  actions,
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        {!hideSearch && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
            onChange={(e) =>
              table.getColumn(searchColumn)?.setFilterValue(e.target.value)
            }
            className="h-8 w-full sm:w-[200px] lg:w-[250px]"
          />
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
