import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { RolePermissionsProvider } from "./contexts/RolePermissionsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FinanceProvider } from "./contexts/FinanceContext";
import { ConfirmDialogProvider } from "./contexts/ConfirmDialogContext";
import { Toaster } from "./components/ui/toaster";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <RolePermissionsProvider>
            <ThemeProvider>
              <FinanceProvider>
                    <ConfirmDialogProvider>
                      <App />
                    </ConfirmDialogProvider>
                <Toaster />
              </FinanceProvider>
            </ThemeProvider>
          </RolePermissionsProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
