# Discovered server functions

```js
{
    "activateBoost": {
        "id": "03959681dd21d1e0e270bd98d3ab6eba0fa2067bfe214cfdce334da125e2aa7e",
        "method": "POST",
        "callbackName": "zD"
    },
    "checkPartnerPayment": {
        "callbackName": "$D"
    },
    "claim": {
        "id": "2e733d4421083e1c5d015bffd6ae61e1f515cbd3ce845d4e1feca302d58e3622",
        "method": "POST",
        "callbackName": "RD"
    },
    "completePartnerTask": {
        "id": "246f0efd6536b3d0bc3ab292e97c52bb5bdc8f5d33bdd8a1fe3ee08c38c58344",
        "method": "POST",
        "callbackName": "nO"
    },
    "completeTask": {
        "id": "2df8a413947e198acc1e9972e6c5ece13abfeb9cdce8fe4242a7e3a6d2dbc4de",
        "method": "POST",
        "callbackName": "GD"
    },
    "createPartnerTask": {
        "id": "226398756f56a1359e5a7eae3290763d24a06443841d85691d092352b31977e3",
        "method": "POST",
        "callbackName": "QD"
    },
    "getCheckin": {
        "id": "a89b7ac0c129ae4dc3b2b0886284b8f4ce29112ffe51133e0ec2e3c7cac628e2",
        "method": "POST",
        "callbackName": "ZD"
    },
    "getCreatureImage": {
        "id": "09859cbe63116eecbbcb81b3e714cfc2def21f9c275ab5679aedcd2653e7931b",
        "method": "POST",
        "callbackName": "HD"
    },
    "getLeaderboard": {
        "id": "340f815e3f0c83e9ddf67608909cbdf493909aaa6d60edb9965387958eb46c26",
        "method": "GET",
        "callbackName": "YD"
    },
    "getLevelJourney": {
        "id": "ebafafdbe82a91a845654ededf946277aa3ded2899eb28fd122bf51c40603a5f",
        "method": "POST",
        "callbackName": "rO"
    },
    "getMe": {
        "id": "1714a0fbeb1f995feb843b2bdeb5562f6bfb8e2d580fb3339f1900082bec66cc",
        "method": "POST",
        "callbackName": "LD"
    },
    "getReferrals": {
        "id": "97e828d08ca901336a224e92dc1b873a8bdcce22093c0c5bc0deec4e8034266a",
        "method": "POST",
        "callbackName": "JD"
    },
    "listCreatureImages": {
        "id": "c9a5fc5311add9cce778c4f4d0edf303bffa24fa12f6baf42ee69770b89e5069",
        "method": "GET",
        "callbackName": "UD"
    },
    "listMiners": {
        "id": "57d8a55ba46c4e827759dd9f9350274a9fc140a83d387fb7993858211183a122",
        "method": "GET",
        "callbackName": "VD"
    },
    "listMyPartnerTasks": {
        "id": "dabe823fc1153f57699d7fb65ae30e8f2178b56daae951b0267f41e79482f77e",
        "method": "POST",
        "callbackName": "tO"
    },
    "listPartnerTasks": {
        "id": "af6f0983a48940cf836c3e975e1116672adc3bf6b6c55edf891bd8eb48fe8b5d",
        "method": "POST",
        "callbackName": "eO"
    },
    "listTasks": {
        "id": "f921548e4413250ce822311b1e4e625130bd1c4e9c578658a70465d8e4e6a507",
        "method": "POST",
        "callbackName": "WD"
    },
    "listWithdrawals": {
        "id": "614b64c4c23d721d6b3b3b82cb2135b62c188a8d4537002d56b25c4258a25e9c",
        "method": "POST",
        "callbackName": "KD"
    },
    "openSuperBall": {
        "id": "9b6df86e670d4421924e1e59b842ec028274fe0a9ef8c8f333c7b5ee88b92273",
        "method": "POST",
        "callbackName": "BD"
    },
    "requestWithdraw": {
        "id": "44159a98ca70583383c198b867061190e9379cc0c29872938797fce20d7c09da",
        "method": "POST",
        "callbackName": "qD"
    },
    "setTonAddress": {
        "id": "7abde04d7932e5ad8f1eff9efd436a960a6f5324f7eae508efa789c1cca4e255",
        "method": "POST",
        "callbackName": "XD"
    }
}
```

## Response deserialization

Pika is a TanStack Start app. Server functions are POSTed to
`/_serverFn/<id>` with the payload serialized as `{ data: <payload> }`, and the
response is serialized with seroval's **cross-JSON** encoder and marked with the
`x-tss-serialized` header.

To decode it on the client you must use `fromCrossJSON` (NOT `fromJSON` — a
different, incompatible pair) with the plugin set the client registers via
`getDefaultSerovalPlugins()`. In practice that is `defaultSerovalPlugins` from
`@tanstack/router-core` (`$TSR/Error`, `tss/RawStream` + its factory extends,
and `seroval/plugins/web/ReadableStream`). We don't send
`accept: application/x-tss-framed`, so responses come back as a single plain
`application/json` payload — a plain `fromCrossJSON` call is enough. See
`deserializeServerResponse` in `PikaFarmer.js`.

### Errors are HTTP 200

Every decoded response is an envelope: `{ result, error, context }`. Failures
still return **HTTP 200** — they just carry a serialized `$TSR/Error` in `error`
and leave `result` undefined:

```jsonc
// getCheckin, called twice in one day
{"t":10,"i":0,"p":{"k":["result","error","context"],
 "v":[{"t":2,"s":1},
      {"t":25,"i":1,"s":{"message":{"t":1,"s":"Already checked in today"}},"c":"$TSR/Error"},
      ...]}}
```

The envelope itself is a plain object, so an `instanceof Error` check on it
never fires — `deserializeServerResponse` must inspect `data.error` explicitly
or every failure silently decodes to `undefined`. The message lives on
`error.message` (there is no axios `response.data.message` to fall back on).

Observed messages: `Already checked in today`, `Task on cooldown`.

## Payloads (all auth'd calls include `initData`)

| Function          | Payload                                        |
| ----------------- | ---------------------------------------------- |
| `getMe`           | `{ initData, deviceFingerprint }`              |
| `claim`           | `{ initData }`                                 |
| `activateBoost`   | `{ initData }`                                 |
| `openSuperBall`   | `{ initData }` → `{ ok, prize, tier }`         |
| `getCheckin`      | `{ initData }` (claims the daily reward)       |
| `listTasks`       | `{ initData }`                                 |
| `completeTask`    | `{ initData, taskId }`                         |
| `getReferrals`    | `{ initData }`                                 |
| `getLevelJourney` | `{ initData }`                                 |
| `listWithdrawals` | `{ initData }`                                 |
| `requestWithdraw` | `{ initData, amount, ton_address }`            |
| `setTonAddress`   | `{ initData, ton_address, deviceFingerprint }` |
| `listMiners`      | GET, no payload                                |
| `getLeaderboard`  | GET, no payload                                |

`setTonAddress` only needs the raw TON address string — the frontend TON Connect
proof never reaches the server function, so no wallet key/signature is required.

## Responses (captured live, 2026-07-26)

`getMe`:

```jsonc
{
  "user": {
    "id", "telegram_id", "username", "first_name", "photo_url",
    "wallet_balance", "pool_balance", "current_miner_level", "peak_miner_level",
    "ton_address", "referrer_id", "device_fingerprint", "last_ip",
    "last_claim_at", "last_boost_at", "last_checkin_at", "checkin_streak",
    "pending_balance", "super_balls", "banned", "ban_reason", "banned_at",
    "total_pika_earned", "total_level_ups", "today_pika_earned", "today_level_ups"
  },
  "miner": { "level", "hash_speed", "pika_per_hour", "required_holding" },
  "wallet_connected": true,
  "holding_balance": 0, "pending": 0.0075, "pending_balance": 0.00025,
  "accrued_seconds": 299, "max_accrue_seconds": 31536000, "super_balls": 0,
  "withdraw_terms": { "min": 500, "fee_rate": 0.1, "fee": 50, "fee_max": 938, "gas_ton": 0.05, "gas_usd": 0.0755 },
  "price": { "pika_usd", "pika_ton", "ton_usd", "ratio" }
}
```

Matching the app's mine route: claimable = `pending + pending_balance`, total
balance = `holding_balance + user.pool_balance`, and the claim button only
shows when `wallet_connected && miner.pika_per_hour > 0`.

| Function          | Response                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `activateBoost`   | `{ ok, bonus, pending_balance, duration }` — the "tap the coin" action; ~0.000125 PIKA for 5s max speed, repeatable            |
| `openSuperBall`   | `{ ok: true, prize, tier }` or `{ ok: false, reason: "empty" }`                                                                |
| `getCheckin`      | `{ reward, streak, next_available_at, pending_balance }`; throws `Already checked in today` when repeated                      |
| `listTasks`       | flat array of `{ id, slug, title, icon, reward, url, task_type, chat_username, cooldown_seconds, active, done, available_at }` |
| `getReferrals`    | `{ referrals: [], telegram_id }` — no earnings field (+10 PIKA per friend who connects a wallet)                               |
| `getLevelJourney` | `{ current, peak, from_peak, total_pika_earned, total_level_ups, today_*, history: [{ level, at }], member_since }`            |
| `listWithdrawals` | array of `{ amount, ton_address, fee, status, tx_hash, created_at }`, status ∈ pending/processing/sent/failed                  |
| `listMiners`      | `{ miners: [{ level, hash_speed, pika_per_hour, required_holding, usd_preview }] (400), price }`                               |
| `getLeaderboard`  | `{ rows: [{ telegram_id, username, first_name, photo_url, level, peak_level, claimed, total, joined_at }] }`                   |

### Check-in

Streak runs to 10 (`checkinStreak: "Streak {{n}}/10"`), `next_available_at` is
the next UTC midnight, and the reward is credited to `pending_balance` — i.e. it
is claimable, not paid straight into the pool. Because of that, `process()` runs
Check-in and Boost **before** the mining claim so the same run collects both.
`user.checkin_streak` / `user.last_checkin_at` on `getMe` mirror the state.

### Tasks

Tasks recycle on `cooldown_seconds` (86400). `done` means the current cycle is
claimed; `available_at` is when the next one opens. `completeTask` on a task
that is either `done` or still has a future `available_at` throws
`Task on cooldown`, so filter on both.

### Withdrawals

Paid out of `user.pool_balance`, minimum `withdraw_terms.min` (500 PIKA). The
app previews the fee as `clamp(ceil(amount * fee_rate), 1, fee_max)` and sends
the **gross** amount — the fee is deducted server-side.

`withdraw({ max, difference, force })` is the unattended path used by `process()`
and by Pika Bolt's cloud batch withdrawal; `withdrawInteractive()` is the tool
entry that prompts for an amount. Unattended runs require
`min + WITHDRAWAL_BUFFER` so they do not fire the instant the pool crosses the
minimum — cloud batches pass `force: true` to withdraw at exactly `min`.

## Pika Bolt (Auto)

`static auto` opts Pika into the shared Auto system (see
`packages/shared/lib/auto/`), against jetton
`EQAzPeuDLOCJ7mvzGskNPhIHzrYD4HZpaiqMvXmh0S8LTjh6`. The miner level is driven by
`holding_balance` versus `miner.required_holding`, so "boosting" means moving
PIKA into the sub-account's linked wallet.

`connectAutoWallet()` re-calls `setTonAddress` with the address already on file:
that is what makes the backend re-read the on-chain holding after a boost
transfer lands, and it doubles as the initial link since no TON Connect proof is
required.
