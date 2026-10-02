# AdexiumClient

Runs an Adexium (`tgads`) widget the way `new AdexiumWidget({ wid }).requestAd()` would.

```js
const adexium = new AdexiumClient(this, { wid });
await adexium.watch(); // motivated: true, as requestRewardedAd()
await adexium.play(); // motivated: false, as GigaPub asks
```

## Flow

1. **Bid.** `POST bid.tgads.live/bid-request` with the viewer the widget builds from
   `Telegram.WebApp` (`telegramId`, names, `initData`, `tz`, ...), the format, `motivated`,
   `version` and the two anti-fraud codes. An empty array or a non-2xx is "no ad".
2. **Count it.** `notificationUrl` is fired the moment the banner is in the page.
3. **Wait.** The ad's `duration` plus 5 seconds when it gives one between 5 and 120, as
   GigaPub waits, otherwise the 15-second countdown.

## Gotchas

- `af` and `afV2` are the widget's own fraud verdicts, computed in the page. `0` is clean
  for both. `af` turns to `3` once `auth_date` is over 15 minutes old, so a stale session
  would report itself.
- The body is a string with no `Content-Type`, so it goes as `text/plain`, like the widget's
  `fetch`.
- Widget build 1.81 as of 2026-10-02 (`cdn.adexium.tech/assets/js/adexium-widget.min.js`,
  lightly obfuscated, `webcrack` reads it).
