import { Box, Link, Text, useColorModeValue } from "@chakra-ui/react";
import { DragEvent, useState } from "react";

export type FileData = {
    name: string;
    path: string;
    content: string;
}

function Dropbox({ onAddFile }: { onAddFile: (file: FileData) => void }) {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileUploadClick = async () => {
        const filePath = await window.electron.selectFile();
        if (filePath && filePath.endsWith(".csv")) {
            const content = await window.electron.readFile(filePath);
            if (content) onAddFile({
                name: filePath.split(/[\\/]/).pop()!,
                path: filePath,
                content
            });
        }
    }
    
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
            if (content) onAddFile({
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
            bg={isDragging ? useColorModeValue("#f0f0f0", "#2A2E30") : useColorModeValue("#eeeeee", "#1A2023")}
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
                        onClick={handleFileUploadClick}
                        id={"file-upload"}
                    >upload from your device.</Link>
                }
            </Text>
        </Box>
    )
}

export default Dropbox;