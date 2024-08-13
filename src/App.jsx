import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PageDefault from "./pages/pageDefault";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function App() {
    return ( <>
            <BrowserRouter>
                <Routes>
                    <Route path="/*" element={<PageDefault />} />
                </Routes>
            </BrowserRouter>
            <ToastContainer autoClose={10000}  pauseOnHover theme="light" />
        </>
    );
};