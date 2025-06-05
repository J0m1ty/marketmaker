import { useMarketTabsStore } from '@/hooks/markets.store';
import { FileSpreadsheet, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { handleMarketFileUpload } from '@/lib/market-upload';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import type { MarketTab } from '@/lib/types';
import { restrictToParentElement } from '@dnd-kit/modifiers';

interface SortableTabProps {
    tab: MarketTab;
    activeTabId: string | null;
    activeCurveColor: string | null;
    onTabClick: (id: string) => void;
    onTabClose: (id: string) => void;
}

const SortableTab = ({ tab, activeTabId, activeCurveColor, onTabClick, onTabClose }: SortableTabProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.market.id });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, 0px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isActive = tab.market.id == activeTabId;
    const activeColor = activeCurveColor || '#8b5cf6';

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={cn(
                'flex flex-row items-center gap-1.5 pl-3 pt-2 pb-2 pr-1 group',
                'border-b-2 transition-colors border-transparent hover:border-neutral-400 dark:hover:border-neutral-700',
                'text-muted-foreground',
                isActive && 'border-neutral-400 dark:border-neutral-700',
                isDragging && 'border-neutral-400 dark:border-neutral-700'
            )}
            style={{
                ...style,
                ...(isActive && {
                    borderBottomColor: activeColor,
                    color: activeColor,
                }),
            }}
            onMouseDown={() => onTabClick(tab.market.id)}
        >
            <FileSpreadsheet size='16' />
            <span className='text-sm translate-y-[1px] select-none'>{tab.market.name}.csv</span>
            <div
                className={cn(
                    'p-[0.12em] rounded-xs hover:bg-neutral-200 dark:hover:bg-neutral-800',
                    isActive && 'hover:bg-neutral-100 dark:hover:bg-neutral-900',
                    !isActive && 'invisible group-hover:visible'
                )}
                style={isActive ? { color: `${activeColor}80` } : {}}
                onMouseDown={(e) => {
                    e.stopPropagation();
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.market.id);
                }}
            >
                <X size={16} />
            </div>
        </div>
    );
};

export const TabGroup = () => {
    const { tabs, activeTabId, setActiveTab, closeTab, openTab, reorderTabs, getActiveTab } = useMarketTabsStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            reorderTabs(active.id as string, over.id as string);
        }
    };

    if (tabs.length === 0) return null;

    const activeTab = getActiveTab();
    const activeCurveColor = activeTab?.curves[activeTab.curves.selected]?.color || null;

    const handleMarketUpload = async () => {
        await handleMarketFileUpload(openTab);
    };

    return (
        <div className='flex flex-row items-center min-w-0'>
            <ScrollArea className='shrink min-w-0'>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToParentElement]}
                >
                    <SortableContext items={tabs.map((tab) => tab.market.id)} strategy={horizontalListSortingStrategy}>
                        <div className='flex flex-row items-center'>
                            {tabs.map((tab) => (
                                <SortableTab
                                    key={tab.market.id}
                                    tab={tab}
                                    activeTabId={activeTabId}
                                    activeCurveColor={activeCurveColor}
                                    onTabClick={setActiveTab}
                                    onTabClose={closeTab}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                <ScrollBar orientation='horizontal' className='h-[5px] rounded-none translate-y-[1px]' />
            </ScrollArea>
            <div
                className='mx-2 p-1 rounded-sm hover:bg-muted text-neutral-600 dark:text-neutral-300'
                onClick={() => handleMarketUpload()}
            >
                <Plus size={16} />
            </div>
        </div>
    );
};
