// app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import MainContent from "./components/layout/MainContent";

import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "./theme.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Notebook App",
  description: "A simple MVC Notes Application",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <div className="main">
            <div className="app-wrapper">
              <Sidebar />
              <div className="content-area">
                <Header />
                <MainContent>{children}</MainContent>
              </div>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
