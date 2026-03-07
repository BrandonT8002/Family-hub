import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { isNative, initNative } from "@/lib/native";

if (!isNative && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

initNative();

createRoot(document.getElementById("root")!).render(<App />);
