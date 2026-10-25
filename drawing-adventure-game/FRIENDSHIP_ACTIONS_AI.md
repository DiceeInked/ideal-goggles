# Passions _AI

> AI-drafted reference for social actions and emotes. Creator decisions take precedence. Costs and thresholds not finalized.

## Name and purpose
**Passions** is the chosen name for the game's social-action/emote menu and system.

## Heart Points
**Heart Points** is the working name for a separate currency used for friendship-related actions and unlocks. Players may earn it by helping others, including healing them or performing other beneficial actions. Exact rewards and qualifying actions are undecided. Heart Points are separate from shards.

The earlier idea of sending shard pieces as a daily friendship gift is no longer the preferred plan. The replacement gift mechanic remains undecided. Direct gifts require the recipient's acceptance.

## General friendship actions
Potential actions and abilities include handshake (which can reveal another player's custom character skin), holding hands, guiding a friend through areas, chatting, piggybacking, custom greetings, and other emotes. These can unlock through the ordinary friendship tree.

## The Passions menu and partner greetings
Players can select which special greeting they want to use in settings. When they encounter their romantic partner, they approach and initiate the selected greeting. This is intended to let the players visibly see each other's custom character skins rather than seeing only the default presentation.

The **Passions menu** contains the available gestures. When one player initiates a paired gesture, the other player must approach and press the confirmation button to perform it with them. This is not a decline/accept pop-up: the second player's action of approaching and pressing the button is the confirmation. No separate decline mechanic has been specified. Repeated requests have no special limit specified.

Players can customize their greeting by choosing a gesture and a short flourish. The precise menu layout and controls are not finalized.

## Romantic-partner path
The romantic-partner option is an optional side branch of the friendship tree, not a long parallel tree. Both players must accept a friendship-tree upgrade or proposal before it takes effect. A player can have only one romantic partner at a time, while still having many ordinary friends.

Unlocking the romantic partnership immediately unlocks the ability to choose a special greeting. The gesture progression is:
1. **Special bow:** available immediately when the romantic-partner path unlocks.
2. **Hand-to-heart:** a later gesture unlock.
3. **Hug:** a later gesture unlock.
4. **Kiss:** a later gesture unlock after the earlier gestures.

The intended order is specified, but exact friendship thresholds, Heart Point costs, and whether each gesture is purchased or otherwise unlocked remain undecided. Later gestures were previously proposed to use Heart Points, but this is not yet confirmed.

## Gesture animation direction
These are the current visual concepts discussed for the four romantic gestures. Fine timing and implementation details remain flexible and should not be mistaken for finalized animation specifications.

- **Special bow:** a distinct bowing pose, with no extra particles.
- **Hand-to-heart:** the character places a hand over their chest; a hand-drawn heart pulses once.
- **Hug:** both characters move into an embrace. A few ink droplets orbit them once, using the colors equipped by the two players.
- **Kiss:** the characters lean together; a heart-shaped ink mark appears at their lips, then floats upward and fades away.

The visual effects should use a blend of both players' equipped ink colors. Everyone nearby can see the gesture effects. Effect prominence is intended to increase with friendship level, though the exact scaling is undecided.

Characters are assembled from head, arms, legs, and torso parts, and outfits are attached to those body parts. The intention is to animate the body parts normally so outfits follow their corresponding parts. Gestures should not start when there is insufficient room near walls or other players. Paired gestures such as hugs and kisses require the characters to be standing close together first.

The duration depends on the gesture: the bow may last around one second, while the kiss may last around four seconds. These are estimates, not final timings. During gestures where cancellation is supported, walking away cancels the interaction; the exact cancellation behavior for each gesture remains to be specified. A special animation/response is intended if one player disconnects during a gesture, but the exact behavior is not finalized.

## Ending a romantic partnership
Either partner can end the partnership after a confirmation prompt. The romantic-partner limit is one partner at a time; the player can still have multiple ordinary friends.

After a breakup, the relevant gesture icons and friendship-tree upgrades remain visible but are greyed out and cannot be used with the former partner. Whether and how a player can immediately form a new partnership is not finalized.

## Proximity effect for close friends
When two players are near each other and their friendship has progressed far enough that the romantic-partner option is available, a proximity effect can occur even if they have not chosen to become romantic partners. The creator described both players' “house” gradually restoring and a heart icon appearing on their chests and beating while they are near each other. **Confirm whether “house” meant health**, and clarify how the restoration works, before treating this as a finalized mechanic. This proximity effect is not an Inkoff advantage.

## Consent and safety of interactions
The second player confirms a paired gesture by approaching and pressing the relevant button. The creator clarified that the player does not separately decline a queued gesture; choosing not to approach and confirm means the paired gesture does not play. Exact controls and any additional privacy settings remain undecided.

## Open questions
- Is Heart Points the final currency name?
- Which helpful actions award Heart Points, and how many?
- What are the final costs and friendship thresholds for each Passions action?
- Are later gestures purchased with Heart Points, unlocked by levels, or both?
- What exactly happens if a player disconnects during a gesture?
- Which gestures can be cancelled by walking away, and at what point?
- What does “house” mean in the described proximity-restoration effect, and what are its exact rules?
- What replaces the proposed shard-piece gift mechanic?
- What are the exact menu layout and controls?
- How do gestures behave across server transitions?
