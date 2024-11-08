import { StrictMode, useRef } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, ColorModeScript, Stack } from '@chakra-ui/react';
import theme from "./theme";
import Navbar from "./components/Navbar.js";
import './index.css';
import { StorageProvider } from "./components/StorageProvider";
import Footer from "./components/Footer";
import Router, { RouterRef } from "./components/Router";

const App = () => {
    const routerRef = useRef<RouterRef>(null);

    return (
        <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <Stack direction="column" gap={0} display={"flex"} flexDir={"column"} h="100vh" w="100vw">
                <Navbar triggerFileUploadDialog={() => routerRef.current?.triggerFileUploadDialog()} triggerCloseActiveFile={() => routerRef.current?.closeFile()} triggerDisplayModeChange={(mode) => routerRef.current?.triggerDisplayModeChange(mode)} />
                <Router ref={routerRef} />
                <Footer />
            </Stack>
        </ChakraProvider>
    );
}

createRoot(document.querySelector("#entry")!).render(
    <StorageProvider>
        <App />
    </StorageProvider>
);