import type { Metadata } from "next";
import { Lato } from "next/font/google";
import { MetaPixelScript } from "@/components/tracking/MetaPixelScript";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qarvon",
  description: "Formulários de qualificação de leads da Qarvon.",
};

const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${lato.variable} h-full`}>
      <body className="min-h-full bg-white text-neutral-900 antialiased">
        {metaPixelId && <MetaPixelScript pixelId={metaPixelId} />}
        {children}
      </body>
    </html>
  );
}
