import { useState } from 'react';
import { 
    Collapsible, 
    CollapsibleContent, 
    CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, ChartSpline, FilePlus2, BookOpenText } from 'lucide-react';

export const Learn = () => {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        'what-is': true,
        'how-to-use': false,
        'how-made': false,
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div className="w-full p-4 space-y-4">
            <Card className="border dark:bg-transparent p-0">
                <Collapsible 
                    open={openSections['what-is']} 
                    onOpenChange={() => toggleSection('what-is')}
                >
                    <CollapsibleTrigger className="w-full cursor-pointer p-6 text-left">
                        <CardTitle className="flex items-center justify-between text-lg">
                            <span>
                                What is Market Maker?
                            </span>
                            {openSections['what-is'] ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                            }
                        </CardTitle>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="px-6 pt-0 pb-6 space-y-4">
                            <p>
                                Market Maker is a microeconomic simulator for supply and demand analysis. 
                                It provides a visual and interactive platform for exploring economic market dynamics, 
                                designed for educational use at RIT by students and faculty.
                            </p>
                            
                            <p>
                                The application allows you to create and analyze economic market data, visualize 
                                supply and demand curves, apply various market scenarios, examine welfare outcomes, 
                                and measure elasticities.
                            </p>

                            <div className="bg-muted/50 dark:bg-muted/20 border rounded-lg p-4 mt-6">
                                <h4 className="font-medium mb-2">Getting Started</h4>
                                <ol className="space-y-1 list-decimal list-inside">
                                    <li>Go to the Interact page and load a preset to see Market Maker in action</li>
                                    <li>Try different market scenarios using the analysis tools</li>
                                    <li>Visit the Create page to build your own market data</li>
                                    <li>Export your custom markets and analyze them on the Interact page</li>
                                    <li>Use the help icons (?) throughout the interface for detailed explanations</li>
                                </ol>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
            
            <Card className="border dark:bg-transparent p-0">
                <Collapsible 
                    open={openSections['how-to-use']} 
                    onOpenChange={() => toggleSection('how-to-use')}
                >
                    <CollapsibleTrigger className="w-full cursor-pointer p-6 text-left">
                        <CardTitle className="flex items-center justify-between text-lg p-0">
                            <span>
                                How to Use Market Maker
                            </span>
                            {openSections['how-to-use'] ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                            }
                        </CardTitle>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="px-6 pt-0 space-y-6 pb-6">
                            <p>
                                Market Maker has three main pages, each designed for specific tasks.
                            </p>
                            
                            <div className="bg-muted/80 dark:bg-muted/20 border rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <ChartSpline className="h-5 w-5 text-blue-500" />
                                    <h3 className="font-semibold">Interact</h3>
                                </div>
                                <p>
                                    The primary analysis environment for exploring market scenarios. You can upload 
                                    market files, load presets, and analyze different economic effects in real-time.
                                </p>
                                <p>
                                    Available analysis tools include government interventions (price floors, ceilings, 
                                    taxes, subsidies), market shocks (supply and demand shifts), welfare calculations 
                                    (consumer/producer surplus), and elasticity measurements. The interface supports 
                                    multiple market tabs for comparison and includes graph export functionality.
                                </p>
                            </div>
                            
                            <div className="bg-muted/80 dark:bg-muted/20 border rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <FilePlus2 className="h-5 w-5 text-green-500" />
                                    <h3 className="font-semibold">Create</h3>
                                </div>
                                <p>
                                    A spreadsheet environment for building custom market datasets. You can input 
                                    market data manually, use automated data generation tools, and manipulate rows 
                                    (add, delete, insert, duplicate).
                                </p>
                                <p>
                                    The page includes data validation and error checking. You can export data in 
                                    CSV format or upload existing CSV files to edit and modify them.
                                </p>
                            </div>
                            
                            <div className="bg-muted/80 dark:bg-muted/20 border rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <BookOpenText className="h-5 w-5 text-purple-500" />
                                    <h3 className="font-semibold">Learn</h3>
                                </div>
                                <p>
                                    This page provides information about Market Maker's purpose and how to use 
                                    each feature. For specific questions, reach out to Jonathan Schultz at <a href="mailto:jss5874@rit.edu" className="text-blue-500 hover:underline">jss5874@rit.edu</a>.
                                </p>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
            
            <Card className="border dark:bg-transparent p-0">
                <Collapsible 
                    open={openSections['how-made']} 
                    onOpenChange={() => toggleSection('how-made')}
                >
                    <CollapsibleTrigger className="w-full cursor-pointer p-6 text-left">
                        <CardTitle className="flex items-center justify-between text-lg">
                            <span>
                                Technical Information
                            </span>
                            {openSections['how-made'] ? 
                                <ChevronDown className="h-4 w-4" /> : 
                                <ChevronRight className="h-4 w-4" />
                            }
                        </CardTitle>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <CardContent className="px-6 pb-6 pt-0 space-y-4">
                            <p>
                                Market Maker was developed over approximately two weeks. For more technical details not covered here, check out the GitHub link at the top.
                            </p>

                            <div>
                                <h4 className="font-semibold mb-2">Tech Stack & Frameworks</h4>
                                <ul className="space-y-1 list-disc list-outside pl-5">
                                    <li>React 19 with TypeScript</li>
                                    <li>ShadCN with custom Tailwind CSS</li>
                                    <li>PixiJS for high-performance graphics rendering</li>
                                    <li>Zustand for state management</li>
                                    <li>Vite as the build tool</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Development & Challenges</h4>
                                <ul className="space-y-1 list-disc list-outside pl-5">
                                    <li>
                                        Managing data flow across multiple 
                                        pages and market scenarios required careful architecture planning 
                                        with separate stores for market data, tab management, and computation results (Zustand helped a lot with this)
                                    </li>
                                    <li>
                                        Handling CSV parsing, data validation, and 
                                        mathematical computations while maintaining performance required robust 
                                        error handling and efficient algorithms for economic calculations (ChatGPT to the rescue!)
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">Known Issues</h4>
                                <ul className="space-y-1 list-disc list-outside pl-5">
                                    <li>
                                        Rendering issues can occur with extreme or malformed data that affects 
                                        curve fitting and graph boundaries
                                    </li>
                                    <li>
                                        Slight memory leak with re-renders (most noticable when resizing the page). Save your work and restart every few hours to avoid problems.
                                    </li>
                                    <li>
                                        Performance may slow with very large datasets ({'>'}1000 data points)
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
        </div>
    );
};
