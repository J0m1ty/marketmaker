import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import { Suspense, lazy } from 'react';
import './index.css';
import { ThemeProvider } from './components/theme-provider.tsx';
import { Layout } from './components/layout.tsx';
import { LoadingFallback } from './components/loading-fallback.tsx';

const Interact = lazy(() =>
    import('./pages/Interact.tsx').then(module => ({
        default: module.Interact,
    }))
);
const Create = lazy(() =>
    import('./pages/Create.tsx').then(module => ({ default: module.Create }))
);
const Learn = lazy(() =>
    import('./pages/Learn.tsx').then(module => ({ default: module.Learn }))
);

createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme='dark' storageKey='ui-theme'>
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route
                        path='/'
                        element={
                            <Suspense
                                fallback={<LoadingFallback variant='default' />}
                            >
                                <Interact />
                            </Suspense>
                        }
                    />
                    <Route
                        path='/create'
                        element={
                            <Suspense
                                fallback={<LoadingFallback variant='table' />}
                            >
                                <Create />
                            </Suspense>
                        }
                    />
                    <Route
                        path='/learn'
                        element={
                            <Suspense
                                fallback={<LoadingFallback variant='default' />}
                            >
                                <Learn />
                            </Suspense>
                        }
                    />
                </Routes>
            </Layout>
        </BrowserRouter>
    </ThemeProvider>
);
