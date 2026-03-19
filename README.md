# Polymarket Arbitrage Bot (15m Up/Down Hedged Strategy)

![Polymarket Arbitrage Bot Banner](image/banner.jpg)

This project runs a **hedged mean-reversion/arbitrage strategy** on Polymarket 15-minute Up/Down markets (BTC/ETH/SOL by default).  
It attempts to buy both YES and NO at a combined average cost below payout value.

## Strategy Overview (Correct Model)

Each 15-minute market has two outcomes:

- `YES` (e.g. "Up")
- `NO` (e.g. "Down")

At resolution, one side settles to `$1.00` and the other to `$0.00`.

If your average fill prices satisfy:

`avgYES + avgNO < 1.00`

then the position is economically favorable before fees/slippage.  
This bot targets that spread by entering one side, then quickly hedging the opposite side.

### Important Reality Check

This is **not guaranteed profit** in live markets. Real-world risks include:

- missed or partial fills
- stale mid-prices vs executable prices
- spread widening while hedging second side
- order status lag in fire-and-forget mode
- fees, infra latency, and API/rpc interruptions

The code includes controls to reduce these risks, but cannot remove them entirely.

---

## Core Trading Logic

### 1) 15-minute slug tracking

For each configured market symbol (`btc`, `eth`, `sol`), the bot constructs the current 15m slug and fetches token IDs from Gamma.  
When the slug rolls, tracking resets for the new cycle.

### 2) Flexible first entry, strict alternation after

On a fresh hedge:

- if YES or NO is below `TRADE_THRESHOLD`, the bot can start on that side (flexible entry)

After first successful buy:

- it enforces alternating sides (`YES -> NO -> YES ...`) to maintain hedge balance

### 3) Three buy triggers (first trigger wins)

The currently tracked side can trigger a buy by:

1. **Reversal Trigger**  
   Price rebounds from tracked low by `REVERSAL_DELTA`.

2. **Depth Discount Trigger**  
   Price drops deeply below tracked low by `TRADE_DEPTH_BUY_DISCOUNT_PERCENT`.

3. **Second-side Time Trigger**  
   For opposite leg only: if price stays below dynamic threshold for `TRADE_SECOND_SIDE_TIME_THRESHOLD_MS`, buy without waiting for reversal.

### 4) Dynamic second-leg threshold

After a buy, next-side threshold is computed from filled price:

`dynamicThreshold = 1 - firstFillPrice + TRADE_DYNAMIC_THRESHOLD_BOOST`

This makes second-side acquisition more aggressive so the hedge completes quickly.

### 5) Profitability and safety guards

- projected `sumAvg` is compared against `TRADE_MAX_SUM_AVG`
- minimum balance checks and optional drawdown stop
- stale order cleanup by age
- persistent state (`src/data/copytrade-state.json`) for resume/restart behavior

---

## Quick Start

### Prerequisites

- Node.js 18+
- Polygon wallet with:
  - USDC (for positions)
  - POL/MATIC (for gas)
- Polymarket API credentials (auto-created on first run)

### Install

```bash
git clone <repository-url>
cd Polymarket-Arbitrage-Trading-Bot
npm install
```

### Configure

```bash
cp .env.example .env
```

Minimum required:

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

Startup flow:

1. Create/load API credentials
2. Approve USDC allowances
3. Sync allowance with CLOB API
4. Wait for minimum USDC availability
5. Start continuous per-market strategy loop

---

## Recommended Strategy Parameters

These are practical baseline values for this codebase:

```env
TRADE_THRESHOLD=0.47
REVERSAL_DELTA=0.02
TRADE_DEPTH_BUY_DISCOUNT_PERCENT=0.02
TRADE_DYNAMIC_THRESHOLD_BOOST=0.04
TRADE_SECOND_SIDE_TIME_THRESHOLD_MS=200
TRADE_SECOND_SIDE_BUFFER=0.003
TRADE_MAX_SUM_AVG=0.98
TRADE_SHARES=5
MAX_BUYS_PER_SIDE=1
TRADE_FIRE_AND_FORGET=true
TRADE_ADAPTIVE_POLLING=true
TRADE_MIN_POLL_MS=100
TRADE_MAX_POLL_MS=2000
```

Notes:

- Raise `TRADE_THRESHOLD` (e.g. 0.48-0.49) for more fills but lower edge.
- Lower `TRADE_MAX_SUM_AVG` for stricter quality but fewer trades.
- If execution is unstable, try `TRADE_FIRE_AND_FORGET=false` for confirmation-based flow.

---

## Full Configuration Reference

### Core

| Variable | Typical | Description |
|---|---:|---|
| `PRIVATE_KEY` | required | Polygon wallet private key |
| `TRADE_MARKETS` | `btc,eth,sol` | Comma-separated symbols to trade |
| `TRADE_THRESHOLD` | `0.47` | Entry threshold for first-side tracking |
| `TRADE_SHARES` | `5` | Shares requested per order (auto-adjusts if order value < $1) |
| `MAX_BUYS_PER_SIDE` | `1` | Maximum attempts per side per 15m cycle |
| `TRADE_MAX_SUM_AVG` | `0.98` | Max allowed combined average price guard |
| `TRADE_TICK_SIZE` | `0.01` | Order price tick size |
| `TRADE_NEG_RISK` | `false` | Neg-risk mode toggle for order options |

### Entry + Hedging

| Variable | Typical | Description |
|---|---:|---|
| `REVERSAL_DELTA` | `0.02` | Reversal amount from low to trigger buy |
| `TRADE_DEPTH_BUY_DISCOUNT_PERCENT` | `0.02` | Deep drop trigger (% below tracked low) |
| `TRADE_DYNAMIC_THRESHOLD_BOOST` | `0.04` | Boost added to `1 - firstFillPrice` |
| `TRADE_SECOND_SIDE_BUFFER` | `0.003` | Buffer used for immediate opposite-side decisioning |
| `TRADE_SECOND_SIDE_TIME_THRESHOLD_MS` | `200` | Continuous time below threshold before second-leg time trigger |

### Speed + Execution

| Variable | Typical | Description |
|---|---:|---|
| `TRADE_POLL_MS` | `50` | Base polling interval |
| `TRADE_ADAPTIVE_POLLING` | `true` | Dynamic poll speed based on activity |
| `TRADE_MIN_POLL_MS` | `100` | Fastest adaptive polling |
| `TRADE_MAX_POLL_MS` | `2000` | Slowest adaptive polling |
| `TRADE_FIRE_AND_FORGET` | `true` | Do not block on order confirmation |
| `TRADE_PRICE_BUFFER` | `0.05` | Limit order buffer above midpoint |
| `TRADE_DYNAMIC_PRICE_BUFFER` | `true` | Increases buffer as sumAvg risk rises |

### Safety / Ops

| Variable | Typical | Description |
|---|---:|---|
| `TRADE_MIN_BALANCE_USDC` | `2` | Stop when available balance drops below this |
| `TRADE_MAX_DRAWDOWN_PERCENT` | `0` | Optional drawdown stop (`0` disables) |
| `TRADE_MAX_ORDER_AGE_MS` | `30000` | Cancel tracked stale orders after this age |
| `TRADE_WAIT_FOR_NEXT_MARKET_START` | `false` | Wait for next 15m boundary before run |
| `TRADE_ORDER_CHECK_DELAY_MS` | `100` | Initial order status check delay |
| `TRADE_ORDER_RETRY_DELAY_MS` | `300` | Retry delay for status polling |
| `TRADE_ORDER_MAX_ATTEMPTS` | `2` | Maximum order status check attempts |

---

## Strategy Walkthrough (Example)

Suppose:

- first leg filled at `0.46`
- `TRADE_DYNAMIC_THRESHOLD_BOOST=0.04`

Then:

- second-leg threshold target = `1 - 0.46 + 0.04 = 0.58`

If opposite side can be acquired around `0.52`, combined average can remain below 1.00:

- `0.46 + 0.52 = 0.98`

That leaves gross edge before fees/slippage.

---

## Project Structure

```text
src/
  index.ts                    # Startup sequence
  config/index.ts             # Env/config parser
  order-builder/copytrade.ts  # Main strategy engine (CopytradeArbBot)
  providers/clobclient.ts     # CLOB client bootstrap
  security/allowance.ts        # USDC allowance + sync
  security/createCredential.ts # API credential bootstrap
  utils/balance.ts             # Balance checks / wait gates
  utils/holdings.ts            # Position persistence
  utils/console-file.ts        # Daily file logging
  data/copytrade-state.json    # Persistent strategy state
```

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start bot |
| `npm run redeem` | Redeem by explicit condition/index sets |
| `npm run redeem:holdings` | Redeem using tracked holdings |
| `npm run balance:log` | Print wallet/CLOB balances |

---

## Monitoring and Logs

The bot writes to console and rotating files under `logs/` (configurable via `LOG_DIR`/`LOG_FILE_PREFIX`).

Watch for:

- repeated `order creation failed`
- frequent stale-order cancellations
- high `sumAvg` drift near `TRADE_MAX_SUM_AVG`
- low available USDC warnings / drawdown stop messages

---

## Risk Disclosure

This software is for research/automation purposes only.  
Trading prediction markets carries market, execution, technical, and operational risk.  
Use only capital you can afford to lose, and monitor live behavior before scaling.
