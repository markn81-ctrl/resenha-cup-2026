import type { Metadata } from "next";
import { Bricolage_Grotesque, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading"
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Resenha Cup 2026",
  description:
    "Fantasy social da Copa 2026 com palpites, ranking ao vivo, feed de resenha e narracao por IA.",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${bricolage.variable} ${space.variable} font-[family-name:var(--font-body)] text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
