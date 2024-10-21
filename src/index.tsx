import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, ColorModeScript, Stack } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from "react-router-dom";
import theme from "./theme";
import Main from "./pages/Main.js";
import Navbar from "./components/Navbar.js";
import './index.css';
import { StorageProvider } from "./components/StorageProvider";
import Footer from "./components/Footer";

const App = () => {
    return (
        <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <MemoryRouter>
                <Stack
                    direction="column"
                    gap={0}
                    display={"flex"}
                    flexDir={"column"}
                    h="100vh"
                >
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Main />} />
                    </Routes>
                    <Footer />
                </Stack>
            </MemoryRouter>
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