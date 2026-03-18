# Polymarket Arbitrage Bot (BTC / ETH / SOL Price Market Arbitrage Bot)

![Polymarket Arbitrage Bot Banner](image/banner.jpg)

Fully automated arbitrage bot for Polymarket 15-minute Up/Down markets. It attempts to buy both YES and NO sides at a combined cost below $1.00 and capture the spread at resolution. The edge comes from fast execution, strict entry filters, and disciplined risk controls.

## Strategy Overview (Detailed)

Every 15 minutes, Polymarket opens binary markets like *"Will BTC go Up or Down?"*. Each market has two tokens — YES and NO — and one side eventually settles at **$1.00** while the other settles at **$0.00**.

The bot's core setup is a two-leg hedge:
- Buy one side (YES or NO) when the price is temporarily cheap.
- Buy the opposite side using a dynamic threshold derived from the first fill.
- Only complete the hedge if expected total cost remains below a configured cap.

If both sides are acquired efficiently, payout math is straightforward:

```
Buy 5 YES shares @ $0.47  =  $2.35
Buy 5 NO  shares @ $0.47  =  $2.35
                     Total =  $4.70

Market resolves → winning side pays $1.00 × 5 = $5.00
Gross edge = $5.00 − $4.70 = $0.30 per cycle
Net edge = Gross edge − fees − slippage − missed-leg risk
```

In practice, this is **not guaranteed risk-free**. Real outcomes depend on execution quality, liquidity, fee model, and whether both legs fill at acceptable prices.

### What "Correct Arbitrage" Means in This Bot

The strategy is only valid when all of these are true:
- Combined average entry of YES + NO is below `TRADE_MAX_SUM_AVG` (default `0.99`).
- Position size stays small enough for top-of-book liquidity.
- Second leg is completed quickly after first-leg fill.
- The bot skips setups where spread is too thin after buffers/fees.
- Stale or partial orders are cleaned fast to avoid directional exposure.

### Step-by-Step Trade Lifecycle

1. **Market Scan**
   - Poll eligible markets (`TRADE_MARKETS`) and read midpoint/near-book prices.
   - Track local lows/highs per side during each 15-minute round.

2. **First-Leg Entry**
   - Enter first side when one trigger confirms an edge (reversal, depth discount, or timed threshold logic).
   - Use configured price buffer / order type to improve fill probability.

3. **Second-Leg Completion (Hedge)**
   - Compute dynamic threshold from first fill:
     - `secondSideThreshold = (1 - firstBuyPrice) + TRADE_DYNAMIC_THRESHOLD_BOOST`
   - Buy opposite side only if total blended cost remains inside cap.

4. **Validation and Safeguards**
   - Enforce max buys per side and minimum balance checks.
   - Skip entries when opportunity quality degrades (spread collapse, stale quotes, high combined average).

5. **Resolution and Redemption**
   - Hold hedged positions to market resolution.
   - Redeem winning shares and track realized PnL over repeated cycles.

### Practical Risk Model

This bot reduces risk, but does not eliminate it:
- **Execution risk**: first leg fills, second leg slips away.
- **Liquidity risk**: quoted prices may not support your size.
- **Fee drag**: small spreads can disappear after costs.
- **Operational risk**: API/network interruptions during fast windows.
- **Market mechanics risk**: settlement timing, redemption latency, and edge-case market behavior.

Use conservative sizing first, validate live fill quality, and scale only after stable net results.

## Supported Markets

This version of the bot is configured for **BTC, ETH, and SOL** 15-minute Up/Down markets on Polymarket.

## Features

- **Two-Leg Hedging Engine** — Buys both sides only when combined pricing stays inside edge constraints
- **Sub-second Execution** — 50ms polling loop with fire-and-forget order placement
- **Smart Entry Timing** — Three buy triggers (reversal, depth discount, time-based)
- **Adaptive Polling** — Speeds up to 100ms when opportunities are detected, slows to 2s when idle
- **Dynamic Thresholds** — Automatically adjusts second-side entry based on first-side fill price
- **State Persistence** — Resumes mid-hedge after restarts without losing position tracking
- **Risk Guards** — Max cost cap (`sumAvg < 0.99`), minimum balance check, stale order cleanup
- **Full Logging** — Every trade, price tick, and decision logged to daily rotating files

## Quick Start

### Prerequisites

- Node.js 18+ with `ts-node`
- A Polygon wallet funded with USDC
- Polymarket API credentials (auto-generated on first run)

### Install

```bash
git clone <repository-url>
cd Polymarket-Arbitrage-Trading-Bot
npm install
```

### Configure

Copy the example environment file and set your private key:

```bash
cp .env.example .env
```

```env
PRIVATE_KEY=your_polygon_wallet_private_key

TRADE_MARKETS=btc,eth,sol
TRADE_THRESHOLD=0.47
TRADE_SHARES=5
MAX_BUYS_PER_SIDE=1
```

### Run

```bash
npm start
```

The bot will:
1. Generate API credentials (first run only)
2. Approve USDC allowances on Polymarket contracts
3. Wait until your wallet has at least $1 USDC available
4. Begin the arbitrage loop

## Configuration Reference

### Core Settings

| Variable | Default | Description |
|---|---|---|
| `PRIVATE_KEY` | *required* | Polygon wallet private key |
| `TRADE_MARKETS` | `btc,eth,sol` | Markets to trade (comma-separated: `btc,eth,sol`) |
| `TRADE_THRESHOLD` | `0.47` | Entry price — buy when a token drops below this |
| `TRADE_SHARES` | `5` | Number of shares per buy |
| `MAX_BUYS_PER_SIDE` | `1` | Maximum buys per side per 15m cycle |
| `TRADE_MAX_SUM_AVG` | `0.99` | Max combined avg price (above this = no profit) |
| `TRADE_TICK_SIZE` | `0.01` | Price precision for orders |

### Speed Tuning

| Variable | Default | Description |
|---|---|---|
| `TRADE_POLL_MS` | `50` | Main loop interval (milliseconds) |
| `TRADE_MIN_POLL_MS` | `100` | Fastest adaptive poll rate |
| `TRADE_MAX_POLL_MS` | `2000` | Slowest adaptive poll rate |
| `TRADE_FIRE_AND_FORGET` | `true` | Place orders without waiting for confirmation |
| `TRADE_PRICE_BUFFER` | `0.05` | Cents above midpoint to ensure fill |
| `TRADE_USE_FAK` | `true` | Fill-and-Kill orders for instant execution |

### Entry Triggers

| Variable | Default | Description |
|---|---|---|
| `REVERSAL_DELTA` | `0.02` | Price bounce from bottom to trigger buy |
| `TRADE_DEPTH_BUY_DISCOUNT_PERCENT` | `0.02` | Buy if price drops this % below tracked low |
| `TRADE_SECOND_SIDE_BUFFER` | `0.003` | Buffer for opposite side entry |
| `TRADE_DYNAMIC_THRESHOLD_BOOST` | `0.04` | Extra cents added to second-side threshold |

### Timing

| Variable | Default | Description |
|---|---|---|
| `TRADE_WAIT_FOR_NEXT_MARKET_START` | `false` | Wait for next 15m boundary before starting |
| `TRADE_ORDER_CHECK_DELAY_MS` | `100` | Delay before first order status check |
| `TRADE_ORDER_RETRY_DELAY_MS` | `300` | Delay between order status retries |
| `TRADE_ORDER_MAX_ATTEMPTS` | `2` | Max retries for order confirmation |

## Trading Logic

### The 15-Minute Cycle

```
:00 ──── Market opens ─────────────────────── :15
  │                                              │
  │  Poll midpoint prices every 50ms             │
  │  Wait for YES or NO to drop below $0.47      │
  │                                              │
  │  Token drops → start tracking lowest price   │
  │                                              │
  │  Trigger fires → BUY first side              │
  │  Switch to opposite side                     │
  │  Trigger fires → BUY second side             │
  │                                              │
  │  ✓ Hedge complete — wait for resolution      │
  │                                              │
  :15 ── Market resolves → $1.00 payout ────────
```

### Three Buy Triggers (Entry Quality Filters)

The bot uses three independent triggers. Whichever validates first can execute the buy:

**1. Reversal Detection**
Price drops to a local minimum, then bounces by `REVERSAL_DELTA` (default `$0.02`). This reduces the chance of catching a falling knife.

**2. Depth Discount**
Price falls more than `TRADE_DEPTH_BUY_DISCOUNT_PERCENT` (default `2%`) relative to tracked levels. This captures sharp dislocations where reversal confirmation may be too late.

**3. Time Threshold (second side only)**
After buying one side, if the opposite side remains below dynamic threshold for a short confirmation window, buy to complete hedge. This prevents long single-leg exposure.

### Second Side Entry

After the first buy, the bot calculates a dynamic threshold for the opposite side:

```
secondSideThreshold = (1 - firstBuyPrice) + TRADE_DYNAMIC_THRESHOLD_BOOST

Example: Bought YES at $0.47
  → Buy NO when price ≤ 1 - 0.47 + 0.04 = $0.57
```

This aims to keep combined cost inside profitable range while still prioritizing fast hedge completion.

### Profit Protection

Before every buy, the bot checks:

```
avgPriceYES + avgPriceNO < TRADE_MAX_SUM_AVG ($0.99)
```

If the combined average would exceed `$0.99`, the buy is skipped because expected net edge is likely gone.

## Project Structure

```
├── src/
│   ├── index.ts               # Entry point — startup sequence
│   ├── config/index.ts        # Environment config loader
│   ├── order-builder/
│   │   └── copytrade.ts       # Core arbitrage engine (CopytradeArbBot)
│   ├── providers/
│   │   └── clobclient.ts      # Polymarket CLOB API client
│   ├── security/
│   │   ├── allowance.ts       # USDC approval management
│   │   └── createCredential.ts
│   ├── utils/
│   │   ├── balance.ts         # Wallet balance polling
│   │   ├── holdings.ts        # Token position tracking
│   │   ├── logger.ts          # Colored console logger
│   │   └── console-file.ts    # File logging (daily rotation)
│   └── data/
│       ├── copytrade-state.json  # Persistent hedge state
│       └── token-holding.json    # Token position database
├── .env
├── package.json
└── tsconfig.json
```

## Monitoring

The bot logs every action to both console and daily log files in `logs/`:

```
[INFO]  Starting the bot...
[INFO]  Credentials ready
[INFO]  Approving USDC allowances to Polymarket contracts...
[OK]    Wallet is funded
[INFO]  btc | YES=$0.52 NO=$0.48 — tracking NO (below $0.47)
[INFO]  btc | NO dropped to $0.44 (new low)
[INFO]  btc | REVERSAL triggered: NO bounced $0.02 from low → BUY
[OK]    btc | Bought 5 NO @ $0.46 — switching to YES side
[INFO]  btc | YES=$0.50 — below dynamic threshold $0.58
[OK]    btc | Bought 5 YES @ $0.50 — HEDGE COMPLETE
[INFO]  btc | Cost: $0.96/share — Guaranteed profit: $0.04 × 5 = $0.20
```

## Arbitrage Results

Sample arbitrage outcome from a live trading cycle:

![Arbitrage Result](image/result.png)

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the arbitrage bot |
| `npm run redeem` | Manually redeem a resolved market |
| `npm run redeem:holdings` | Auto-redeem all resolved positions |
| `npm run balance:log` | Log current wallet balances |

## Contact

Want a more profitable, private arbitrage trading bot? My private projects deliver higher returns with advanced strategies. Reach out for details.

---

**Disclaimer**: Trading prediction markets carries risk. Past performance does not guarantee future results. Always trade with funds you can afford to lose.
