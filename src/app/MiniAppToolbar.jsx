import AppContext from "@/contexts/AppContext";
import ProductSansBold from "@/assets/fonts/Product Sans Bold.ttf?inline";
import ProductSansRegular from "@/assets/fonts/Product Sans Regular.ttf?inline";
import ToolbarPanel from "@/toolbar/ToolbarPanel";
import usePortMirror from "@/hooks/usePortMirror";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: "Product Sans";
    font-weight: 400;
    font-style: normal;
    src: url("${ProductSansRegular}");
  }

  @font-face {
    font-family: "Product Sans";
    font-weight: 700;
    font-style: normal;
    src: url("${ProductSansBold}");
  }
`;

export default function MiniAppToolbar({ host, url, port }) {
  const mirror = usePortMirror(port);

  return (
    <AppContext.Provider value={{ port, host, url, mirror }}>
      <GlobalStyle />
      <ToolbarPanel />
    </AppContext.Provider>
  );
}
