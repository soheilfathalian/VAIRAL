import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vairal · Founder channel engine",
  description: "Peec-driven UGC video slate for underdog brands",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
