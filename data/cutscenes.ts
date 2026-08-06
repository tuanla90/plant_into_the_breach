import { BossId } from '../types';

/**
 * CUTSCENES — one painted panel, one or two lines over it, and what the moment paid out.
 *
 * A different shape from the two comic PAGES (IntroComic, OutroComic) on purpose. Those are
 * bookends: eight panels the player reads once at each end of the whole campaign, and they can
 * afford to be a page because they happen twice in a lifetime. These happen thirteen times per
 * playthrough, in the middle of a run, between a victory report and an upgrade choice. A
 * scrollable page there would be a wall in the road — so a cutscene is ONE image, full-bleed,
 * with the caption box the comics already use, and it is gone in one or two clicks.
 *
 * ART GATE, and why there is no gate in this file: every `art` below is a promise, not a fact —
 * the paintings are commissioned separately (art-src/ART-PROMPTS-CUTSCENES.md). The Cutscene
 * component probes its own image and calls `onDone` immediately if it is missing, so a scene
 * whose art has not landed yet costs the player nothing and shows nothing. That means entries
 * can be written here ahead of the artwork, which is exactly what this table is doing today.
 *
 * i18n: `kicker` and `captions` are English source strings — keys, like every comic caption
 * (i18n/vi.ts). Written here rather than in Vietnamese directly because these are campaign
 * strings; only the tutorial is authored-in-Vietnamese content.
 */
export interface CutsceneDef {
    /** Full-bleed painting, 4:3 or 16:9. Missing file = the scene silently does not happen. */
    art: string;
    /** Small label above the caption box — where this happened, and that it is over. */
    kicker: string;
    /** Story beats over the SAME image; one click each. Two is the intended length. */
    captions: string[];
}

/**
 * THE BOSS FALLS.
 *
 * Keyed by `BossId` and deliberately NOT covering all ten. Two absences are meaningful:
 *
 *   - BLIGHTLORD has none, because it already has the outro comic. The Breach's ending is
 *     eight panels; putting a single-panel cutscene in front of them would be an epilogue
 *     announcing an epilogue.
 *   - Nothing here fires inside the Breach's gauntlet. That is not enforced by this table but
 *     by the caller (App: the scene needs the boss to be the last node of its map), because the
 *     Breach re-fights all nine of these and the player has already seen every one of them.
 */
export const BOSS_CUTSCENES: Partial<Record<BossId, CutsceneDef>> = {
    // ---- STAGE I — The Green Belt -------------------------------------------------------
    GARGANTUAR: {
        art: './img/comic/cutscene-boss-clear-gargantuar.jpg',
        kicker: 'Verdant Reach — cleared',
        captions: [
            'The fist came down where the squad had been standing a second earlier.',
            'Nothing that big had ever been stopped here. Verdant Reach answered with a mouth to match it.',
        ],
    },
    CATAPULT_LORD: {
        art: './img/comic/cutscene-boss-clear-ironcart.jpg',
        kicker: 'Goldacre — cleared',
        captions: [
            'It shelled the fields from three tiles away all chapter, and never saw them get close.',
            'The siege gun changed hands at dawn. Goldacre keeps its harvest.',
        ],
    },
    CINDER_COLOSSUS: {
        art: './img/comic/cutscene-boss-clear-cinder.jpg',
        kicker: 'Kiln Row — cleared',
        captions: [
            'The colossus cooled from the feet up, and went out like a spent forge.',
            'What was still burning in the ash, they reached in and took.',
        ],
    },

    // ---- STAGE II — The Far Shore -------------------------------------------------------
    BALLOON_ARMADA: {
        art: './img/comic/cutscene-boss-clear-armada.jpg',
        kicker: 'Windward — cleared',
        captions: [
            'A wall means nothing to something that flies over it. So they stopped building walls.',
            'The Armada came down in the shallows — and the sky over Windward changed hands.',
        ],
    },
    SANDREAVER: {
        art: './img/comic/cutscene-boss-clear-sandreaver.jpg',
        kicker: 'Thornwaste — cleared',
        captions: [
            'It surfaced behind the line one last time, where nothing was facing.',
            'And walked straight into the one thing it could not tunnel around.',
        ],
    },
    YETI: {
        art: './img/comic/cutscene-boss-clear-yeti.jpg',
        kicker: 'Frostgate — cleared',
        captions: [
            'It froze everything they sent at it, until there was nothing left to send.',
            'The cold stopped being its alone.',
        ],
    },

    // ---- STAGE III — The City -----------------------------------------------------------
    DISCO_ZOMBOSS: {
        art: './img/comic/cutscene-boss-clear-headliner.jpg',
        kicker: 'Neon Rose — cleared',
        captions: [
            'It never laid a hand on anyone. It only ever turned the crowd.',
            'One sweep threw the whole crowd somewhere else at once, and the music stopped.',
        ],
    },
    CLOCKJAW: {
        art: './img/comic/cutscene-boss-clear-clockjaw.jpg',
        kicker: 'Old Quarter — cleared',
        captions: [
            'Twice a turn, every turn. Nothing in the squad killed fast enough to stop the second blow.',
            'So they stopped trying to prevent it, and stood in front of it instead.',
        ],
    },
    VOLTMAW: {
        art: './img/comic/cutscene-boss-clear-voltmaw.jpg',
        kicker: 'The Grid — cleared',
        captions: [
            'The shock jumped down the whole row at once — and found the row waiting for it.',
            'They tore the current out of it, and kept it.',
        ],
    },
};

/**
 * THE CHAPTER CLOSES.
 *
 * A stage's third act is two things at once: a boss falling, and a map of the world going
 * quiet. Those are different beats and they get different panels — the boss scene is about the
 * thing that just died and the element it gave up, and this one is about the ground behind it.
 *
 * Keyed by the stage that was FINISHED, not the one that opens. The player has just done
 * something; the scene is the receipt for it, and the next chapter is the postscript.
 */
export const STAGE_CUTSCENES: Record<1 | 2 | 3, CutsceneDef> = {
    1: {
        art: './img/comic/cutscene-stage-1-greenbelt.jpg',
        kicker: 'Chapter I — The Green Belt',
        captions: [
            'Three cities. The Green Belt is standing again, and standing on its own.',
            'Across the water, the next lights are already going out.',
        ],
    },
    2: {
        art: './img/comic/cutscene-stage-2-farshore.jpg',
        kicker: 'Chapter II — The Far Shore',
        captions: [
            'Coast, waste and ice. The far shore holds, and the road back is open.',
            'Ahead is where it started — the city that fell first.',
        ],
    },
    3: {
        art: './img/comic/cutscene-stage-3-city.jpg',
        kicker: 'Chapter III — The City',
        captions: [
            'Neon Rose, the Old Quarter, the Grid. The city belongs to the living again.',
            'And underneath it, the hole they all climbed out of is still open.',
        ],
    },
};

/**
 * THE ACT OPENS — a painting behind the existing ActIntro curtain, not a screen of its own.
 *
 * ActIntro already does this job: it names the place, its boss, and what that boss is holding.
 * What it did not have was a picture of the place, so every act announced itself over flat
 * black. This is that picture and nothing more — a background, keyed the same way the curtain
 * is (by the boss whose act is opening), and absent art simply leaves the black behind.
 */
export const ACT_INTRO_ART: Partial<Record<BossId, string>> = {
    GARGANTUAR: './img/comic/cutscene-act-verdant-reach.jpg',
    CATAPULT_LORD: './img/comic/cutscene-act-goldacre.jpg',
    CINDER_COLOSSUS: './img/comic/cutscene-act-kiln-row.jpg',
    BALLOON_ARMADA: './img/comic/cutscene-act-windward.jpg',
    SANDREAVER: './img/comic/cutscene-act-thornwaste.jpg',
    YETI: './img/comic/cutscene-act-frostgate.jpg',
    DISCO_ZOMBOSS: './img/comic/cutscene-act-neon-rose.jpg',
    CLOCKJAW: './img/comic/cutscene-act-old-quarter.jpg',
    VOLTMAW: './img/comic/cutscene-act-the-grid.jpg',
    BLIGHTLORD: './img/comic/cutscene-act-the-breach.jpg',
};
