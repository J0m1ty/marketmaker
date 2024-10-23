import { Box, Link, Text, useColorModeValue } from "@chakra-ui/react";
import { DragEvent, useState } from "react";
import { FileData } from "../types";

function Dropbox({ triggerFileUploadDialog, hoistFileData }: { triggerFileUploadDialog: () => void, hoistFileData: (file: FileData) => void }) {
    const [isDragging, setIsDragging] = useState(false);
    
    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
    }

    const handleDragLeave = (event: DragEvent) => {
        setIsDragging(false);
    }

    const handleDrop = (event: DragEvent) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files[0];

        if (!file.name.endsWith(".csv")) {
            console.log("Invalid file format. Please upload a CSV file.");
            return;
        }

        window.electron.getFilePath(file, async (path: string) => {
            const content = await window.electron.readFile(path);
            if (content) hoistFileData({
                name: file.name,
                path,
                content
            });
        });
    }

    return (
        <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            bg={isDragging ? useColorModeValue("#eeeefe", "#2A2E40") : useColorModeValue("#eeeeee", "#1A2023")}
            height="100px"
            borderRadius={25}
            border="2px dashed"
            borderColor={isDragging ? "blue.500" : useColorModeValue("#000000", "#565C5E")}
            alignContent={"center"}
            justifyContent={"center"}
            px={10}
            mx={10}
            my={10}
        >
            <Text color={useColorModeValue('black', '#808b8d')} textAlign={"left"} className="nonselectable">
                {isDragging ? 'Drop the market file here.' : 'Drag and drop a market file here or '}
                {isDragging ? null :
                    <Link color={useColorModeValue('blue.500', 'blue.300')}
                        sx={{
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline', color: useColorModeValue('blue.600', 'blue.200') }
                        }}
                        onClick={triggerFileUploadDialog}
                        id={"file-upload"}
                    >upload from your device.</Link>
                }
            </Text>
        </Box>
    )
}

export default Dropbox;