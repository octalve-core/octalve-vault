import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vault.octalve.com"),
  title: { default: "Octalve Vault", template: "%s · Octalve Vault" },
  description: "Secure digital resources, templates and business tools from Octalve.",
  applicationName: "Octalve Vault",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
