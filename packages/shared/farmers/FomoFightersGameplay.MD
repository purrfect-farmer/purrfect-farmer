# Fomo Fighters - Gameplay Mechanics & Automation Plan

Reverse-engineered from HAR recordings (fresh account + clan account).

---

## Resources

| Resource | Generation | Storage Cap |
|:---------|:-----------|:------------|
| Food | Per hour (farms) | `foodStorageLimit` |
| Wood | Per hour (lumber mills) | `woodStorageLimit` |
| Stone | Per hour (quarries) | `stoneStorageLimit` |
| Gems | Premium currency (quests, purchases) | Uncapped |

- Resources accumulate based on `{resource}PH` (per hour) rate from `hero.propsCompiled`
- Must be manually claimed via `resource/claim`
- Storage cap = max accumulated before claiming (upgradeable via storage building)
- `lastClaimDate` tracks when each resource was last collected

---

## Races

Three races, chosen during onboarding. Determines available troops.

| Race | Type | Strength |
|:-----|:-----|:---------|
| Cat | people | ATK-focused |
| Dog | people | DEF-focused |
| Frog | people | Balanced |

---

## Buildings (22 types, max level 50)

Castle level gates all progression. Building flow:

```
Castle (hero level) -> Storage -> Resource buildings -> Military -> Academy -> Advanced
```

### Building Categories

**Core:**
- `castle` - Gates everything. Castle level = hero level.
- `storage` - Increases resource storage caps

**Resource (3 tiers each):**
- `farm_1`, `farm_2`, `farm_3` - Food production
- `lumber_mill_1`, `lumber_mill_2`, `lumber_mill_3` - Wood production
- `quarry_1`, `quarry_2`, `quarry_3` - Stone production

**Military:**
- `archery_range` - Trains archers (ranged)
- `barracks` - Trains infantry (melee)
- `scout_camp` - Trains scouts (recon)
- `stable` - Trains cavalry (requires academy research)
- `siege_workshop` - Trains siege units (requires academy research)

**Support:**
- `academy` - Research skills/tech
- `hospital` - Heals wounded troops after battle
- `stash` - Protects resources from raids
- `market` - Trade resources
- `tavern` - Hero recruitment/upgrades

### Building Purchase Flow

1. Check `requiredBuildings` (e.g., castle level)
2. Check resource costs (`priceFood`, `priceWood`, `priceStone`)
3. `building/buy` with position + buildingKey
4. Timer starts (`tBuildings`) - speedup with gems or wait
5. Building info refreshes after completion

### Building Position System

22 available positions (1-22). Each building occupies one position. Castle is always position 0.

---

## Troops (5 tiers per building)

Troops are race-specific (e.g., `cat_archer_10`, `cat_barracks_30`).

### Tier System

| Tier | Suffix | Requirements |
|:-----|:-------|:-------------|
| T1 | `_10` | Building level 1 |
| T2 | `_20` | Building level + skills |
| T3 | `_30` | Building level + skills |
| T4 | `_40` | Building level + skills |
| T5 | `_50` | Building level + skills |

### Troop Requirements

Each troop has:
- `requiredBuildings`: `{"archery_range": 1}` - building + minimum level
- `requiredSkills`: `["open_stable"]` - academy skills that must be researched
- `priceFood`, `priceWood`, `priceStone`, `priceGem` - per-unit costs
- `building` - which building trains it
- `isScout` - true for scout units

### Training Flow

1. `troops/buy` with `{troopKey, count}`
2. Timer starts (`tTroops`) - speedup with gems or wait
3. Training capacity per building: `hero.propsCompiled.trainingCapacity{BuildingName}`

---

## Academy / Skills

67 skills available. Research unlocks higher troop tiers and provides stat boosts.

### Research Flow

1. `skills/buy` with `{skillKey}` (e.g., `"wood_1"`, `"open_siege_workshop"`)
2. Timer starts (`tSkills`) with `dateStart`/`dateEnd`
3. Costs resources; some skills have building prerequisites
4. Skills data: `allData.skills` array with `{key, level, updateDate}`

### Key Unlock Skills

- `open_stable` - Unlocks stable building
- `open_siege_workshop` - Unlocks siege workshop
- Higher tier troop skills gate T2-T5 troops

---

## Combat System

### Targets

Two target types available on the world map:
- **Oasis** - Resource nodes, no scouting needed
- **Camp** - Enemy camps, must scout before attacking

### Scout Flow

1. `attack/create/scout` with target + scout troops
2. Wait for scout timer (`tScouts`)
3. Wait for scout return (`tScoutReturns`)
4. Target info updated with enemy composition

### Attack Flow

1. `attack/create` with target + troop composition
2. Wait for attack timer (`tAttacks`)
3. Wait for return timer (`tReturns`)
4. Read battle logs (`battle/logs/my`, `battle/logs/read/all`)
5. Loot resources added to hero

### Hospital

After battles, wounded troops go to the hospital:
- `attack/info` response includes `hospital.available` (wounded troops ready to heal)
- `hospital/heal` with `{troops: {troopKey: count, ...}}` - heal all available wounded
- Hospital has a `capacity` limit
- Healing starts a timer (`tHospital`)
- **Always heal after attacks to recover troops for next cycle**

### Timer System

All timers use `dateStart`/`dateEnd` format. Timer categories:
- `tBuildings` - Building construction/upgrade
- `tTroops` - Troop training
- `tSkills` - Academy research
- `tAttacks` - Active attacks
- `tReturns` - Troops returning from attack
- `tScouts` - Active scouts
- `tScoutReturns` - Scouts returning
- `tHospital` - Troops being healed

### Speedup System

`dbSpeedup` contains speedup items (e.g., `speedup_1`). Cost gems to instantly complete timers.
- `building/timer/speedup` with `{timerId, speedUpKey}`
- `troops/timer/speedup` with `{timerId, speedUpKey}`

---

## Quests

### Main Quests (`dbQuestsMain`)

Sequential progression. Types:
- `build` - Own building at level X
- `trainTotal` - Train X total troops
- `attack` - Attack X targets of type
- `power` - Reach X total power
- `resourceBuy` - Purchase X resources
- `clan` - Clan-related actions
- `research` - Research X skills

Claim via `quest/main/claim` with `{questKey}`.

### Side Quests (`dbQuestsSide`)

Milestone-based with multiple tiers (`counts` array). Types match main quests plus:
- `resourceClaim` - Claim X of resource type
- `resourceLoot` - Loot X from attacks
- `trainBuilding` - Train X troops at building
- `killPoints` - Accumulate kill points

Claim via `quest/side/claim` with quest name.

### Premium Quests / Riddles (`dbQuests`)

- Riddles: `riddle_*` keys with `checkData` containing the answer
- Check via `quest/check` then claim via `quest/claim`

### Story Daily Quests (`dbQuestsStoryDaily`)

Daily objectives reset each day. Types: `resourceClaim`, `resourceLoot`, `trainBuilding`, `attack`, `buildings`, `skills`, `pvp`, `clan`, `resourceBuy`.

Claim via `quest/story/daily/claim` with `[questKey]`.

### Story Daily Milestone Rewards

Separate from individual daily quests. Earned at point thresholds: `points_20`, `points_40`, `points_60`.

Claim via `quest/story/daily/reward/claim` with `[rewardKey]`.

### Daily Login Reward

`afterData.questDailyRewards` - entries with value `"canTake"` are claimable.
Claim via `quest/daily/claim` with day key.

---

## Clans & Clan Rewards

### Overview

Clans enable:
- **Clan Wars** - PvP events between clans; earn **USDT** (the ultimate farming goal)
- **Clan Donations** - Contribute resources for quest progress
- **Clan Rewards** - Timed rewards based on clan level
- **Reinforcements** - Send/receive troops between clan members

### Data Sources

| Data | Location |
|:---|:---|
| Clan membership | `allData.clan` (empty array if not in clan) |
| Clan reward timers | `afterData.stClanRewards` (array of `{key, dateStart, dateEnd}`) |
| Reward definitions | `allData.dbData.dbClanRewards` (25 tiers: `clan_1` through `clan_25`) |
| War logs | `afterData.warLogs` (array with `isClaimed`, `isExpired` flags) |
| War points | `afterData.warPoints` (cumulative) |

### Clan Rewards

`stClanRewards` contains active reward timers:
```json
[
  {"key": "clan_3", "dateStart": "2026-04-06 14:20:42", "dateEnd": "2026-04-06 17:20:42"},
  {"key": "clan_5", "dateStart": "2026-04-06 14:20:42", "dateEnd": "2026-04-06 19:20:42"}
]
```

Claim ALL available rewards in bulk: `clan/rewards/claim-all` with `{}` body.

### War Rewards

War logs contain completed wars:
```json
{
  "id": "37824e7b-...",
  "attackerId": 931,
  "targetId": 3345,
  "isClaimed": false,
  "isExpired": false,
  "totalPower": 64525912
}
```

Claim unclaimed, non-expired wars: `war/reward/claim` with war ID.

### Related API Endpoints

| Endpoint | Purpose |
|:---------|:--------|
| `clan/rewards/claim-all` | Bulk claim all available timed clan rewards |
| `clan/members` | List clan members (pass clan ID) |
| `clan/logs` | Clan activity log (donations, joins) |
| `war/logs` | List war history for own clan |
| `war/logs/detail` | Detailed war breakdown (per-member impact) |
| `war/reward/claim` | Claim rewards for a specific war (pass war ID) |
| `war/clan/list` | List clans available for war |
| `war/last` | Recent global war results |

---

## Hospital System

### Flow

1. Troops get wounded in combat (not destroyed)
2. `attack/info` returns `hospital` object:
   - `capacity` - Max wounded troops the hospital can hold
   - `wounded` - All wounded troops
   - `healing` - Troops currently being healed
   - `available` - Wounded troops ready to be healed
3. `hospital/heal` with `{troops: {troopKey: count, ...}}`
4. Timer starts (`tHospital`) for healing duration
5. Healed troops return to available pool

### Heal Request Format

Send all available wounded troops:
```json
{
  "troops": {
    "cat_archer_30": 330,
    "cat_barracks_10": 134,
    "cat_stable_30": 56
  }
}
```

---

## Onboarding (76 steps)

Sequential tutorial that drives early game. Each step has:
- `key` - Step identifier
- `title` - Description
- `minHeroLevel` / `maxHeroLevel` - Level range
- `needToShowMethodCheck` - What action is needed
- `isCompleteAfterClick` - Auto-completes when acknowledged
- `action` - UI route (e.g., `/city/castle`)

### Check Types (`needToShowMethodCheck`)

| Type | Action Required |
|:-----|:---------------|
| `build` | Build/upgrade a building (data = `{building: level}`) |
| `claimSmt` | Claim any resource |
| `claimQuestStoryMain` | Claim a main quest |
| `claimQuests` | Claim main quests |
| `claimQuests3` | Claim 3+ main quests |
| `trainBuilding` | Train troops at building (data = `{building: count}`) |
| `attack` | Attack targets (data = `{type: count}`) |
| `openLogs` | View battle logs |
| `notClaimDailyReward` | Claim daily reward |
| `notClaimQuestTg` | Claim Telegram quest |

---

## Automation Strategy

### Per-Run Priority Order (7 Phases)

1. **Login & Fetch state** - Auth, fetch `user/data/all` + `user/data/after`, log user info
2. **Phase 1: Onboarding** - Complete all pending steps (fresh accounts must finish first)
3. **Phase 2: Resources** - Claim all accumulated resources
4. **Phase 3: Quests + Daily reward** - Main, side, premium/riddles, daily login
5. **Phase 4: Post-onboarding loop** (hero level >= 2)
   - Building upgrades (castle > storage > resource > military, claim quests after each)
   - Academy research (skills that unlock new buildings/troops)
   - Train troops (best tier at each military building)
   - Attacks (oases first, then camps with scout cycle)
   - Hospital heal (recover all wounded troops)
   - 2nd pass resources + quests
6. **Phase 5: Clan rewards + War rewards** (if in a clan)
   - Bulk claim timed clan rewards
   - Claim unclaimed war rewards
7. **Phase 6: Story daily quests + milestone rewards**

### Delays Between Tasks

All phases and sub-operations include delays (2-3 seconds between phases, 1-2 seconds within loops) to avoid rate limiting and mimic natural gameplay. All delays respect the abort signal for clean cancellation.

### Progression Milestones

| Castle Level | Unlocks |
|:-------------|:--------|
| 1 | farm_1, lumber_mill_1 |
| 2 | archery_range, storage, castle upgrades, post-onboarding loop |
| 3+ | scout_camp, barracks, academy, quarry_1 |
| Academy | stable (open_stable skill), siege_workshop (open_siege_workshop skill) |
| Higher | farm_2/3, lumber_mill_2/3, quarry_2/3, market, tavern, hospital, stash |

### Key Goals

- **Max buildings** - All 22 types at highest level
- **Max troops** - Train highest tier at every military building
- **Max skills** - Research all 67 academy skills
- **Max power** = `powerBuildings + powerTroops + powerSkills`
- **Earn USDT** - Through clan war participation (manual initiation)

---

## API Endpoint Reference

### Auth & Data

| Endpoint | Purpose |
|:---------|:--------|
| `telegram/auth` | Login with Telegram initData |
| `user/data/all` | Full game state (hero, buildings, dbData, timers, skills) |
| `user/data/after` | Dynamic state (troops, targets, quests, hospital, clan rewards, war logs) |
| `user/data/timers` | Refresh all active timers |

### Buildings

| Endpoint | Purpose |
|:---------|:--------|
| `building/info` | Get building state |
| `building/buy` | Purchase/upgrade building |
| `building/buy/instant` | Purchase with gems (skip timer) |
| `building/timer/speedup` | Speedup building timer with gems |

### Troops

| Endpoint | Purpose |
|:---------|:--------|
| `troops/info` | Get troops state |
| `troops/buy` | Train troops |
| `troops/timer/speedup` | Speedup training timer |

### Combat

| Endpoint | Purpose |
|:---------|:--------|
| `attack/info` | Get attack state + hospital + targets |
| `attack/create` | Send troops to attack target |
| `attack/create/scout` | Send scouts to target |
| `attack/rating` | Attack leaderboard |
| `target/info` | Get target details |
| `target/logs` | Get target-specific logs |
| `battle/logs/my` | Get battle log list |
| `battle/logs/read` | Mark single log as read |
| `battle/logs/read/all` | Mark all logs as read |
| `hospital/heal` | Heal wounded troops |

### Academy

| Endpoint | Purpose |
|:---------|:--------|
| `skills/buy` | Research a skill |

### Quests

| Endpoint | Purpose |
|:---------|:--------|
| `quest/check` | Submit quest answer (riddles) |
| `quest/claim` | Claim quest reward |
| `quest/main/claim` | Claim main quest |
| `quest/side/claim` | Claim side quest |
| `quest/daily/claim` | Claim daily login reward |
| `quest/story/daily/claim` | Claim story daily quest |
| `quest/story/daily/reward/claim` | Claim story daily milestone reward (points_20/40/60) |

### Resources

| Endpoint | Purpose |
|:---------|:--------|
| `resource/claim` | Claim accumulated resource |

### Onboarding

| Endpoint | Purpose |
|:---------|:--------|
| `onboarding/finish` | Complete onboarding step |
| `race/select` | Choose race (cat/dog/frog) |

### Clan & War

| Endpoint | Purpose |
|:---------|:--------|
| `clan/rewards/claim-all` | Bulk claim all available timed clan rewards |
| `clan/members` | List clan members (pass clan ID) |
| `clan/logs` | Clan activity log |
| `clan/rating` | Clan leaderboard |
| `war/logs` | Own clan's war history |
| `war/logs/detail` | Detailed war breakdown by member |
| `war/reward/claim` | Claim war reward by war ID |
| `war/clan/list` | List clans available for war |
| `war/last` | Recent global war results |

### Other

| Endpoint | Purpose |
|:---------|:--------|
| `ton/wallet/info` | TON wallet details |
| `purchase/list` | In-app purchases |
