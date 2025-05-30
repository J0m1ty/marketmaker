import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export interface MetaType {
    updateData?: (rowIndex: number, columnIndex: number, value?: string, submit?: boolean) => void;
}

interface DataTableProps<TData, TValue> extends MetaType {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onUpdateData?: (rowIndex: number, columnIndex: number, value?: string, submit?: boolean) => void;
}

export const DataTable = <TData, TValue>({
    columns,
    data,
    onUpdateData,
}: DataTableProps<TData, TValue>) => {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        meta: {
            updateData: onUpdateData
        }
    });

    return (
        <div
            className="relative overflow-auto"
        >
            <Table>
                <TableHeader className="sticky top-0 bg-neutral-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-800">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row, y) => (
                        <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className={`${y % 2 == 0 ? "bg-white dark:bg-black" : "bg-neutral-50 dark:bg-neutral-900/50"}`}
                        >
                            {row.getVisibleCells().map((cell, x) => (
                                <TableCell key={cell.id} className={`${x == 0 ? "border-b-1 border-b-neutral-200 dark:border-b-neutral-800 border-r-2 border-r-neutral-400 dark:border-r-neutral-700" : ""} p-0`}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}