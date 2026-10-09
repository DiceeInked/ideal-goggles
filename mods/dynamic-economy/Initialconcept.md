# Concept For Dynamic Economy

## Summary

A Minecraft server economy with one global market shared by every player. Every item has infinite shop stock, and every item starts with a base price of $1.00. Item prices change in response to purchases and sales, using a market score rather than storing the actual market price as the score.

The economy is intended to evolve continuously as players farm, buy, sell, build, and compete. The core plugin should provide the market system without forcing scheduled resets, apocalypse events, or other server-specific story mechanics.

## Core Market Rules

- There is one shared global market. A trade by any player affects the price everyone sees.
- The shop has infinite stock. Buying an item never empties the shop.
- Every item starts with a base price of $1.00.
- Every item has its own independent market score, initially 0.
- Buying items increases that item's market score.
- Selling items decreases that item's market score.
- The market score can be positive, zero, or negative. It is a point-like value, not a currency amount.
- The same item uses the same global score and price formula for every player.

## Price Formula

Use an exponential relationship between the market score and the item's price:

`price = basePrice * R^score`

Where:
- `price` is the calculated item price.
- `basePrice` is $1.00 for every item at the initial launch.
- `R` is a configurable growth factor greater than 1. For example, `R = 1.01` means each score point multiplies the price by 1.01.
- `score` is the item's global market score.

With `R > 1`, a positive score raises the price and a negative score lowers it. Mathematically, the price approaches zero as the score becomes more negative but never reaches zero or becomes negative.

The growth factor and the number of score points added or removed per item are tuning settings, not final balance decisions.

## Currency Storage

The initial implementation preference is Java `long` values for player balances and transaction amounts, rather than storing currency balances as floating-point values.

- A proposed fixed internal scale is 1,000,000,000,000 internal units per displayed dollar ($1 = 10^12 units).
- Convert internal units to dollars only for display.
- One internal unit represents $0.000000000001.
- Keep market scores separate from money balances.
- A signed 64-bit Java `long` has a maximum value of 9,223,372,036,854,775,807. At 10^12 units per dollar, this caps a balance at roughly $9.22 million, so this scale may be too large for the desired economy.
- Guard against `long` overflow when multiplying, adding, or accumulating transaction totals. A transaction that cannot be represented safely must not corrupt balances or market state.

### When a price reaches the minimum

A theoretical price can become too small for the chosen currency precision and round to zero. For the first version, the plugin may clamp the transaction price to the minimum positive internal unit instead of allowing a zero-value transaction.

An item that reaches this floor could be considered oversaturated. The price can remain at the floor until market activity raises it above the threshold. The plugin could display a unique message or list the item on an “Oversaturated Items” page, but the exact interface is not required for the first version.

The minimum price is not, by itself, an infinite-money exploit: if buying costs one unit and selling pays one unit while the item remains at the floor, a round trip earns nothing. Transaction order, rounding, bulk trades, overflow checks, and atomic balance/inventory updates still need to be implemented consistently. Trades separated by other players' market activity may legitimately produce a profit or a loss.

## Transaction Pricing

Prices are calculated using the item's current global market score, and the score changes according to the quantity traded. The market is not required to force a player's later sale to reverse their earlier purchase at a guaranteed price.

### Buying

1. Determine the item's price at the current market score.
2. Charge the buyer the pre-purchase price for the unit.
3. Give the item to the player.
4. Increase the market score for that unit, updating the price for later units and transactions.

### Selling

1. Verify that the player has the item to sell.
2. Decrease the item's market score for the unit being sold.
3. Calculate the price at the post-sale market score.
4. Pay the seller that post-sale price for the unit, before any future sales tax is applied.
5. Remove the sold item from the player's inventory as part of the same successful transaction.

### Bulk Transactions And Market Movement

- Calculate prices per unit along the score path; do not apply one final stack price to every item in a bulk transaction.
- Other players' trades can change the global score between a player's purchase and later sale. That can cause the seller to receive more or less than they originally paid. This is intended market risk, not an exploit by itself.
- Do not add a special hard-reversal mechanism that guarantees every resale restores the original transaction.
- If no other trade occurs between buying and selling, and each purchase raises the score by exactly the amount that a sale lowers it, the formula's arithmetic naturally means a sale uses the post-sale score and can retrace the score path. This is a consequence of the chosen formula and transaction order, not a separate enforced rule.
- Splitting a sale into smaller transactions should be evaluated carefully. If the same units follow the same score path and no other trades occur between them, totals should be consistent, subject to the chosen internal rounding rules.
- Market updates, item transfers, and balance updates must succeed or fail together. Avoid partially completed trades if an inventory or balance check fails.
- Prevent guaranteed money creation caused by rounding, overflow, or inconsistent transaction ordering. Do not prevent all profit or loss caused by market movement.

## Economy Evolution

The economy is expected to flex and change as the server ages. Resources that are easy to mass-produce can become oversupplied and extremely cheap. Sticks are one possible example because players can turn logs into sticks and produce large quantities; bamboo and sugarcane are other possible candidates depending on player behavior and the server's builds.

As a resource becomes less profitable, players may stop selling it, change what they farm, or build larger farms and bases around more profitable goods. Meanwhile, high-demand or difficult-to-obtain items, such as maces, netherite armor, and enchanted books, may become very expensive. This can encourage specialization, trading, competition, and large player-built industrial areas. These are possible outcomes, not guaranteed ones; actual behavior will depend on the price multiplier, score changes, and what players choose to do.

An item reaching the minimum price does not automatically mean the entire economy has failed. It can simply reflect low demand relative to supply. The core plugin should not force an item to become valuable again just because its price has reached the floor.

## Optional Extensions Outside The Core Plugin

Server owners may independently build optional features around the economy, such as a configurable economy reset or an apocalypse event triggered after a certain number of oversaturated items. For example, an extension could make shop announcements go quiet, display an ominous countdown, and reset economy values when the countdown ends.

These are not part of the core plugin's required behavior. Any reset extension must decide what happens to player balances, market scores, and items carried across the reset. In particular, buying items at the minimum price before a reset and selling them at restored prices afterward could multiply wealth, so this interaction should be a deliberate design choice rather than an accidental exploit.

## Not Yet Designed

- Sales tax (intended to apply only to sales, after the sale proceeds are calculated).
- The final value of `R` and the score change per item.
- Whether different item types need different score-change rates.
- Exact minimum-price and rounding rules.
- The final currency scale and balance limits.
- How the oversaturated-items status will be exposed in the first version.
- Display formatting, shop interface, commands, persistence, and other plugin implementation details.

## Design Principle

When a technical limitation cannot be removed entirely, consider turning it into a deliberate game mechanic. In this economy, a price reaching the minimum can become a recognizable oversaturated market state, rather than a problem that must be hidden or automatically reversed.
