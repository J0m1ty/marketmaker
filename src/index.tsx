import { Suspense } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Box, ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import theme from "./theme";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Loading from "./components/Loading.js";
import Home from "./pages/Home.js";
import Navbar from "./components/Navbar.js";
import './index.css';

createRoot(document.querySelector("#entry")!).render(
    <StrictMode>
        <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <BrowserRouter>
                <div id="background">
                    <Navbar />
                    <Suspense fallback={<Loading text={"Loading..."} />}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                        </Routes>
                    </Suspense>
                </div>
            </BrowserRouter>
        </ChakraProvider>
    </StrictMode>
);