# Phase 2 assumptions and implementation decisions

The supplied Ticket-02 text omits the referenced numeric tuning table and per-object palette values. Values below are implementation decisions, not claims about omitted source requirements.

## Tuning

- Retain Phase 1 values: player speed 5 m/s, lantern cost 3 motes, pickup radius 1.25 m, interaction radius 2 m, pulse cost 1, pulse radius 6 m, stun 2 s, push 2 m, pulse cooldown 1 s, 3 flames, invulnerability 1.5 s, dropped-mote ratio 50%, safe radius 4 m, shade speed 2.2 m/s, shade hit radius 1 m.
- Carry capacity is 10 to match the required 10-cell HUD.
- Night 1 lasts 300 s. Nights 2 and 3 last 360 s each, respecting the 21,600-tick headless cap.
- Dash uses 14 m/s for 12 ticks (0.2 s), as specified by Wind Charm. Ordinary cooldown is set to 1 s because the ticket omits it.
- Falling off an island costs all carried motes. Shade hits retain Phase 1's half-drop behavior.
- Shades chase when the player is within 15 m, reusing the stated Drifter activation distance because no shade radius was provided.
- Dropped motes live 10 s; the ticket requires TTL but omits its value.
- Deposit awards +10 per mote when deposited, not on pickup. Pulse awards +5 per shade hit, including shades already stunned. Win bonus is floor(seconds remaining)*2 + flames*50. A lost night contributes no score to the total.
- Initial placed motes are available at night start. A shade spawned at the end of a tick becomes active on the following tick.
- Night 3 bell tower is decorative geometry with a 2 m cylinder collision; the player starts on tier 2 outside the cylinder.
- Night 2/3 Drifter spawn points use seeded PRNG positions. Missing object palette values use a midnight-blue, amber, dark-violet and blue-gray palette.
- Intro narration is original implementation text. Audio is generated with Web Audio API; no external audio assets are used.

## Geometry convention

Map polar coordinates use x = cos(theta)*r and z = sin(theta)*r. Map formulas and exact coordinates are in src/maps.js. The release contract identifies the individual submission as Nguyen Thi Thanh Thuy (2A202603523).
