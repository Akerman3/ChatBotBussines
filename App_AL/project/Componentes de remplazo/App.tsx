// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./components/Home";
import ThreeDots from "./components/ThreeDots";
import Login from "./components/Login";
import Signup from "./components/Signup";
import MainMenu from "./components/MainMenu";
import Subscription from "./components/Subscription";

import AutoTimeGuard from "./components/AutoTimeGuard";
import StartupRouter from "./components/StartupRouter";
import UpdateGuard from "./components/UpdateGuard";

// 👇 NUEVO: importa el guard que expulsa cuando la sub expira
import SubscriptionExpiryGuard from "./components/SubscriptionExpiryGuard";

function App() {
  return (
    <>
      <AutoTimeGuard />
      <UpdateGuard />
      {/* 👇 Debe estar montado globalmente para vigilar la expiración en segundo plano */}
      <SubscriptionExpiryGuard />

      <Routes>
        <Route path="/" element={<StartupRouter />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tres-puntos" element={<ThreeDots />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/main" element={<MainMenu />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
