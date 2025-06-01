import { useMarketTabsStore } from "@/hooks/markets.store";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Minus } from "lucide-react";
import { useState } from "react";

export const MarketOptions = () => {
    const { getActiveTab, updateBounds } = useMarketTabsStore();
    const [activeInput, setActiveInput] = useState(0);

    const activeTab = getActiveTab();
    if (!activeTab) return null;

    return (
        <div className="flex flex-row justify-evenly gap-2 p-3">
            <Card className="gap-1 flex-1 dark:bg-neutral-900">
                <CardHeader className="text-center text-sm">
                    Window Dimensions
                </CardHeader>
                <CardContent className="flex flex-col gap-4 h-full">
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2 items-center">
                            <span className="text-muted-foreground">x:</span>
                            <Input
                                type='number'
                                value={activeInput === 1 && activeTab.bounds.quantityMin === 0 ? '' : activeTab.bounds.quantityMin}
                                onChange={(e) => {
                                    const value = parseFloat(e.currentTarget.value);
                                    const clean = isNaN(value) ? 0 : value;
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        quantityMin: clean,
                                        quantityMax: Math.max(clean + 1, activeTab.bounds.quantityMax),
                                    });
                                }}
                                onFocus={() => setActiveInput(1)}
                                onBlur={() => setActiveInput(0)}
                                disabled={activeTab.bounds.type === "auto"}
                            />
                            <Minus />
                            <Input
                                type='number'
                                value={activeInput === 2 && activeTab.bounds.quantityMax === 0 ? '' : activeTab.bounds.quantityMax}
                                onChange={(e) => {
                                    const value = parseFloat(e.currentTarget.value);
                                    const clean = isNaN(value) ? 0 : value;
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        quantityMax: clean,
                                        quantityMin: Math.min(clean - 1, activeTab.bounds.quantityMin),
                                    });
                                }}
                                onFocus={() => setActiveInput(2)}
                                onBlur={() => setActiveInput(0)}
                                disabled={activeTab.bounds.type === "auto"}
                            />
                        </div>
                        <div className="flex flex-row gap-2 items-center">
                            <span className="text-muted-foreground">y:</span>
                            <Input
                                type='number'
                                value={activeInput === 3 && activeTab.bounds.priceMin === 0 ? '' : activeTab.bounds.priceMin}
                                onChange={(e) => {
                                    const value = parseFloat(e.currentTarget.value);
                                    const clean = isNaN(value) ? 0 : value;
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        priceMin: clean,
                                        priceMax: Math.max(clean + 1, activeTab.bounds.priceMax),
                                    });
                                }}
                                onFocus={() => setActiveInput(3)}
                                onBlur={() => setActiveInput(0)}
                                disabled={activeTab.bounds.type === "auto"}
                            />
                            <Minus />
                            <Input
                                type='number'
                                value={activeInput === 4 && activeTab.bounds.priceMax === 0 ? '' : activeTab.bounds.priceMax}
                                onChange={(e) => {
                                    const value = parseFloat(e.currentTarget.value);
                                    const clean = isNaN(value) ? 0 : value;
                                    updateBounds(activeTab.market.id, {
                                        ...activeTab.bounds,
                                        priceMax: clean,
                                        priceMin: Math.min(clean - 1, activeTab.bounds.priceMin),
                                    });
                                }}
                                onFocus={() => setActiveInput(4)}
                                onBlur={() => setActiveInput(0)}
                                disabled={activeTab.bounds.type === "auto"}
                            />
                        </div>
                    </div>
                    <div className="flex flex-row items-center justify- gap-2">
                        <Checkbox
                            className="bg-neutral-200 border-neutral-400"
                            checked={activeTab.bounds.type === "auto"}
                            onCheckedChange={(checked) => updateBounds(activeTab.market.id, {
                                ...activeTab.bounds,
                                type: checked ? "auto" : "manual",
                            })}
                        />
                        <span className="text-sm translate-y-[1px]">Auto scale</span>
                    </div>
                </CardContent>
            </Card>
            <Card className="gap-0 flex-1 dark:bg-neutral-900">
                <CardHeader className="text-center text-sm">
                    Intervention
                </CardHeader>
                <CardContent>
                    Hi
                </CardContent>
            </Card>
            <Card className="gap-0 flex-1 dark:bg-neutral-900">
                <CardHeader className="text-center text-sm">
                    Curves
                </CardHeader>
                <CardContent>
                    Hi
                </CardContent>
            </Card>
        </div>
    );
};
