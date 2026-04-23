import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SpotVista",
  description:
    "Availability-Aware Recommendation System for Reliable and Cost-Efficient Multi-Node Spot Instances",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "SpotVista",
    url: "https://spotvista.ddps.cloud",
    images: ["https://spotvista.ddps.cloud/og.png"],
    description:
      "Multiple Spot Instances Recommendation System Towards Stable and Cost-Efficient Allocation",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1 flex flex-col items-center w-full">
            <div className="w-full max-w-[88rem] px-4 py-8">{children}</div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
