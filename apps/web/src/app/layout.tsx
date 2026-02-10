import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My App",
  description: "Monorepo demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Arvo&display=swap"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
