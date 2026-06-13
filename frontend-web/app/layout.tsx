import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { TopNav, BottomNav } from "./nav";

export const metadata: Metadata = {
  title: "Basket Bud – Grocery Price Tracker",
  description: "Scan receipts and compare grocery prices across shops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <nav className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-green-600 flex items-center gap-2 hover:text-green-700 transition-colors"
            >
              🧺 Basket Bud
            </Link>
            <TopNav />
          </nav>
        </header>
        <main className="flex-1 pb-20 sm:pb-0">{children}</main>
        <footer className="hidden sm:block border-t border-gray-100 py-4 text-center text-sm text-gray-400">
          Basket Bud – self-hosted grocery tracker
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
