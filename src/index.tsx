import React from "react";
import Viewer from "./Viewer";
import Home from "./Home";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./styles/tailwind.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/">
          <Route index element={<Home />} />
          <Route path="viewer" element={<Viewer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
