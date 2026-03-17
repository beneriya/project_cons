import type { Table } from '@tanstack/react-table'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PAGE_SIZES = [10, 25, 50, 100]

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  total?: number
}

export function DataTablePagination<TData>({
  table,
  total,
}: DataTablePaginationProps<TData>) {
  const filteredCount = table.getFilteredRowModel().rows.length
  const displayTotal = total !== undefined ? total : filteredCount

  return (
    <div className="flex flex-col gap-3 px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:py-0">
      <div className="text-muted-foreground text-xs sm:text-sm">
        <span className="hidden sm:inline">
          Total: {displayTotal.toLocaleString()} {displayTotal === 1 ? 'row' : 'rows'}
        </span>
        <span className="sm:hidden">Total: {displayTotal.toLocaleString()}</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium sm:text-sm">Rows per page:</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPagination({
                pageIndex: 0,
                pageSize: Number(value),
              })
            }}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs font-medium sm:w-[100px] sm:text-sm">
          <span className="hidden sm:inline">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <span className="sm:hidden">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-7 sm:size-8 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">First page</span>
            <IconChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Previous page</span>
            <IconChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7 sm:size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Next page</span>
            <IconChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-7 sm:size-8 lg:flex"
            onClick={() => table.setPageIndex(Math.max(0, (table.getPageCount() || 1) - 1))}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Last page</span>
            <IconChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
