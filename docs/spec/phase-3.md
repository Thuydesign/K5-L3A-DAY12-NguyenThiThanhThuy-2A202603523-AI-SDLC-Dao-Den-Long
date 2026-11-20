# Phase 3 specification - Ticket-03, Contract v1.2

| Requirement | Verification |
|---|---|
| Integer-sixtieth fuel, 1/s decay, 10 fuel per mote, relight and refuel selection | src/test-contract.js fuel/refuel/relight checks |
| Safe zone boundary at 30, wandering shade targets/draining, drain events, stun bonus and push protection | src/test-contract.js shade and threshold checks |
| Dawn-only win at ceil(60%), exact reasons and no_flames priority | src/test-contract.js dawn boundary checks |
| Dynamic capacity 10+2 per successful light, capped 20 | src/test-contract.js capacity check |
| v1.2 scenario and snapshot fields, deterministic headless output | npm test and npm run build |
| Color-blind palette, torn/extinguished visual language, low-fuel blink | browser verification to be recorded under Phase 4 |
