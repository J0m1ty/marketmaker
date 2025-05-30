import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { columns } from "@/model/market.columns";
import type { MarketRow } from "@/model/market.schema";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableButton } from "@/components/table-button";
import { hasUserData, useCreateStore } from "@/model/market.data";
import { convertToCSV, convertToMarketFile, downloadFile } from "@/lib/download";
import { ClearDialog } from "@/components/clear-dialog";

const NUMERIC_ILLEGAL_CHARS = /[^\d]/g;
const FILENAME_ILLEGAL_CHARS = /[<>:"/\\|?*.]/g;

export const Create = () => {
    const [lines, setLines] = useState<number>(10);
    const [filename, setFilename] = useState<string>("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const { data, resetData, updateData } = useCreateStore();

    const handleLinesChange = (e: ChangeEvent<HTMLInputElement>) => {
        const sanitized = e.target.value.replace(NUMERIC_ILLEGAL_CHARS, '');
        setLines(sanitized ? parseInt(sanitized, 10) : 0);
    };

    const handleFilenameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const sanitized = e.target.value.replace(FILENAME_ILLEGAL_CHARS, '');
        setFilename(sanitized);
    };

    const handleAddRows = () => {
        const newRows = Array.from({ length: lines }, (_, index) => ({
            id: data.length + index + 1,
            price: "0",
            qd: "0",
            qs: "0"
        }));
        updateData(prevData => [...prevData, ...newRows]);
    };

    const handleUpdateData = (rowIndex: number, colIndex: number, value?: string, submit?: boolean) => {
        let clean = (value ?? '').replace(/[^\d.]/g, '');

        if (submit) {
            const dotIndex = clean.indexOf('.');
            if (dotIndex !== -1) {
                clean = clean.substring(0, dotIndex + 1) + clean.substring(dotIndex + 1).replace(/\./g, '');
            }

            clean = `${isNaN(Number(clean)) ? '0' : Number(clean)}`;
        }

        const columnMap: { [key: number]: keyof MarketRow } = {
            1: "price",
            2: "qd",
            3: "qs"
        };

        const propertyName = columnMap[colIndex];
        if (!propertyName) return;

        updateData(prevData =>
            prevData.map((row, index) =>
                index === rowIndex ? { ...row, [propertyName]: clean } : row
            )
        );
    };

    const handleSave = () => {
        const marketFile = convertToMarketFile(data);
        const csvContent = convertToCSV(marketFile);
        downloadFile(csvContent, filename ?? "Untitled");
    };

    return (
        <>
            <div className="flex flex-1 flex-col min-h-0">
                <div className="flex flex-row w-fit rounded-t-2xl items-center mt-2 bg-neutral-200 dark:bg-neutral-800">
                    <Input
                        className="border-0 focus-visible:ring-0 rounded-none w-[10em] ml-1 dark:bg-transparent"
                        placeholder="Untitled"
                        value={filename}
                        onChange={handleFilenameChange}
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <TableButton className="mr-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleSave}>
                                Save
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => setShowConfirmDialog(true)} disabled={!hasUserData(data)}>
                                Clear
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <DataTable
                    columns={columns}
                    data={data}
                    onUpdateData={handleUpdateData}
                />
                <div className="flex flex-row justify-between items-center p-2">
                    <div className="flex flex-row items-center">
                        <Button
                            variant="ghost"
                            className="underline px-3 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                            onClick={handleAddRows}
                        >
                            Add
                        </Button>
                        <Input
                            className="mx-2 w-[4em]"
                            inputMode="numeric"
                            value={lines}
                            onChange={handleLinesChange}
                        />
                        <span>more rows at bottom</span>
                    </div>
                    <div className="flex flex-row gap-2">
                        <Button variant="destructive" onClick={() => setShowConfirmDialog(true)} disabled={!hasUserData(data)}>
                            Clear
                        </Button>
                        <Button onClick={handleSave}>
                            Download
                        </Button>
                    </div>
                </div>
            </div>
            <ClearDialog
                showConfirmDialog={showConfirmDialog}
                setShowConfirmDialog={setShowConfirmDialog}
                resetData={resetData}
            />
        </>
    );
}