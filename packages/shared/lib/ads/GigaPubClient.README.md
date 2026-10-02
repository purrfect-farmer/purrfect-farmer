# GigaPubClient

Runs a GigaPub project the way `window.showGiga()` would, for drops whose page loads
`ad.gigapub.tech/script?id=<project>`. GigaPub is a mediation layer, not an ad network:
it picks a network, plays that network's ad and reports the result to its own stats API.
Whether the reward reached the drop's balance is the drop's business and stays in the farmer.

```js
const gigapub = new GigaPubClient(this, { projectId, networks, rotation });
await gigapub.watch();
```

`networks` and `rotation` are the script's `ads` list and the placement's rotation, copied
from the deobfuscated script. Without them the client plays Monetag alone, with the zone read
from the script.

## Flow

1. **Read the project.** `GET /script?id=<project>` is a per-project build of the SDK
   with the project's bearer token and its networks baked in. The client lifts the token
   (the only 32-character alphanumeric literal), and the Monetag zone (`show_<zone>`) when
   no networks were given.
2. **Announce the session.** `POST /v1/ad` with `{ method: "init" }`.
3. **Play the ad.** Through the network's own client, falling through to the next network
   on failure, each try reported as `adShowTryStart` then `adShowed` or `adShowError`.
4. **Done.** A show of 2.9 seconds or less is what the SDK calls `TooFastWatchingError`.

Every stats call carries `project-id`, `Authorization: Bearer <token>` and the Telegram
launch data (`user`, `platform`, `version`, `start_param`). They are best-effort, as in
the SDK.

## Mediation

`chanceOrder` draws networks by weight without replacement, moving each drawn weight to the
heaviest one left. Bid-net (`b`) is then pushed to the front, behind RichAds only when RichAds
drew first. TAC's `main` placement is Monetag 97.5%, RichAds (`rich`, `rB`, `rD`), Adexium
(`t`) and a Monetag direct link (`mc`) at 0.5% each.

| Name | Client |
| --- | --- |
| `monetag`, `m*` | `MonetagClient` on munqu.com / d3rem.com |
| `rich`, `r`, `rD` | `RichAdsClient.native()` |
| `rB`, `rR` | `RichAdsClient.interstitial()` |
| `t` | `AdexiumClient.play()` |
| `b` | `GigaBidClient.watch()` |

`mc` (a direct link), `onclicka`, `monetagPro`, `y` and the `self*` networks have no client
and are skipped.

The SDK's "X" config (`e: true, c: 1`) follows a success with a second network and reports it
as `adShowedX`. `doubleShow: true` does the same; it is off by default.

## If it stops working

- The SDK is obfuscator.io: a rotated string array (`a0a`) read through `a0b`. Rebuild
  the table by evaluating `a0a`, `a0b` and the rotation IIFE, then substitute every
  `bXX(0x...)` alias call, or run `npx webcrack` on it. Note that `SDK_VERSION` (`l` in the build, `v87` as of
  2026-10-02) sits next to the token.
- GigaPub loads Monetag from `munqu.com`, not `libtl.com`, and that build bakes a
  different ad host: `'9.m6lw.)=ow'` decodes to `d3rem.com` with Monetag's settings
  cipher. If Monetag calls fail, re-decode `wn()` in `munqu.com/sdk.js`.

## Gotchas

- `transactionId` becomes Monetag's `ymid`. Pass it only if the drop's page passes one to
  `showGiga`, since it is what a postback would be keyed on.
- The farmer's `static domains` need `gigapub.tech`, `munqu.com`, `d3rem.com`,
  `my.rtmark.net`, and for the other networks `adx1.com`, `4armn.com`, `favorit.work`,
  `convers.link`, `trafic.live` and `tgads.live`. Creative trackers live on arbitrary hosts.
