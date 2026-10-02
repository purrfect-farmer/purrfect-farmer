# RichAdsClient

Runs a RichAds widget the way `TelegramAdsController` (`richinfo.co/richpartners/telegram/js/tg-ob.js`)
would, for its two triggered formats.

```js
const rich = new RichAdsClient(this, { pubId, appId });
await rich.interstitial(); // triggerInterstitialVideo() / triggerInterstitialBanner()
await rich.native(); // triggerNativeNotification()
```

## Flow

1. **Config.** `GET cdn.adx1.com/publisher-config/<md5(pubId)>.json`. Under `telegram`,
   `app_id[appId]` names the widget ids per type and which are active, and `widget[id]`
   carries each one's `ssp_id` and interstitial settings.
2. **Region and IP.** JSONP from `{eu|us}.convers.link/users/info`. The region starts as a
   coin flip, is remembered per account, and moves if the lookup says so.
3. **Anti-fraud ping.** `POST {region}.favorit.work/nty/taf` once a day with screen,
   timezone and session data.
4. **Bid.** `POST https://<ssp_id>.xml.{4armn|adx1}.com/telegram-bid` (EU or US) with the
   publisher info, `widget_id`, `bid_floor`, `motivated: true`, `number_of_bids: 1`. An empty
   array is "no ad"; the SDK would fall back to Yandex, which a headless run cannot.
5. **Count it.** Banners, HTML and playable ads fire `notification_url`. Interstitial videos
   report 0/25/50/75/100 to `{region}.favorit.work/nty/tg/video/metrics` keyed by the
   `bid-id` in the ad's link. VAST fires its `<Impression>`s and `notification_url` up front,
   then each quartile's `<Tracking>` alongside the same metrics.
6. **Wait.** The widget's `ad_duration` (default 10s) for interstitials, 3.2s for native,
   which is what GigaPub holds it for.

## Gotchas

- `PUSH_STYLE` is "native", `INTERSTITIAL_MIXED` covers both video and banner. A widget type
  missing from `activeWidgetTypes` cannot be triggered.
- The SDK is 690KB of obfuscator.io with an RC4 string table; `npx webcrack` turns it into
  readable source in seconds.
- The TON wallet report (`/nty/stw`) only fires when a TON Connect wallet is in
  `localStorage`, so it is skipped.
