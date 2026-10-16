import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Blumbook — Talk. Share. Bloom.",
  description: "A home for conversations, communities and stories that matter. Join Blumbook.",
  applicationName: "Blumbook",
  icons: { icon: "/logo.svg" },
};
export const viewport: Viewport = { themeColor: "#080d17", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
