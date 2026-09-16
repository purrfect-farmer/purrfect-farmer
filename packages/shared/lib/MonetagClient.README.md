# MonetagClient

Runs a Monetag zone the way `show_<zoneId>()` would, for drops that serve Monetag ads:
either the drop settles the reward itself and merely expects the ad to have played, or the
zone pays through a server-to-server postback keyed on `ymid`. Whether the reward reached
the drop's balance is the drop's business and stays in the farmer.

```js
const monetag = new MonetagClient(this, { zoneId });
await monetag.watch();
```

## Flow

1. **Identify the device.** `gid.js?userId=<deviceId>` trades a locally generated id for a
   stable `oaid`. A device Monetag has never synced gets its own id handed straight back.
2. **Read the zone.** `POST /401/<zone>` returns the feed's address and how long the banner
   should stay up. Best-effort: there are defaults for both, so a zone that will not answer
   is still watchable.
3. **Take a banner.** `GET <fakepushFeedUrl or /500/><zone>`. An empty feed is Monetag
   declining to serve, not a failure to handle.
4. **Count the impression.** `impression_url` is the request the money hangs on: it is what
   becomes the event Monetag pays and posts back on. `viewability_url` follows when the
   banner carries one.
5. **Wait** `fakepushAutoclose` seconds, or 15.
6. **Resolve.** `GET /resolve?ruid=` says what the view was worth, retried the way the SDK
   retries it. It reports, it does not settle: a view that never resolves may still have
   been counted.

## Encodings

**Settings** come back under a substitution cipher. Every character stands for one code
point: its index in `SETTINGS_ALPHABET`, plus the alphabet's length unless a `.` came
first. The printable range is one character, everything below it is two.

**Feeds** arrive as plain JSON or as base64, depending on the banner, so both are
accepted. The base64 path decodes through UTF-8, since banner titles carry emoji and
`atob` alone mangles them.

**Device ids** follow `DEVICE_ID_PATTERN` (`a` a lowercase letter, `N` a digit). Monetag
never sees anything else, so anything else stands out. The generated id is persisted per
account: a fresh device on every run is the one thing a returning viewer never looks like.

## If it stops working

`MONETAG_HOST` is baked into each `sad`-style build as an obfuscated literal,
`Ys('l.xt#.)=ow')` in the copy this was written against, decoded by the same cipher as the
settings. If Monetag rotates it, every call fails and that constant is what has gone stale.
Publishers on a different SDK domain can pass `host` instead.

## Gotchas

- `ymid` is the Telegram id the postback is keyed on, so it has to be the account being
  farmed, not whoever the page belongs to.
- `sdkp=1` says the page drives the ad itself, which is what this client does.
- The window and timezone parameters travel with the feed request and the impression
  alike. Monetag weighs them when deciding whether a view was real.
- The page posts a pile of fingerprinting alongside the settings call. The SDK has its own
  path for when that collection fails and still expects settings back, which is the path
  taken here.
- `Authorization` is cleared per request, and `e8ys.com` and `my.rtmark.net` belong in the
  farmer's `static domains` so the extension lets the calls through with the right
  `Origin` and `Referer`.
