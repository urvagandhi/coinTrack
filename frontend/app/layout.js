import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "../components/auth/AuthGuard";
import MainLayout from "../components/MainLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "coinTrack - Personal Finance Tracker",
    template: "%s | coinTrack",
  },
  description: "Track all your investments and personal finances at one place",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <AuthProvider>
          <AuthGuard>
            <MainLayout>
              {children}
            </MainLayout>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}