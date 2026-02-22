import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Han – AI Customer Service for Nigerian Businesses",
  description:
    "Han handles WhatsApp customer messages 24/7 so Nigerian businesses never miss a sale. Speaks Pidgin. Integrates with Paystack.",
  openGraph: {
    title: "Han – AI Customer Service",
    description: "Your customers deserve instant answers. Han delivers.",
    images: ["/icons/han-social-avatar.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <head>
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        </head>
        <body className="font-sans antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
