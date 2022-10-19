import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import PageRoutes from './PageRoutes';
import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
    <BrowserRouter>
      <PageRoutes />
    </BrowserRouter>,
  document.getElementById('root')
);