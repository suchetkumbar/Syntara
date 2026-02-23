import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Theme is now managed by useTheme hook — apply saved preference or default to dark
const savedTheme = localStorage.getItem("syntara_theme");
document.documentElement.classList.add(savedTheme === "light" ? "light" : "dark");

createRoot(document.getElementById("root")!).render(<App />);
