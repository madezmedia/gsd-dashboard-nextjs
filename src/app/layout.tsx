import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Newsreader, Raleway } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Suspense } from "react";
import "./globals.css";
import { ResponsiveLayout } from "@/components/layout/responsive-layout";
import { CopilotPanel } from "@/components/openui/copilot-panel";
import { ShortcutHandler } from "@/components/layout/shortcut-handler";
import { PostHogProvider } from "@/components/analytics/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jetbrains.variable} ${newsreader.variable} ${raleway.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh font-sans antialiased bg-background text-foreground">
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <Suspense fallback={null}>
              <ShortcutHandler />
            </Suspense>
            <Suspense
              fallback={
                <div className="w-full min-h-dvh flex items-center justify-center font-mono text-[10px] text-muted-foreground uppercase bg-background tracking-widest">
                  Loading ACMI System...
                </div>
              }
            >
              <ResponsiveLayout>{children}</ResponsiveLayout>
            </Suspense>
            <CopilotPanel />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
