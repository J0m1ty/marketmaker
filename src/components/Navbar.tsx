import { Box, IconButton, Image, Stack, useColorMode, useColorModeValue } from "@chakra-ui/react";
import logo from '../assets/logo.png';
import NavigationButton from "./NavigationButton";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";

function Navbar() {
    const { colorMode, toggleColorMode } = useColorMode();

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
            bg={useColorModeValue("white", "#1d2528")}
            height="50px"
            minH="50px"
            width="100vw"
            border={useColorModeValue("1px solid #e1e1e1", "1px solid #161b1e")}
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
                    <NavigationButton text="File" />
                    <NavigationButton text="Edit" />
                    <NavigationButton text="Selection" />
                    <NavigationButton text="View" />
                    <NavigationButton text="Go" />
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
                            backgroundColor: useColorModeValue("#000000", "#303739"),
                            color: useColorModeValue("#ffffff", "#f2fffc")
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