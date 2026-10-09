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

## Integer Currency Storage

Use Java `long` values for stored player balances and transaction amounts rather than storing currency balances as floating-point values.

- Use a fixed internal scale of 1,000,000,000,000 internal units per displayed dollar ($1 = 10^12 units).
- Convert internal units to dollars only for display.
- One internal unit represents $0.000000000001.
- Keep market scores separate from money balances.
- The price calculation must use a controlled fixed-point/integer approximation or another carefully specified conversion into internal units. Do not assume that using `long` automatically makes exponentiation exact.
- Never let a positive theoretical price silently become zero due to rounding or underflow. If the calculated price falls below one internal unit, treat it as a deliberate minimum-price mechanic: charge/pay at least 1 internal unit for one item. The displayed price may therefore bottom out at $0.000000000001, but never at $0 or a negative amount.
- Guard against `long` overflow when multiplying, adding, or accumulating transaction totals. A transaction that cannot be represented safely must not corrupt balances or market state.
- With this scale, a signed `long` can store a maximum positive balance of roughly $9.22 million. Revisit the scale if the intended economy needs larger individual balances.

## Transaction Pricing And Anti-Exploit Rule

The transaction price must be calculated in a consistent order so that buying and then immediately reversing the same trade does not create money.

### Buying

1. Determine the item's price at the current market score.
2. Charge the buyer that pre-purchase price for the unit.
3. Give the item to the player.
4. Increase the market score for that unit, updating the market price for later units and transactions.

### Selling

1. Verify that the player has the item to sell.
2. Decrease the item's market score for the unit being sold.
3. Calculate the price at the post-sale market score.
4. Pay the seller that post-sale price for the unit.
5. Remove the sold item from the player's inventory as part of the same successful transaction.

### Bulk Transactions And Reversibility

- Calculate prices per unit along the score path; do not apply one final stack price to every item in a bulk transaction.
- Buying several units should charge the sequence of pre-purchase prices. Selling those same units back, with no intervening trades, should pay the reversed sequence of post-sale prices.
- If a player buys an amount and then sells the exact same amount with no other trades affecting that item in between, the market should return to its original score and the total received should equal the total paid, before any future sales tax is introduced.
- Splitting a sale into multiple smaller transactions should produce the same total as selling the same units in one transaction, provided no other market trades happen between them.
- Market updates, item transfers, and balance updates must succeed or fail together. Avoid partially completed trades if an inventory or balance check fails.
- Trades by other players between a purchase and a later sale may legitimately change the price, so not every later resale must have the same result. The goal is to prevent guaranteed profit from a perfectly reversed trade, not to forbid all market profit.

## Not Yet Designed

- Sales tax (intended to apply only to sales, after the sale proceeds are calculated).
- The final value of `R` and the score change per item.
- Whether different item types need different score-change rates.
- Display formatting for extremely small prices.
- Shop interface, commands, persistence format, and other plugin implementation details.

## Design Principle

When a technical limitation cannot be removed entirely, consider turning it into a deliberate game mechanic. In this economy, the finite precision of `long` currency can become a defined minimum positive transaction amount rather than allowing item prices to reach zero or become negative.
