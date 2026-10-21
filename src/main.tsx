import React from "react";
import { createRoot } from "react-dom/client";
import { WebBootstrap } from "./adapters/web-dexie/WebBootstrap";
import { App } from "./App";
import { WebPresentationProvider } from "./ui/adapters/WebPresentationProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><WebBootstrap><WebPresentationProvider><App /></WebPresentationProvider></WebBootstrap></React.StrictMode>);
