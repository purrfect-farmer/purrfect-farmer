# GigaPubClient

Runs a GigaPub project the way `window.showGiga()` would, for drops whose page loads
`ad.gigapub.tech/script?id=<project>`. GigaPub is a mediation layer, not an ad network:
it picks a network, plays that network's ad and reports the result to its own stats API.
Whether the reward reached the drop's balance is the drop's business and stays in the farmer.

```js
const gigapub = new GigaPubClient(this, { projectId: 8412 });
await gigapub.watch();
```

## Flow

1. **Read the project.** `GET /script?id=<project>` is a per-project build of the SDK
   with the project's bearer token and its networks baked in. The client lifts the token
   (the only 32-character alphanumeric literal) and the Monetag zone (`show_<zone>`).
2. **Announce the session.** `POST /v1/ad` with `{ method: "init" }`.
3. **Report the attempt.** `adShowTryStart`.
4. **Play the ad.** Through `MonetagClient`, on the munqu.com build's ad host.
5. **Report the show.** `adShowed` with how long it took, or `adShowError` if Monetag
   declined. A show of 2.9 seconds or less is what the SDK calls `TooFastWatchingError`.

Every stats call carries `project-id`, `Authorization: Bearer <token>` and the Telegram
launch data (`user`, `platform`, `version`, `start_param`). They are best-effort, as in
the SDK.

## Mediation

The `main` placement rotates by `chanceOrder`: Monetag 97.5%, then RichAds (`rich`,
`rB`, `rD`), Adexium (`t`) and a Monetag direct link (`mc`) at 0.5% each. GigaPub's own
bid network (`b`, `bid-net.gigapub.tech/loader.js`) is pushed to the front of every list
and skipped when it has no bid within 4 seconds. The client only plays Monetag, which is
the path nearly every real show takes.

The SDK also runs an "X" config (`e: true, c: 1`) that tries a second network after the
first succeeds and reports it as `adShowedX`. That second network is never Monetag, so the
client does not attempt it.

## If it stops working

- The SDK is obfuscator.io: a rotated string array (`a0a`) read through `a0b`. Rebuild
  the table by evaluating `a0a`, `a0b` and the rotation IIFE, then substitute every
  `bXX(0x...)` alias call. Note that `SDK_VERSION` (`l` in the build, `v87` as of
  2026-10-02) sits next to the token.
- GigaPub loads Monetag from `munqu.com`, not `libtl.com`, and that build bakes a
  different ad host: `'9.m6lw.)=ow'` decodes to `d3rem.com` with Monetag's settings
  cipher. If Monetag calls fail, re-decode `wn()` in `munqu.com/sdk.js`.

## Gotchas

- `transactionId` becomes Monetag's `ymid`. Pass it only if the drop's page passes one to
  `showGiga`, since it is what a postback would be keyed on.
- `ad.gigapub.tech`, `munqu.com`, `d3rem.com` and `my.rtmark.net` belong in the farmer's
  `static domains`.
