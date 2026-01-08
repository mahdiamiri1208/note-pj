// app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "./theme.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
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
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}