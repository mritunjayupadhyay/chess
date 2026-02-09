"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from "styled-components";
import { makeStore, AppStore } from "../store";
import { theme } from "../styles/theme";
import { GlobalStyle } from "../styles/global_style_styled_component";

export default function ChessProviders({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </Provider>
  );
}
