import type { Metadata, Viewport } from "next";
import "../../app/globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Tustar Delivery - Fast & Aerial",
  description: "Order anything, get it via drone in minutes.",
};

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-black text-white min-h-[100dvh] w-full font-sans antialiased overflow-hidden select-none">
      {children}
    </div>
  );
}
