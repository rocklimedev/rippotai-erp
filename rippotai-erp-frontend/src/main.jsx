import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "@fontsource-variable/plus-jakarta-sans";
import "./index.css";
import "./styles/inos-theme.css";
import App from "./App.jsx";
import { store } from "./store"; // adjust path to wherever this store file lives
import { AuthProvider } from "./context/AuthContext.jsx"; // adjust path to match your project

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </StrictMode>,
);
