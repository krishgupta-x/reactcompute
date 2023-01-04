import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import PageRoutes from './PageRoutes';
import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";

import App from "./App";
import Start from "./Start";
import Detect from "./Detect";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/detect" element={<App />} />
        <Route path="/run" element={<Detect />} />
    </Routes>
  </BrowserRouter>
);