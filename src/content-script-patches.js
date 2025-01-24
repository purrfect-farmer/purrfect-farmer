if (location.hash.includes("tgWebAppData")) {
  switch (location.host) {
    /** Bypass KittyVerse on Desktop */
    case "play.kittyverse.ai":
      window.isDev = true;
      break;
  }
}
