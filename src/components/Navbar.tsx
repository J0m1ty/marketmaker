import { Box, IconButton, Image, Stack, useColorMode, useColorModeValue } from "@chakra-ui/react";
import logo from '../assets/logo.png';
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useEffect } from "react";
import FileDropdown from "./FileDropdown";
import ViewDropdown from "./ViewDropdown";

function Navbar({ triggerFileUploadDialog, triggerCloseActiveFile }: { triggerFileUploadDialog: () => void, triggerCloseActiveFile: () => void }) {
    const { colorMode, toggleColorMode } = useColorMode();

    const bgColor = useColorModeValue("white", "#1d2528");
    const borderColor = useColorModeValue("1px solid #e1e1e1", "1px solid #161b1e");
    const themeButtonBgColor = useColorModeValue("#000000", "#303739");
    const themeButtonTextColor = useColorModeValue("#ffffff", "#f2fffc");

    const sendTheme = () => {
        window.electron.theme.send({
            color: colorMode === "light" ? '#ffffff' : '#1d2528',
            symbolColor: colorMode === "light" ? '#000000' : '#545f62',
            height: 49
        });
    }

    useEffect(() => {
        sendTheme();
    }, []);

    useEffect(() => {
        sendTheme();
    }, [colorMode]);

    return (
        <Box
            as="nav"
            className="draggable"
            bg={bgColor}
            height="50px"
            minH="50px"
            width="100vw"
            border={borderColor}
            pl="9px"
            verticalAlign={"middle"}
            display={"flex"}
        >
            <Stack direction={"row"} align={"center"} justifyContent={"space-between"} width="100%">
                <Stack direction={"row"} align={"center"}>
                    <Image
                        src={logo}
                        alt="logo"
                        width="30px"
                        height="30px"
                        mx="2px"
                    />
                    <FileDropdown triggerFileUploadDialog={triggerFileUploadDialog} triggerCloseActiveFile={triggerCloseActiveFile} />
                    <ViewDropdown />
                </Stack>
                <IconButton
                    height="30px"
                    className="nondraggable"
                    variant={"ghost"}
                    aria-label='Change theme'
                    icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
                    width={"30px"}
                    sx={{
                        '&:hover': {
                            backgroundColor: themeButtonBgColor,
                            color: themeButtonTextColor,
                        },
                    }}
                    onClick={toggleColorMode}
                    id={"themeButton"}
                />
            </Stack>
            <Box width="180px"></Box>
        </Box>
    );
}

export default Navbar;