# GigaBidClient

Runs a GigaPub bid-net placement the way the show function from `gigaBidInit()` would.
GigaPub's own network: `bid-net.gigapub.tech/loader.js` pulls in
`cdn.giga.pub/script/giga.bid.release.v40.js`.

```js
const bid = new GigaBidClient(this, { projectId, placementId, mode });
await bid.watch();
```

## Flow

1. **Ads.** `POST /v1/get-rtb` (modes 2 and 4) or `/v1/get-ad` with `placement-id`,
   `project-id`, `x-version` headers and `{ user, tg_proof }`. `status <= 0` is a refusal.
   Ads sharing a `stackId` are shown back to back.
2. **Per ad.** Fire the creative's `render` tracker, report `adShowStart` and `adShowed`
   (`/v1/ad-showed`) with `transaction-id: <tId>`, fire `show` 2s in and `reward` 10s in,
   wait the duration, report `adShowEnd`.
3. **Duration.** `ext.duration` when over 10, otherwise 15s for rewarded modes, 8s for
   interstitial ones (3 and 4).

## Gotchas

- `tg_proof` is the init data minus `hash` and `signature`, sorted and joined by newlines,
  with `signature` beside it: Telegram's third-party validation format.
- `reward` only fires if the ad is still open 10s after it showed, so a shorter wait loses it.
- Only `https://` trackers are fired, as in the core.
- Offers with a `targetBot` also go through a conversion pixel iframe (`cdn.giga.pub/pxl.iframe/`),
  which is skipped.
