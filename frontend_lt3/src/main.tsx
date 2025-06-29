import React from "react";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App";
import Gallery from "./Gallery";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/gallery/:user" element={<Gallery />} />
        <Route path="/gallery/:user/:id" element={<Gallery />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);