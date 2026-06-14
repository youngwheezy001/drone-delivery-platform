import type { Metadata } from "next";
import "../../app/globals.css";

export const metadata: Metadata = {
  title: "Tustar Merchant - Sell & Dispatch",
  description: "Manage your storefront and dispatch drones instantly.",
};

export default function SellerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-black text-white min-h-screen w-full font-sans antialiased overflow-hidden">
      {children}
    </div>
  );
}
