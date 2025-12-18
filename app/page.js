"use client";

import { useState } from "react";
import ThemeToggle from "./components/ui/ThemeToggle";
import MainContent from "./components/layout/MainContent";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

export default function Home() {
  return (
    <MainContent>
      <Header />
      <Sidebar />
    </MainContent>
  );
}
