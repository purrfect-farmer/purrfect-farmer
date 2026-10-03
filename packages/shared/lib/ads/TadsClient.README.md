# TadsClient

Runs a TADS widget the way `tads.init({ widgetId, type: "fullscreen", onShowReward }).showAd()`
would, for drops whose page loads `w.tads.me/widget.js`.

```js
const tads = new TadsClient(this, { widgetId });
await tads.watch();
```

TADS pays the drop through its own postback, so the client only plays the ad. The farmer
then waits on the drop's backend. Monsterland polls `/ads/task-result`, as it does for AdsGram.

## Flow

1. **Ask for an ad.** `GET backend.tads.me/ads_backend` carries:
   - the widget: `wid` and `is_rewarded` (true when the page passes `onShowReward`)
   - the viewer from `Telegram.WebApp`: `uid`, `locale`, `is_premium`, `username` and `platform`, plus the raw `initData` as `tgd`
   - device data: the `wd`/`hl` bot flags, which are `0` when clean, plus `sw`, `sh`, `dpr`, `tp` and the `twa_*` values
   - the session's `sid`, `seq` and `plt` (the last load time in ms)

   The response is `{ type, ads: [...], request_id }`. An empty `ads` is "no ad".
2. **Render it.** Each ad kind renders differently:
   - **HTML (RTB):** sends its `nurl` win notice with `${AUCTION_PRICE}` filled from `cpm`.
   - **Image:** loads its `image_url`.
   - **VAST:** parses the XML inline in `vast` and fires the `start` trackers.
3. **Count the view.** One second after the render, or as soon as a video plays,
   `POST backend.tads.me/write-view` is sent with the widget's `x-api-key`, `views: [adId]`,
   `request_id` and `ref`.
   - RTB views send `is_rtb: true`, then fire the ad's `pixelUrl`.
   - Direct views send `is_rtb: false` and `viewability: { [adId]: 100 }`.

   This is the point where the widget calls `onShowReward`.
4. **Wait for the close.** The close button unlocks after 8 seconds for a rewarded fullscreen
   ad and 5 seconds otherwise. A video waits its `skipoffset` (30 when absent) or its
   duration, firing the quartile trackers and then `complete`.

## Gotchas

- **View limit.** The widget refuses a show once 10 views fall inside 30 minutes (its
  `adViewsTimestamps`). The client keeps that window per run and throws, so the farmer
  falls back to the next provider.
- **Clicks.** The client never clicks. `write-click` and the `redirect` endpoints exist
  only for clicked ads.
- **Origin.** `referrer` and `ref` are the drop's origin. Put `tads.me` in the farmer's
  `static domains` so the extension's rules cover the calls.
- **If it breaks.** widget.js is plain, minified JS, last modified 2026-09-08. The
  `x-api-key` and a Supabase key for `test_ads` (used in debug mode only) are literals in it.
- **Monsterland.** Widget `11616`, whose reward settles server side.
