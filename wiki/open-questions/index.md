# Open questions

* [Terms for using deadlock-api hero images as story art](m2-hero-art-terms.md) - Whether the hero images served by deadlock-api assets may be shown on the site, which gates replacing the M2 monogram tiles with real hero art.
* [Unit of avgUnspentGoldMinutes for the unspent-souls roast](m2-unspent-souls-unit.md) - What the Unspent Gold Minutes stat measures (souls times minutes or minutes), which decides how the roast slide can phrase it.

# Resolved (kept for reference)

* [Which model should the reviewer agent use?](reviewer-model.md) - Resolved by ADR 0057: the reviewer runs on Sonnet at high effort, with Opus only for xhigh work (auth, data integrity, migrations, security).
* [M1 implementation choices](m1-implementation-choices.md) - The libraries, schema and tuning values chosen while building M1; confirmed by ADR 0040.
* [Source of the current patch date for the this-patch toggle](patch-date-source.md) - Findings on /v1/patches title dates versus pub_date; resolved by ADR 0035.
* [Monetization and open source](monetization.md) - Research on how peer sites fund themselves; resolved by ADR 0016, kept as reference.
* [How players unlock full match history](full-history-unlock.md) - Findings on bot-friend, the Patreon tier and the ingest tool; dev approach decided in ADR 0017; outreach deferred.
* [Rank tier names for the rank journey slide](m2-rank-tier-names.md) - Whether the static tier-name map (badge tier 1 to 11 to names such as Oracle) matches the game, so the rank slide shows real names rather than the fallback.
* [Font pairing for the M2 story](m2-font-pairing.md) - Which open-licence deco display face and grotesk to pair via next/font for the art-deco occult look.
