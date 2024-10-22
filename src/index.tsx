import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, ColorModeScript, Stack } from '@chakra-ui/react';
import theme from "./theme";
import Navbar from "./components/Navbar.js";
import './index.css';
import { StorageProvider } from "./components/StorageProvider";
import Footer from "./components/Footer";
import Router from "./components/Router";

const App = () => {
    return (
        <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <Stack direction="column" gap={0} display={"flex"} flexDir={"column"} h="100vh">
                <Navbar />
                <Router />
                <Footer />
            </Stack>
        </ChakraProvider>
    );
}

createRoot(document.querySelector("#entry")!).render(
    <StrictMode>
        <StorageProvider>
            <App />
        </StorageProvider>
    </StrictMode>
);