# Concept For Dynamic Economy

## Summary

A Minecraft server economy with one global market shared by every player. Every item has infinite shop stock, and every item starts with a base price of $1.00. Item prices change in response to purchases and sales, using a market score rather than storing the actual market price as the score.

The immediate design focus is the market-price system. Sales tax and other economy features are deliberately left for later.

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

## Integer Currency Storage And Large Numbers

The initial implementation preference is Java `long` values for player balances and transaction amounts, rather than storing currency balances as floating-point values.

- A proposed fixed internal scale is 1,000,000,000,000 internal units per displayed dollar ($1 = 10^12 units).
- Convert internal units to dollars only for display.
- One internal unit represents $0.000000000001.
- Keep market scores separate from money balances.
- A signed 64-bit Java `long` has a maximum value of 9,223,372,036,854,775,807. At 10^12 units per dollar, this caps a balance at roughly $9.22 million, so this scale may be too large for the desired economy.
- Guard against `long` overflow when multiplying, adding, or accumulating transaction totals. A transaction that cannot be represented safely must not corrupt balances or market state.

### Tiny prices as a mechanic

The mathematical formula stays positive for every finite score, but the stored currency uses discrete integer units. If the theoretical price becomes less than one internal unit, the plugin can deliberately apply a minimum price of 1 internal unit ($0.000000000001 at the proposed scale). This turns a precision limit into a market mechanic: an item can become extremely cheap but never sell for zero or a negative amount.

The plugin must not silently round a positive theoretical price to zero. Display formatting can show a readable small-price value, while the internal amount remains at least one unit.

### Could we add more digits than a long can store?

Yes. Instead of storing the entire balance in one `long`, an arbitrary-precision integer can store a number as multiple chunks. For example, a number can be split into groups of nine decimal digits, with each group stored separately; arithmetic carries between the groups when needed. This is the basic idea behind arbitrary-precision integer implementations, and Java already provides `BigInteger`.

This does not provide literally infinite digits: the number is limited in practice by available memory, processing time, and implementation limits. But it can grow far beyond the fixed maximum of one `long`. Scientific notation is different: a normal `double` can represent huge magnitudes compactly, but only keeps a limited number of significant digits, so it is not suitable for exact money balances.

Design decision still open: use one `long` per balance for simplicity, or use Java `BigInteger` / a chunk-based arbitrary-precision integer if the economy needs balances beyond the `long` limit. A fixed currency scale also needs to be chosen carefully: a trillion internal units per dollar provides tiny increments but leaves a maximum `long` balance of only about $9.22 million.

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

## Not Yet Designed

- Sales tax (intended to apply only to sales, after the sale proceeds are calculated).
- The final value of `R` and the score change per item.
- Whether different item types need different score-change rates.
- The exact minimum-price and rounding rules.
- Whether balances use `long` or arbitrary-precision integers.
- Display formatting for extremely small prices.
- Shop interface, commands, persistence format, and other plugin implementation details.

## Design Principle

When a technical limitation cannot be removed entirely, consider turning it into a deliberate game mechanic. In this economy, the finite precision of integer currency can become a defined minimum positive transaction amount rather than allowing item prices to reach zero or become negative.
