import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { RolePermissionsProvider } from "./contexts/RolePermissionsContext";
import { CartProvider } from "./contexts/CartContext";
import { Toaster } from "./components/ui/toaster";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RolePermissionsProvider>
          <CartProvider>
            <App />
            <Toaster />
          </CartProvider>
        </RolePermissionsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
