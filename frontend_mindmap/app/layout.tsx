import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata = {
  title: "Transformer Architecture Mind Map",
  description: "Interactive mind map for understanding transformer architecture",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background w-screen h-screen overflow-hidden m-0 p-0`}>
        {children}
      </body>
    </html>
  );
}
