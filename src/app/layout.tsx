import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Jakavonis | DI Sistemos Planavimo Vedlys",
  description:
    "Struktūrizuotas DI sistemos specifikacijų rengimo įrankis viešajam sektoriui. Nuo problemos iki techninės specifikacijos su ES DI Akto atitiktimi.",
  keywords: [
    "dirbtinis intelektas",
    "techninė specifikacija",
    "viešasis pirkimas",
    "ES DI Aktas",
    "AI Act",
    "DI sistema",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt" data-scroll="smooth">
      <body className="antialiased">
        {children}
        <footer style={{ borderTop: "1px solid #334155", padding: "16px 24px", textAlign: "center", fontSize: 13, color: "#64748b", background: "#0f172a" }}>
          © {new Date().getFullYear()} Egidijus Jakavonis | AI-First
        </footer>
      </body>
    </html>
  );
}
