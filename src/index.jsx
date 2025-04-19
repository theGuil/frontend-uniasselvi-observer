import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const setViewportMeta = () => {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement("meta");
        viewport.name = "viewport";
        document.head.appendChild(viewport);
    }
    viewport.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
};

setViewportMeta();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
