import './bootstrap';
import '../css/app.css';
import '../css/style.css';
import '../css/tailwind.css';
import '../css/theme.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
//import Layout from "@/Layouts/Layout";

createInertiaApp({
    resolve: name => {
        const pages = import.meta.glob([
            './Pages/**/*.jsx',
            './Admin/**/*.jsx'
        ], { eager: true });

        let pageLookup = pages[`./Pages/${name}.jsx`] || pages[`./Admin/${name}.jsx`];

        if (!pageLookup) {
            throw new Error(`Page not found: ${name}`);
        }

        return pageLookup.default;

        // const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
        // let page = pages[`./Pages/${name}.jsx`]


        // page.default.layout =
        //     page.default.layout || ((page) => <Layout children={page}/>);
        //return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />)
    },
})
