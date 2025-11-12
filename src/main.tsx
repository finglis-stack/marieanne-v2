import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <>
    <Toaster 
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          color: '#e2e8f0',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.2)',
        },
        className: 'backdrop-blur-xl',
      }}
      theme="dark"
      richColors
    />
    <App />
  </>
);