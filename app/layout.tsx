import type { Metadata, Viewport } from "next";
import {
  Playfair_Display,
  Source_Serif_4,
  Source_Sans_3,
} from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CurrentPartnerProvider } from "@/components/CurrentPartnerProvider";
import { ShowHiddenPhotosProvider } from "@/components/ShowHiddenPhotosProvider";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/AuthGate";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Liebeskarte, Every place we became us",
  description:
    "Liebeskarte is a private map journal of your relationship, every milestone pinned to the world.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${sourceSerif.variable} ${sourceSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <CurrentPartnerProvider>
            <ShowHiddenPhotosProvider>
              <AuthProvider>
                <AuthGate>
                  <div id="main-content" className="flex min-h-full flex-1 flex-col">
                    {children}
                  </div>
                </AuthGate>
              </AuthProvider>
            </ShowHiddenPhotosProvider>
          </CurrentPartnerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
