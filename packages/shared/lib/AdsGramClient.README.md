# AdsGramClient

Runs an AdsGram rewarded block the way `sad.min.js` would, for drops that settle ads
server to server: AdsGram posts the reward to the drop's backend, so the farmer only has
to make the view count. Confirming the reward landed is the drop's business and stays in
the farmer.

```js
const adsgram = new AdsGramClient(this);
await adsgram.watch(blockId);
```

## Flow

1. `GET /adv?<signed query>` returns a banner carrying a list of `trackings`.
2. Fire `render`, then `show`.
3. Wait `playbackSeconds` (20 by default). AdsGram decides server side whether the view
   was long enough to pay, so the wait is generous rather than minimal.
4. Fire `reward` for a rewarded block, `skip` for an interstitial. A block with no step of
   the requested name is thrown on rather than tracked against the wrong one, which would
   burn the impression for no credit.

The tracker URLs come back already signed, so only their order matters.

## Signing

The query is built in the SDK's parameter order, which is load-bearing: the signature
covers the serialized query string and the server recomputes it over exactly what it
received. The result is appended as `raw`.

`raw` is HMAC-SHA256, hex encoded. The key is `SIGNING_SECRET` XORed byte-wise with the
current hour (`secret[i] ^ ((hour + i) % 256)`), so it rotates hourly on its own and a
signature is only good for the hour it was made in.

`data_check_string` is the initData pairs minus `hash` and `signature`, joined with
newlines and base64url encoded without padding. Ordering is `Intl.Collator("en")`, not a
plain sort, because that is what the SDK uses and the two disagree on keys containing `_`.

## If it stops working

`400` on every `/adv` call means `SIGNING_SECRET` or `SDK_VERSION` has gone stale. Both
come out of a fresh `sad.min.js`, where the secret hides behind a Vigenere-style string
obfuscator: evaluate the bundle and read the value passed to
`Uint8Array.from(secret, c => c.charCodeAt(0))`.

## Gotchas

- `chat_instance` is read from the raw initData, not `getInitDataUnsafe()`. It is a
  19-digit id, past `Number.MAX_SAFE_INTEGER`, and JSON-parsing it rounds off the last
  few digits.
- `is_premium` lives on the Telegram user, not at the top level of initData, so
  `getIsPremiumUser()` never sees it.
- `Authorization` is cleared per request. A drop's bearer token lives on the shared axios
  defaults and has no business reaching a third party.
- The publisher's `Origin` and `Referer` have to be on the request or AdsGram answers
  `400 {"error":"Wrong referer"}`. The cloud runner sets them for every call and the
  extension derives its rules from the farmer's `static domains`, which is why
  `api.adsgram.ai` belongs there.
- `toBase64Url` builds its string one byte at a time. The SDK spreads into
  `String.fromCodePoint`, which blows the call stack on a long enough input.
