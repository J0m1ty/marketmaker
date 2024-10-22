import { Box, Stack, useColorModeValue } from "@chakra-ui/react";
import Dropbox, { FileData } from "./Dropbox";
import { useState } from "react";

export type File = FileData & {
    active: boolean;
}

function Router() {
    const [files, setFiles] = useState<File[]>([]);

    const onAddFile = (file: FileData) => {
        window.electron.store.get("files").then((files: unknown) => {
            const newFiles = [...(files as FileData[]), file];
            window.electron.store.set("files", newFiles);
        });

        setFiles((prevFiles) => [...prevFiles.map((prevFile) => ({ ...prevFile, active: false })), { ...file, active: true }]);
    }

    return (
        <Box w="100vw" flexDirection={"column"} flex={1} backgroundColor={useColorModeValue("white", "#1d2528")}>
            {
                files.length > 0
                    ? <Stack spacing={0} maxWidth={"100%"} overflowX={"auto"} flexDir={"row"}>
                        {files.map((file, index) => (
                            <Box key={index} borderBottom="1px solid #e2e8f0">
                                {file.name}
                            </Box>
                        ))}
                    </Stack>
                    : <Dropbox onAddFile={onAddFile} />
            }
        </Box>
    )
}

export default Router;