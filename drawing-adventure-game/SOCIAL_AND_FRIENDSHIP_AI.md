# Social Play and Friendship Progression _AI

> AI-drafted documentation based on the creator's latest clarifications. Creator decisions take precedence; unresolved mechanics are labelled as such.

## Natural encounters
Players can encounter others while exploring caves. Players may appear and pass by, creating a shared-travel feeling inspired by Sky: Children of the Light but adapted to this game's 2D planet and cave systems.

## Showing a player's custom skin
Players can initiate a handshake to reveal/view another player's custom character skin. Becoming an acquaintance adds them to the **Connection Constellation** and enables the classic handshake. The romantic special greeting is also intended to let partners visibly see each other's custom skins instead of only the default presentation.

## Friendship stages and unlocks
The progression is a branching tree, but exact thresholds and Heart Point costs are not finalized.

- **Friend:** Add someone to the friends list. A cost of one shard was suggested, but remains tentative.
- **Acquaintance:** Add them to the Connection Constellation. This stage enables the classic handshake but does not automatically grant special abilities.
- **Friendship abilities:** Unlock abilities such as holding hands, guiding a friend through areas, and chatting.
- **Friendship levels:** Players can continue leveling up between unlocks. The creator says that when one player wants to purchase/upgrade a friendship-tree node, the other player must accept it too.
- **Optional romantic path:** A later side branch lets both players agree to become romantic partners. It is intentionally short rather than a giant second tree. A player can have only one romantic partner at a time, but may have many ordinary friends.

The name **Passions** is the chosen name for the social actions/emotes menu and system. See `FRIENDSHIP_ACTIONS_AI.md`.

## Heart Points
**Heart Points** is the working name for a separate currency intended for friendship-related actions and unlocks. It is distinct from shards. Players may earn Heart Points by helping others, including healing them and performing other beneficial actions. Exact qualifying actions and reward amounts are not finalized.

Heart Points were proposed as the currency for later Passions gestures, but that is not confirmed. The earlier idea of exchanging shard pieces as a daily friendship gift is no longer the preferred direction. The replacement gift mechanic is undecided.

## Gifts
Direct gifts require the recipient's acceptance. The kind of gift, currency or item used, and handling of declined or unclaimed gifts remain undecided.

## Passions menu and partner greetings
Players can choose their special greeting in settings. When they encounter their romantic partner, they approach and initiate the selected greeting. The Passions menu contains available gestures. When one player initiates a paired gesture, the other player must approach and press the confirmation button to perform it together. This is the confirmation mechanism; the creator clarified that a separate decline action is not needed. No special limit on repeated requests has been specified.

Players can choose a gesture and a short flourish for their greeting. The exact menu layout and controls remain undecided. The special greeting unlocks immediately when both players accept the romantic-partner branch.

Proposed/selected gesture progression:
1. **Special bow:** available immediately when the romantic path unlocks.
2. **Hand-to-heart:** a later gesture unlock.
3. **Hug:** a later gesture unlock.
4. **Kiss:** a later gesture unlock after the earlier gestures.

The order is established, but exact costs and friendship levels are not. Whether each gesture requires a separate purchase with Heart Points remains undecided.

## Gesture animation direction
The current visual concepts are:
- **Special bow:** distinct pose, no extra particles.
- **Hand-to-heart:** a hand-drawn heart pulses once.
- **Hug:** a few ink droplets orbit both characters once; droplets use the colors equipped by the players.
- **Kiss:** a heart-shaped ink mark appears at their lips, floats upward, and fades away.

Gesture effects blend the two players' equipped ink colors and are visible to nearby players. Effect prominence should increase with friendship level, but the amount and scaling are undecided.

Character outfits attach to head, arms, legs, and torso, so the intention is to animate those body parts and have the outfits follow normally. Hugs and kisses require the players to stand close together. Gestures should not start if there is insufficient room near walls or other players.

Gesture durations depend on the gesture: a bow may last around one second and a kiss around four seconds. These are estimates, not fixed timings. For gestures that support cancellation, walking away cancels the interaction. Which gestures are cancellable and the exact cancellation timing remain undecided. A special animation/response is intended if a player disconnects mid-gesture, but its behavior is not finalized.

## Ending a romantic partnership
Either partner can end the partnership after a confirmation prompt. The one-partner limit applies to romantic partners, not ordinary friends. After a breakup, romantic gesture icons and friendship-tree upgrades remain visible but are greyed out and cannot be used with the former partner. Whether a player can immediately form a new romantic partnership remains undecided.

## Proximity effect for close friends
When two players are near each other and their friendship has reached the point where the romantic-partner option becomes available, a proximity effect can occur even if they have not chosen to become romantic partners. The creator described both players' “house” gradually restoring and a heart icon appearing on their chests and beating while they are near each other. **Confirm whether “house” meant health** before this is treated as finalized. The effect is not intended to grant an Inkoff advantage.

## Inkoff and social progression
Romantic status does not affect Inkoff or grant combat advantages. The proximity effect described above is likewise not an Inkoff advantage. The earlier idea that slashing a teammate transfers ink has been rejected. Healing or other beneficial actions may earn Heart Points, but teammate slashes do not transfer ink.

## Open questions
- Is Heart Points the final currency name?
- Which helpful actions award Heart Points, and how much?
- What are the final costs and friendship thresholds?
- Does every gesture require a Heart Point purchase, or are some unlocked only by friendship progression?
- What exactly happens if a player disconnects during a gesture?
- Which gestures can be cancelled by walking away, and at what point?
- Does “house” mean health in the proximity-restoration effect, and what are its exact rules?
- What form should friend-to-friend gifts take if shard pieces are not used?
- What are the exact Passions menu controls and layout?
- How do friendships and gesture interactions persist across server transitions?
