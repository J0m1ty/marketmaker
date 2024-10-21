import { Box, Link, Text, useColorModeValue } from "@chakra-ui/react";
import { DragEvent, ReactNode, useEffect, useState } from "react";

function Dropbox() {
    const [isDragging, setIsDragging] = useState(false);
    const [fileContent, setFileContent] = useState<string | null>(null);

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
        setIsDragging(true);
    }

    const handleDrop = async (event: DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);

        if (event.dataTransfer && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            console.log(file)
            const filePath = file.path;

            if (filePath.endsWith(".csv")) {
                const content = await window.electron.readFile(filePath);
                console.log(content); 
                if (content) setFileContent(content);
            }
            else {
                alert("Invalid file type. Only .csv files are supported.");
            }

            event.dataTransfer.clearData();
        }
    }

    const handleDragLeave = (event: DragEvent) => {
        setIsDragging(false);
    }

    const handleFileUploadClick = async () => {
        const filePath = await window.electron.selectFile();
        if (filePath && filePath.endsWith(".csv")) {
            const content = await window.electron.readFile(filePath);
            if (content) setFileContent(content);
        }
    }

    useEffect(() => {
        if (fileContent) {
            console.log(fileContent);
        }
    }, [fileContent]);

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