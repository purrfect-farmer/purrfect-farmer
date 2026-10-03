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
   becomes the event Monetag pays and posts back on. `viewability_url` is not fired, since
   the SDK only sends it on a click.
5. **Wait** `fakepushAutoclose` seconds, or 15.
6. **Resolve.** `GET /resolve?ruid=` says what the view was worth, retried the way the SDK
   retries it. It reports, it does not settle: a view that never resolves may still have
   been counted.

## Pop format

`show_<zone>({ type: "pop", ymid })` is a click-through rather than a banner, and `pop()` runs it:

```js
const { event } = await monetag.pop(zoneId, { ymid });
```

1. **Read the zone.** This is the same settings call as above. `fakepushTelegramPopUrl`
   (e.g. `//8rar.com/4/11057881`) is the link to open. A zone without one is shown as a
   regular ad, as the SDK falls back to `end`.
2. **Open the link.** Add `var=<zone>_<requestVar>`, `ymid`, `sdkp=3`, `oaid`, `tgp`, `tglc`,
   `var_3`, `rp_rid`, `bto` and `btz`. Inside Telegram the SDK opens it with `openLink`, so
   it lands in the browser with no page around it. The first hop logs the click. Later
   redirects go to advertiser hosts the extension has no rules for, so a failure there is
   ignored.
3. **Resolve.** `rp_rid` is a fresh UUID, sent only when the zone has
   `fakepushRewardPostback`. Two seconds after opening, `/resolve?ruid=<rp_rid>` reports
   the event (`reward_event_type: valued | non_valued`), with the usual three retries.

The SDK refuses a pop outside a user gesture (`navigator.userActivation`). The pop host
belongs in the farmer's `static domains`.

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

`MONETAG_HOST` is baked into each build as an obfuscated literal in `wn()`, decoded by the
same cipher as the settings: `'qMM.m.)=ow'` (`ill3.com`) in v1.931.0, `'l.xt#.)=ow'`
(`e8ys.com`) before that. If Monetag rotates it, every call fails and that constant is what has gone stale.
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
- `Authorization` is cleared per request, and `ill3.com` and `my.rtmark.net` belong in the
  farmer's `static domains` so the extension lets the calls through with the right
  `Origin` and `Referer`.
