import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from "react-router";
import { App } from './pages/App.tsx';
import { About } from './pages/About.tsx';
import './index.css';
import { ThemeProvider } from './components/theme-provider.tsx';
import { Layout } from './components/layout.tsx';

createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<App />} />
                    <Route path="/about" element={<About />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    </ThemeProvider>,
);
