import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    lightBackground: string;
    darkBackground: string;
    primaryColor: string;
    fontFamily: string;
    desktop: string;
    tablet: string;
    mobile: string;
  }
}
