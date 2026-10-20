import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { BoatLoading } from "@/components/ui/boat-loading"
import { useLocale } from "@/i18n/LocaleContext"

export interface DataTableColumn<T> {
  key: string
  header: React.ReactNode
  render: (row: T, rowIndex: number) => React.ReactNode
  headClassName?: string
  cellClassName?: string
}

export interface DataTableHeaderGroup {
  header: React.ReactNode
  span: number
  headClassName?: string
}

export interface PaginatedDataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => React.Key
  loading?: boolean
  emptyMessage?: string
  pageSizeOptions?: number[]
  defaultPageSize?: number
  minTableWidth?: string
  onRowClick?: (row: T) => void
  bordered?: boolean
  stickyFirstColumn?: boolean
  stickyLastColumn?: boolean
  stickyLastColumnCount?: number
  lastStickyColumnWidth?: string
  headerGroups?: DataTableHeaderGroup[]
  renderFooter?: () => React.ReactNode
}

export function PaginatedDataTable<T>({
  data,
  columns,
  rowKey,
  loading = false,
  emptyMessage,
  pageSizeOptions = [10, 20, 50],
  defaultPageSize = 10,
  minTableWidth,
  onRowClick,
  bordered = true,
  stickyFirstColumn = false,
  stickyLastColumn = false,
  stickyLastColumnCount,
  lastStickyColumnWidth = "16rem",
  headerGroups,
  renderFooter,
}: PaginatedDataTableProps<T>) {
  const { t } = useLocale()
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(defaultPageSize)
  const pageCount = Math.max(1, Math.ceil(data.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const startIndex = (safePage - 1) * pageSize
  const visibleRows = data.slice(startIndex, startIndex + pageSize)

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const resolvedEmpty = emptyMessage ?? t("common.noRecords")
  const lastStickyCount = stickyLastColumnCount ?? (stickyLastColumn ? 1 : 0)

  const stickyRightClass = (columnIndex: number, isHeader: boolean) => {
    if (lastStickyCount <= 0 || columnIndex < columns.length - lastStickyCount) return undefined
    const fromEnd = columns.length - 1 - columnIndex
    return cn(
      "sticky border-l border-l-primary/25",
      isHeader ? "bg-[#f5f7fa]" : "bg-card",
      fromEnd === 0
        ? cn(isHeader ? "z-40" : "z-30", "right-0 shadow-[inset_1px_0_0_hsl(var(--border)),-6px_0_10px_-8px_hsl(var(--foreground))]")
        : cn(isHeader ? "z-30" : "z-20", "shadow-[inset_1px_0_0_hsl(var(--border))]")
    )
  }

  const stickyRightStyle = (columnIndex: number): React.CSSProperties | undefined => {
    if (lastStickyCount <= 0 || columnIndex < columns.length - lastStickyCount) return undefined
    const fromEnd = columns.length - 1 - columnIndex
    if (fromEnd === 0) return undefined
    return { right: lastStickyColumnWidth }
  }

  const changePageSize = (value: string) => {
    setPageSize(Number(value))
    setPage(1)
  }

  const colBorder = (columnIndex: number) => {
    const isLast = columnIndex === columns.length - 1
    if (isLast) return undefined
    return bordered ? "border-r border-primary/25" : "border-r border-border"
  }

  const groupBorder = (end: number) => colBorder(end - 1)

  const stickyFirstClass = (isHeader: boolean) =>
    cn(
      "sticky left-0 border-r border-border",
      isHeader ? "z-30 bg-[#f5f7fa]" : "z-20 bg-card",
    )

  const groupedHeaders = React.useMemo(() => {
    if (!headerGroups?.length) return null
    let cursor = 0
    return headerGroups.map((group) => {
      const start = cursor
      cursor += group.span
      return { ...group, start, end: cursor }
    })
  }, [headerGroups])

  return (
    <div className={cn(
      "w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-card",
      bordered ? "border border-primary/25" : "border border-border"
    )}>
      <Table
        className={minTableWidth ? "w-max" : undefined}
        style={
          minTableWidth
            ? // Fill the scrollport when wider than content so sticky last columns
              // stay at the table edge (avoids a huge gap at ~75% browser zoom).
              { minWidth: `max(100%, ${minTableWidth})` }
            : undefined
        }
      >
        <TableHeader className="bg-[#f5f7fa]">
          {groupedHeaders ? (
            <>
              <TableRow className="hover:bg-transparent">
                {groupedHeaders.map((group) => {
                  const isSingle = group.span === 1
                  return (
                    <TableHead
                      key={`${group.start}-${group.header}`}
                      rowSpan={isSingle ? 2 : 1}
                      colSpan={isSingle ? 1 : group.span}
                      style={isSingle ? stickyRightStyle(group.start) : undefined}
                      className={cn(
                        "border-b font-semibold text-foreground text-center",
                        stickyFirstColumn && group.start === 0 ? stickyFirstClass(true) : groupBorder(group.end),
                        isSingle && stickyRightClass(group.start, true),
                        isSingle ? columns[group.start]?.headClassName : group.headClassName
                      )}
                    >
                      {group.header}
                    </TableHead>
                  )
                })}
              </TableRow>
              <TableRow className="hover:bg-transparent">
                {groupedHeaders.flatMap((group) => {
                  if (group.span === 1) return []
                  return columns.slice(group.start, group.end).map((column, offset) => {
                    const columnIndex = group.start + offset
                    return (
                      <TableHead
                        key={column.key}
                        style={stickyRightStyle(columnIndex)}
                        className={cn(
                          "border-b font-semibold text-foreground text-center h-9",
                          colBorder(columnIndex),
                          stickyRightClass(columnIndex, true),
                          column.headClassName
                        )}
                      >
                        {column.header}
                      </TableHead>
                    )
                  })
                })}
              </TableRow>
            </>
          ) : (
            <TableRow className="hover:bg-transparent">
              {columns.map((column, columnIndex) => (
                <TableHead
                  key={column.key}
                  style={stickyRightStyle(columnIndex)}
                  className={cn(
                    "border-b font-semibold text-foreground",
                    (!stickyFirstColumn || columnIndex !== 0) && colBorder(columnIndex),
                    stickyFirstColumn && columnIndex === 0 && stickyFirstClass(true),
                    stickyRightClass(columnIndex, true),
                    column.headClassName
                  )}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-40 text-center text-muted-foreground">
                <BoatLoading />
              </TableCell>
            </TableRow>
          ) : visibleRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center align-middle text-muted-foreground">
                {resolvedEmpty}
              </TableCell>
            </TableRow>
          ) : visibleRows.map((row, index) => (
            <TableRow
              key={rowKey(row)}
              className={cn(onRowClick && "cursor-pointer")}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, columnIndex) => (
                <TableCell
                  key={column.key}
                  style={stickyRightStyle(columnIndex)}
                  className={cn(
                    "border-b",
                    (!stickyFirstColumn || columnIndex !== 0) && colBorder(columnIndex),
                    stickyFirstColumn && columnIndex === 0 && stickyFirstClass(false),
                    stickyRightClass(columnIndex, false),
                    column.cellClassName
                  )}
                >
                  {column.render(row, startIndex + index)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        {renderFooter && renderFooter()}
      </Table>

      <div className={cn(
        "flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center",
        bordered ? "border-primary/25" : "border-border"
      )}>
        <span className="whitespace-nowrap shrink-0">{t("common.totalRecords", { count: data.length })}</span>
        <div className="flex items-center gap-3">
          <Select value={String(pageSize)} onValueChange={changePageSize}>
            <SelectTrigger className="h-9 w-36 shrink-0 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>{t("common.pageSize", { count: size })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(safePage)} onValueChange={(value) => setPage(Number(value))}>
            <SelectTrigger className="h-9 w-28 shrink-0 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <SelectItem key={pageNumber} value={String(pageNumber)}>{t("common.page", { n: pageNumber })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 sm:ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={safePage === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            aria-label={t("common.prevPage")}
          >
            <ChevronLeft />
          </Button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <Button
              key={pageNumber}
              type="button"
              variant={pageNumber === safePage ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setPage(pageNumber)}
              aria-label={t("common.page", { n: pageNumber })}
              aria-current={pageNumber === safePage ? "page" : undefined}
            >
              {pageNumber}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={safePage === pageCount}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            aria-label={t("common.nextPage")}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}
