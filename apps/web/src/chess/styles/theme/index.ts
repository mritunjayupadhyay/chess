interface ITheme {
    lightBackground: string;
    darkBackground: string;
    primaryColor: string;
    fontFamily: string;
    desktop: string;
    tablet: string;
    mobile: string;
}
export const theme: ITheme = {
    lightBackground: "#eeeed2",
    darkBackground: "#769656",
    primaryColor: "#444",
    fontFamily: "'Arvo', serif",
    desktop: "960px",
    tablet: "769px",
    mobile: "500px"
}
