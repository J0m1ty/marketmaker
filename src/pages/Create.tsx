import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { columns } from "@/model/market.columns";
import type { MarketRow } from "@/model/market.schema";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TableButton } from "@/components/table-button";
import { hasUserData, useDataStore } from "@/model/market.data";
import { convertToCSV, convertToMarketFile, downloadFile } from "@/lib/download";
import { ClearDialog } from "@/components/clear-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Info, SquareFunction } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

const NUMERIC_ILLEGAL_CHARS = /[^\d]/g;
const FILENAME_ILLEGAL_CHARS = /[<>:"/\\|?*.]/g;

const columnMap: { [key: number]: keyof MarketRow } = {
    1: "price",
    2: "qd",
    3: "qs"
};

export const Create = () => {
    const [lines, setLines] = useState<number>(10);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const { data, filename, setFilename, resetData, updateData } = useDataStore();

    // fill dialog
    const [showFillDialog, setShowFillDialog] = useState(false);
    const [fillColumnIndex, setFillColumnIndex] = useState<number>(0);
    const [selectedFillType, setSelectedFillType] = useState<"linear" | "power" | "logarithmic">("linear");
    const [defaultFillType, setDefaultFillType] = useState<"linear" | "power" | "logarithmic">("linear");
    const [allowedFillType, setAllowedFillType] = useState<"linear" | "all">("linear");

    // fill options
    const [startingValue, setStartingValue] = useState<number>(1);
    const [stepSize, setStepSize] = useState<number>(1);
    const [coefficient, setCoefficient] = useState<number>(1);
    const [exponent, setExponent] = useState<number>(2);
    const [offset, setOffset] = useState<number>(0);
    const [preventNegativeValues, setPreventNegativeValues] = useState<boolean>(true);

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

        const propertyName = columnMap[colIndex];
        if (!propertyName) return;

        updateData(prevData =>
            prevData.map((row, index) =>
                index === rowIndex ? { ...row, [propertyName]: clean } : row
            )
        );
    };

    const handleFillData = (columnIndex: number, linear: boolean, allowed: "linear" | "all") => {
        const fillType = (linear || allowed == "linear") ? "linear" : "power";

        setFillColumnIndex(columnIndex);
        setDefaultFillType(fillType);
        setSelectedFillType(fillType);
        setAllowedFillType(allowed);
        clearFillOptions();
        setShowFillDialog(true);
    }

    const clearFillOptions = () => {
        setStartingValue(1);
        setStepSize(1);
        setCoefficient(1);
        setExponent(2);
        setOffset(0);
    }

    const handleFillOperation = () => {
        const fillValue = (rowIndex: number) => {
            const x = startingValue + (rowIndex * stepSize);
            switch (selectedFillType) {
                case "linear":
                    return coefficient * x + offset;
                case "power":
                    return coefficient * Math.pow(x, exponent) + offset;
                case "logarithmic":
                    return coefficient * Math.log(x) + offset;
                default:
                    return 0;
            }
        };

        updateData(prevData =>
            prevData.map((row, index) => {
                const value = fillValue(index);
                const finalValue = preventNegativeValues && value < 0 ? 0 : value;
                return {
                    ...row,
                    [columnMap[fillColumnIndex]]: Number(finalValue.toFixed(3)).toString()
                };
            })
        );
    }

    const handleFlipColumn = (columnIndex: number) => {
        // Flip the order of the values in the specified column
        const propertyName = columnMap[columnIndex];
        if (!propertyName) return;

        updateData(prevData => {
            const values = prevData.map(row => row[propertyName]);
            const flippedValues = values.reverse();
            return prevData.map((row, index) => ({
                ...row,
                [propertyName]: flippedValues[index]
            }));
        });
    };

    const handleClearColumn = (columnIndex: number) => {
        const propertyName = columnMap[columnIndex];
        if (!propertyName) return;

        updateData(prevData =>
            prevData.map(row => ({ ...row, [propertyName]: "0" }))
        );
    };

    const handleSave = () => {
        const marketFile = convertToMarketFile(data);
        const csvContent = convertToCSV(marketFile);
        downloadFile(csvContent, filename ?? "Untitled");
    };

    const handleRename = () => {
        const input = document.getElementById('filename-input') as HTMLInputElement;
        if (input) {
            input.focus();
        }
    };

    return (
        <>
            <div className="flex flex-1 flex-col min-h-0">
                <div className="flex flex-row w-fit rounded-t-2xl items-center mt-2 bg-neutral-200 dark:bg-neutral-800">
                    <Input
                        id="filename-input"
                        className="border-0 focus-visible:ring-0 rounded-none w-[10em] ml-1 dark:bg-transparent"
                        placeholder="Untitled"
                        value={filename}
                        onChange={handleFilenameChange}
                    />
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <TableButton className="mr-3" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={handleRename}>
                                Rename
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <DataTable
                    columns={columns}
                    data={data}
                    onUpdateData={handleUpdateData}
                    onFillColumn={handleFillData}
                    onFlipColumn={handleFlipColumn}
                    onClearColumn={handleClearColumn}
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
                confirmSource="clear"
                showConfirmDialog={showConfirmDialog}
                setShowConfirmDialog={setShowConfirmDialog}
                resetData={resetData}
            />
            <Dialog open={showFillDialog} onOpenChange={setShowFillDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Populate column #{fillColumnIndex}</DialogTitle>

                    </DialogHeader>
                    <Tabs defaultValue={defaultFillType} className="w-full gap-4">
                        <TabsList className="w-full justify-center">
                            <TabsTrigger value="linear" onClick={() => (clearFillOptions(), setSelectedFillType("linear"))}>Linear</TabsTrigger>
                            <TabsTrigger value="power" disabled={allowedFillType !== "all"} onClick={() => (clearFillOptions(), setSelectedFillType("power"))}>Power</TabsTrigger>
                            <TabsTrigger value="logarithmic" disabled={allowedFillType !== "all"} onClick={() => (clearFillOptions(), setSelectedFillType("logarithmic"))}>Logarithmic</TabsTrigger>
                        </TabsList>
                        <TabsContent value="linear" className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="linear_equation">Formula</Label>
                                <div id="linear_equation" className="flex flex-row justify-between w-full px-3 py-1 rounded-md border-1 bg-neutral-100 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
                                    <span className="font-mono text-neutral-800 dark:text-neutral-400">y = m · x + b</span> <SquareFunction className="text-neutral-500 dark:text-neutral-500" />
                                </div>
                            </div>
                            <div className="flex flex-row w-full gap-2">
                                <div className="grid w-full items-center gap-2">
                                    <div className="flex flex-row items-center gap-1">
                                        <Label htmlFor="linear_start">Start</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild><Info size={16} className="-translate-y-[2px] text-neutral-700" /></TooltipTrigger>
                                            <TooltipContent className="max-w-m">
                                                The starting X value for the first row.
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="linear_start"
                                        type="number"
                                        defaultValue={1}
                                        onChange={(e) => setStartingValue(parseFloat(e.target.value) || 1)}
                                    />
                                </div>
                                <div className="grid w-full items-center gap-2">
                                    <div className="flex flex-row items-center gap-1">
                                        <Label htmlFor="linear_step">Step</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild><Info size={16} className="-translate-y-[2px] text-neutral-700" /></TooltipTrigger>
                                            <TooltipContent className="max-w-m">
                                                How much each row increments the X value.
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="linear_step"
                                        type="number"
                                        defaultValue={1}
                                        onChange={(e) => setStepSize(parseFloat(e.target.value) || 1)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-row w-full gap-2">
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="linear_coefficient">Coefficient (m)</Label>
                                    <Input
                                        id="linear_coefficient"
                                        type="number"
                                        defaultValue={1}
                                        onChange={(e) => setCoefficient(parseFloat(e.target.value) || 1)}
                                    />
                                </div>
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="linear_offset">Offset (b)</Label>
                                    <Input
                                        id="linear_offset"
                                        type="number"
                                        defaultValue={0}
                                        onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="power" className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="power_equation">Formula</Label>
                                <div id="power_equation" className="flex flex-row justify-between w-full px-3 py-1 rounded-md border-1 bg-neutral-100 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
                                    <span className="font-mono text-neutral-800 dark:text-neutral-400">y = a · x<sup>b</sup> + c</span> <SquareFunction className="text-neutral-500 dark:text-neutral-500" />
                                </div>
                            </div>
                            <div className="flex flex-row w-full gap-2">
                                <div className="grid w-full items-center gap-2">
                                    <div className="flex flex-row items-center gap-1">
                                        <Label htmlFor="power_start">Start</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild><Info size={16} className="-translate-y-[2px] text-neutral-700" /></TooltipTrigger>
                                            <TooltipContent className="max-w-m">
                                                The starting X value for the first row.
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="power_start"
                                        type="number"
                                        defaultValue={1}
                                        onChange={(e) => setStartingValue(parseFloat(e.target.value) || 1)}
                                    />
                                </div>
                                <div className="grid w-full items-center gap-2">
                                    <div className="flex flex-row items-center gap-1">
                                        <Label htmlFor="power_step">Step</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild><Info size={16} className="-translate-y-[2px] text-neutral-700" /></TooltipTrigger>
                                            <TooltipContent className="max-w-m">
                                                How much each row increments the X value.
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="power_step"
                                        type="number"
                                        defaultValue={1}
                                        onChange={(e) => setStepSize(parseFloat(e.target.value) || 1)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-row w-full gap-2">
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="power_coefficient">Coefficient (a)</Label>
                                    <Input
                                        id="power_coefficient"
                                        type="number"
                                        defaultValue={1}
                                        onChange={(e) => setCoefficient(parseFloat(e.target.value) || 1)}
                                    />
                                </div>
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="power_exponent">Exponent (b)</Label>
                                    <Input
                                        id="power_exponent"
                                        type="number"
                                        defaultValue={2}
                                        onChange={(e) => setExponent(parseFloat(e.target.value) || 2)}
                                    />
                                </div>
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="power_offset">Offset (c)</Label>
                                    <Input
                                        id="power_offset"
                                        type="number"
                                        defaultValue={0}
                                        onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="logarithmic" className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="log_equation">Formula</Label>
                                <div id="log_equation" className="flex flex-row justify-between w-full px-3 py-1 rounded-md border-1 bg-neutral-100 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
                                    <span className="font-mono text-neutral-800 dark:text-neutral-400">y = a · ln(x) + b</span> <SquareFunction className="text-neutral-500 dark:text-neutral-500" />
                                </div>
                            </div>
                            <div className="flex flex-row w-full gap-2">
                                <div className="grid w-full items-center gap-2">
                                    <div className="flex flex-row items-center gap-1">
                                        <Label htmlFor="log_start">Start</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild><Info size={16} className="-translate-y-[2px] text-neutral-700" /></TooltipTrigger>
                                            <TooltipContent className="max-w-m">
                                                The starting X value for the first row.
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="log_start"
                                        type="number"
                                        defaultValue={1}
                                        onChange={(e) => setStartingValue(parseFloat(e.target.value) || 1)}
                                    />
                                </div>
                                <div className="grid w-full items-center gap-2">
                                    <div className="flex flex-row items-center gap-1">
                                        <Label htmlFor="log_step">Step</Label>
                                        <Tooltip>
                                            <TooltipTrigger asChild><Info size={16} className="-translate-y-[2px] text-neutral-700" /></TooltipTrigger>
                                            <TooltipContent className="max-w-m">
                                                How much each row increments the X value.
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="log_step"
                                        type="number"
                                        defaultValue={1}
                                        onChange={(e) => setStepSize(parseFloat(e.target.value) || 1)}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-row w-full gap-2">
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="log_coefficient">Coefficient (a)</Label>
                                    <Input
                                        id="log_coefficient"
                                        type="number"
                                        defaultValue={1}
                                        onChange={(e) => setCoefficient(parseFloat(e.target.value) || 1)}
                                    />
                                </div>
                                <div className="grid w-full items-center gap-2">
                                    <Label htmlFor="log_offset">Offset (b)</Label>
                                    <Input
                                        id="log_offset"
                                        type="number"
                                        defaultValue={0}
                                        onChange={(e) => setOffset(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                    <div className="flex flex-row justify-start items-center gap-2">
                        <Checkbox checked={preventNegativeValues} onCheckedChange={(checked) => setPreventNegativeValues(checked === "indeterminate" ? true : checked)} />
                        <span>Prevent negative values</span>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowFillDialog(false);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            handleFillOperation();
                            setShowFillDialog(false);
                        }}>
                            Fill
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}