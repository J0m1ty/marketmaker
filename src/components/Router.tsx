import { Box, Stack, Text, useColorModeValue } from "@chakra-ui/react";
import Dropbox from "./Dropbox";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import Tab from "./Tab";
import { File, FileData } from "../types";
import FileDisplay from "./FileDisplay";

export interface RouterRef {
    triggerFileUploadDialog: () => void;
    closeFile: (index?: number) => void;
}

const Router = forwardRef<RouterRef>((_, ref) => {
    const [files, setFiles] = useState<File[]>([]);

    const bgEmpty = useColorModeValue("white", "#1d2528");
    const bgFilled = useColorModeValue("white", "#273136");
    const pathColor = useColorModeValue("#555555", "#808b8d");
    const borderColor = useColorModeValue("#fafafa", "#3a4449");

    useImperativeHandle(ref, () => ({
        triggerFileUploadDialog,
        closeFile
    }));

    const triggerFileUploadDialog = async () => {
        const path = await window.electron.selectFile();
        if (path && path.endsWith(".csv")) {
            const content = await window.electron.readFile(path);
            if (content) addFile({
                name: path.split(/[\\/]/).pop()!,
                path,
                content
            });
        }
    }

    const addFile = (file: FileData) => {
        if (files.find((f) => f.path === file.path)) {
            alert("File is already open.");
            return;
        }

        window.electron.store.get("files").then((results: unknown) => {
            if (!files) results = [];
            const newFiles = [...(results as FileData[]), file];
            window.electron.store.set("files", newFiles);
        });

        setFiles((prevFiles) => [...prevFiles.map((prevFile) => ({ ...prevFile, active: false })), { ...file, active: true }]);
    }

    const closeFile = (index?: number) => {
        if (files.length === 0) return;

        if (index === undefined) {
            index = files.findIndex(file => file.active);
        }

        window.electron.store.get("files").then((results: unknown) => {
            if (!files) results = [];
            const newFiles = (results as FileData[]).filter((f) => f.path !== files[index].path);
            window.electron.store.set("files", newFiles);
        });

        setFiles((prevFiles) => prevFiles.map((prevFile, i) => ({ ...prevFile, active: i === Math.max(index - 1, 0) })).filter((_, i) => i !== index));
    }

    const onHandleClick = (index: number) => {
        setFiles((prevFiles) => prevFiles.map((prevFile, i) => ({ ...prevFile, active: i === index })));
    }

    const onHandleMouseEnter = (index: number) => {
        setFiles((prevFiles) => prevFiles.map((prevFile, i) => ({ ...prevFile, hover: i === index })));
    }

    const onHandleMouseLeave = () => {
        setFiles((prevFiles) => prevFiles.map((prevFile) => ({ ...prevFile, hover: false })));
    }

    return (
        <Box w="100vw" flex={1} backgroundColor={files.length == 0 ? bgEmpty : bgFilled} overflowY="auto">
            {
                files.length > 0 ?
                    <>
                        <Box position="sticky" top="0" zIndex={1} backgroundColor={bgFilled} borderColor={borderColor} borderBottomWidth={1}>
                            <Stack spacing={0} maxWidth={"100%"} overflowX={"auto"} flexDir={"row"} height="51px">
                                {files.map((file, index) => <Tab
                                    key={index}
                                    index={index}
                                    name={file.name}
                                    isActive={file.active}
                                    isHover={file.hover ?? false}
                                    closeFile={closeFile}
                                    onHover={onHandleMouseEnter}
                                    onLeave={onHandleMouseLeave}
                                    onClick={onHandleClick}
                                ></Tab>)}
                            </Stack>
                            <Box height="32px" alignContent={"center"} px={5}>
                                <Text fontWeight={400} fontSize={"16px"} color={pathColor} lineHeight={"1"}>
                                    {files.filter(file => file.active)[0]?.path.split(/[\\/]/).slice(-3).map((seg, idx, arr) => <span key={idx}>{seg}{idx < arr.length - 1 && <ChevronRightIcon />}</span>)}
                                </Text>
                            </Box>
                        </Box>
                        <FileDisplay content={files.filter(file => file.active)[0]?.content} />
                    </>
                    : <Dropbox triggerFileUploadDialog={triggerFileUploadDialog} hoistFileData={addFile} />
            }
        </Box>
    )
});

export default Router;