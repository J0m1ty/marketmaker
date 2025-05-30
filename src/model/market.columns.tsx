import type { ColumnDef } from "@tanstack/react-table";
import type { MarketRow } from "./market.schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableButton } from "@/components/table-button";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import type { MetaType } from "@/components/data-table";

export const columns: ColumnDef<Partial<MarketRow>>[] = [
    {
        accessorKey: "id",
        enableSorting: true,
        header: ({ column }) =>
            <DropdownMenu>
                <div className="flex flex-row justify-between items-center gap-1">
                    <span>
                        #
                    </span>
                    <DropdownMenuTrigger asChild>
                        <TableButton />
                    </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end">
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Sort
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                                Ascending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                                Descending
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>,
        cell: ({ row }) => {
            return <div className="text-center text-xs">
                {row.getValue("id")}
            </div>;
        }
    },
    {
        accessorKey: "price",
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
            const a = parseFloat(rowA.getValue("price") as string) || 0;
            const b = parseFloat(rowB.getValue("price") as string) || 0;
            return a - b;
        },
        header: ({ column }) =>
            <DropdownMenu>
                <div className="flex flex-row justify-between items-center gap-1">
                    <span>
                        Unit Price
                    </span>
                    <DropdownMenuTrigger asChild>
                        <TableButton />
                    </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end">
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Sort
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                                Ascending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                                Descending
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Fill
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>
                                With 1's
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                With 5's
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                With 10's
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem variant="destructive">
                        Clear
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>,
        cell: ({ row, column, table }) => {
            const price = row.getValue("price") as string;
            const updateData = (table.options.meta as MetaType)?.updateData;

            return <SpreadsheetInput
                value={price}
                onChange={(event) => {
                    if (updateData) {
                        updateData(row.index, column.getIndex(), event.target.value, false);
                    }
                }}
                onBlur={(event) => {
                    if (updateData) {
                        updateData(row.index, column.getIndex(), event.target.value, true);
                    }
                }}
            />
        }
    },
    {
        accessorKey: "qd",
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
            const a = parseFloat(rowA.getValue("qd") as string) || 0;
            const b = parseFloat(rowB.getValue("qd") as string) || 0;
            return a - b;
        },
        header: ({ column }) =>
            <DropdownMenu>
                <div className="flex flex-row justify-between items-center gap-1">
                    <span>
                        Quantity Demanded
                    </span>
                    <DropdownMenuTrigger asChild>
                        <TableButton />
                    </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end">
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Sort
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                                Ascending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                                Descending
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Fill
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>
                                With 1's
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                With 2's
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                With 5's
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                With 10's
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem variant="destructive">
                        Clear
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>,
        cell: ({ row, column, table }) => {
            const qd = row.getValue("qd") as string;
            const updateData = (table.options.meta as MetaType)?.updateData;

            return <SpreadsheetInput
                value={qd}
                onChange={(event) => {
                    if (updateData) {
                        updateData(row.index, column.getIndex(), event.target.value, false);
                    }
                }}
                onBlur={(event) => {
                    if (updateData) {
                        updateData(row.index, column.getIndex(), event.target.value, true);
                    }
                }}
            />
        }
    },
    {
        accessorKey: "qs",
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
            const a = parseFloat(rowA.getValue("qs") as string) || 0;
            const b = parseFloat(rowB.getValue("qs") as string) || 0;
            return a - b;
        },
        header: ({ column }) =>
            <DropdownMenu>
                <div className="flex flex-row justify-between items-center gap-1">
                    <span>
                        Quantity Supplied
                    </span>
                    <DropdownMenuTrigger asChild>
                        <TableButton />
                    </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent align="end">
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Sort
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                                Ascending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                                Descending
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            Fill
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>
                                With 1's
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                With 2's
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                With 5's
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                With 10's
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem variant="destructive">
                        Clear
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>,
        cell: ({ row, column, table }) => {
            const qs = row.getValue("qs") as string;
            const updateData = (table.options.meta as MetaType)?.updateData;

            return <SpreadsheetInput
                value={qs}
                onChange={(event) => {
                    if (updateData) {
                        updateData(row.index, column.getIndex(), event.target.value, false);
                    }
                }}
                onBlur={(event) => {
                    if (updateData) {
                        updateData(row.index, column.getIndex(), event.target.value, true);
                    }
                }}
            />
        }
    }
];
