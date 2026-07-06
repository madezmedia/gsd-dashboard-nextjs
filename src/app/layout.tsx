import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import "./globals.css";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";
import { CopilotPanel } from "@/components/openui/copilot-panel";
import { ShortcutHandler } from "@/components/layout/shortcut-handler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACMI Fleet Dashboard",
  description: "ACMI Super Bus — Layer 6: Dashboard UI with OpenUI + Vercel AI SDK + Groq",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <ShortcutHandler />
          </Suspense>
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center font-mono text-[10px] text-muted-foreground uppercase bg-background">Loading ACMI System...</div>}>
            <ResponsiveLayout>
              <main className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-4 lg:p-6 bg-background">
                  {children}
                </div>
              </main>
            </ResponsiveLayout>
          </Suspense>
          <CopilotPanel />
        </ThemeProvider>
      </body>
    </html>
  );
}
