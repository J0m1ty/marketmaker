import { Dropzone } from "@/components/dropzone"
import { TabGroup } from "@/components/tab-group";
import { useMarketTabsStore } from "@/hooks/markets.store"
import { handleDropzoneUpload } from "@/lib/market-upload";


export const App = () => {
    const { tabs, openTab } = useMarketTabsStore();

    const handleDrop = async (file: File) => {
        await handleDropzoneUpload(file, openTab);
    }

    return (
        <div className="flex flex-col w-full h-full pt-2 overflow-x-clip">
            {tabs.length > 0 ? (
                <TabGroup />
            ): (
                <Dropzone className="m-5" onDrop={handleDrop}/>
            )}

            {/* <ResizablePanelGroup direction="vertical">
                <ResizablePanel>
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel>
                            Graph
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel maxSize={25} minSize={15} collapsible={true}>
                            Data
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel maxSize={20} minSize={15} collapsible={true}>
                    Options
                </ResizablePanel>
            </ResizablePanelGroup> */}
        </div>
    )
}