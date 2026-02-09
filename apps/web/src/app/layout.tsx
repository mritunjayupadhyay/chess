import type { Metadata } from "next";
import StyledComponentsRegistry from "@/lib/styled-components-registry";

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
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
