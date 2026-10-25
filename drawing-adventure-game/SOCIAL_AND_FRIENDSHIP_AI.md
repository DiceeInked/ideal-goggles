# Social Play and Friendship Progression _AI

> AI-drafted overview of social progression. Detailed Passions gestures and paired-action behavior live in [FRIENDSHIP_ACTIONS_AI.md](FRIENDSHIP_ACTIONS_AI.md). Creator decisions take precedence over unresolved implementation details.

## Natural encounters
Players can encounter and pass one another while exploring caves. The aim is a shared-travel feeling inspired by Sky: Children of the Light, adapted to a 2D planet and cave system rather than copied directly.

## Showing a player's custom skin
A player can initiate a handshake to reveal or view another player's custom character skin. Becoming an acquaintance adds the player to the **Connection Constellation** and enables the classic handshake. The romantic special greeting is also intended to let partners see each other's custom skins rather than only the default presentation.

## Friendship progression
Friendship uses a branching tree, but exact thresholds and costs are not finalized.

- **Friend:** Add someone to the friends list. A cost of one shard was suggested but remains tentative.
- **Acquaintance:** Add them to the Connection Constellation. This stage enables the classic handshake but does not automatically grant all special abilities.
- **Friendship abilities:** Potential unlocks include holding hands, guiding a friend through areas, chatting, piggybacking, custom greetings, and other social actions.
- **Shared upgrades:** When one player wants to purchase or unlock a friendship-tree node, the other player must also accept before that upgrade takes effect.
- **Optional romantic path:** A short side branch lets both players agree to become romantic partners. It is optional, not a giant second tree. Each player can have only one romantic partner at a time while still keeping many ordinary friends.

The one-partner limit and mutual acceptance are established design rules. The exact re-partnering timing after a breakup is undecided.

## Passions
**Passions** is the chosen name for the social-action/emote menu and system. It includes the gestures available to a player and supports paired actions, greetings, and flourishes. The second player confirms a paired action by approaching and pressing the relevant button; no separate decline pop-up has been specified. See [Passions gesture details](FRIENDSHIP_ACTIONS_AI.md) for the animation concepts, positioning, cancellation, and disconnect questions.

Both players must accept the romantic-partner proposal/upgrade. Becoming partners immediately unlocks the ability to choose a special greeting. Either partner can end the relationship after a confirmation prompt. After a breakup, relevant gesture icons and friendship-tree upgrades remain visible but greyed out and cannot be used with that former partner.

## Heart Points and gifts
**Heart Points** is a working name for a separate currency intended for friendship-related actions and unlocks. It is distinct from shards. Helping other players, including healing them or performing other beneficial actions, has been suggested as a way to earn it, but qualifying actions and reward amounts are not finalized.

Heart Points were proposed for later Passions gestures, but this is not confirmed. The older idea of sending shard pieces as a daily friendship gift is no longer the preferred plan. Direct gifts require the recipient's acceptance; the replacement gift mechanic remains undecided.

## Proximity health effect
Once two players' friendship has progressed far enough for the romantic-partner option to become available, both players' health gradually restores while they are near one another, even if they have not become romantic partners. A heart icon appears on their chests and beats while they are nearby. The restoration rate, proximity range, and detailed rules remain undecided.

Romantic-partner status itself is not meant to affect Inkoff. **It is still undecided whether this close-friend health-regeneration effect is disabled in Inkoff or can operate there without being tied to romantic status.** It must not be silently treated as a confirmed competitive advantage.

## Open questions
- Is Heart Points the final currency name, and which actions award it?
- What are the final friendship thresholds, costs, and rules for each unlock?
- Are later gestures purchased with Heart Points, unlocked through progression, or both?
- What are the exact health-restoration rate and proximity range?
- Does proximity-based health regeneration operate during Inkoff?
- What happens if a player disconnects during a gesture, and which gestures can be cancelled by walking away?
- What kind of friend-to-friend gift replaces shard pieces?
- What are the exact Passions menu controls, and how do social actions persist across server transitions?
