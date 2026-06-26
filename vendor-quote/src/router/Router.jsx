// src/router/Router.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import masterRoutes from "./routes";
import PrivateRoute from "./PrivateRoute";
import Layout from "../components/Layout";
import Login from "../concepts/auth/Login";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* public route */}
        <Route path="/login" element={<Login />} />

        {/* redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* protected app shell */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  {masterRoutes.map((route, idx) => {
                    const element = route.adminOnly ? (
                      <PrivateRoute adminOnly>{route.element}</PrivateRoute>
                    ) : (
                      route.element
                    );

                    return (
                      <Route key={idx} path={route.path} element={element} />
                    );
                  })}

                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
