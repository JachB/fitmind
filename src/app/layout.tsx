import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitMind — AI Fitness Coach",
  description: "Trenuj mądrzej z AI coachem. Gamifikacja, progress tracking, leaderboardy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-zinc-900/90 !border-zinc-800 !text-zinc-100 !backdrop-blur-xl !shadow-2xl",
              title: "!text-zinc-50 !text-sm !font-medium",
              description: "!text-zinc-400 !text-xs",
              success: "!border-emerald-500/30",
              error: "!border-rose-500/30",
            },
          }}
        />
      </body>
    </html>
  );
}
