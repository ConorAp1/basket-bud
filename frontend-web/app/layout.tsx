import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/scan"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                Scan
              </Link>
              <Link
                href="/compare"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                Compare
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-100 py-4 text-center text-sm text-gray-400">
          Basket Bud – self-hosted grocery tracker
        </footer>
      </body>
    </html>
  );
}
