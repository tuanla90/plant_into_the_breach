
import React, { useState } from 'react';
import {
    ArrowLeft, Move, Shield, Sun, Coins, Zap, AlertTriangle, CornerDownRight, Crosshair,
    ChevronsRight, Brain, FlaskConical, Sprout, Package, BookOpen, Users, X, Star,
    Atom, Snowflake, Flame,
} from 'lucide-react';
import { ElementId, UnlockState } from '../types';
import { SQUAD_SIZE } from '../constants';
import { ELEMENTS, ELEMENT_DEFINITIONS, ELEMENT_HP_COST, RESONANCE_DESCRIPTIONS } from '../utils/elements';
import { HeroGrid, RecipeMatrix, codexCounts } from './CodexScreen';
import { levelOf, levelCapFor } from '../data/unlocks';
import { STARTING_MATERIALS } from '../data/materials';
import { useI18n } from '../i18n';

/** The three books this screen absorbed. */
type Section = 'MANUAL' | 'HEROES' | 'FUSIONS';

interface TutorialScreenProps {
    onBack: () => void;
    /**
     * Player progress. Without it only the manual is shown — the roster and the fusion matrix
     * are statements about what THIS save owns, and a codex that cannot say "you have this"
     * is just a spoiler list.
     */
    unlocks?: UnlockState;
    /** Which book to open on. The map's button wants the matrix; the menu wants the manual. */
    initialSection?: Section;
    /** Float above the running game instead of replacing the screen (opened mid-run). */
    overlay?: boolean;
}

/**
 * The manual. Everything on this screen is a claim about the rules, so it is only worth
 * having if it matches them — the previous version still described a Sun economy that buys
 * items and stat upgrades, which stopped being true when Sun became a per-battle resource
 * spent on hero skills alone and Coin took over everything between battles.
 *
 * It was also built at roughly twice the size it needed: 56px demo tiles, text-4xl headings
 * and text-xl body copy meant two sentences filled a screen. Sizes here are deliberately
 * small — a reference is read, not presented.
 */

// --- VISUAL HELPERS ---
const MiniBoard = ({ children, cols = 3 }: { children?: React.ReactNode, cols?: number }) => (
    <div
        className="grid gap-1.5 bg-[#111] p-1.5 border border-[#333] w-fit mx-auto my-3"
        style={{ gridTemplateColumns: `repeat(${cols}, 38px)`, gridTemplateRows: '38px' }}
    >
        {children}
    </div>
);

const MiniTile = ({ type = 'EMPTY', content, highlight }: { type?: 'EMPTY' | 'LAVA' | 'WATER', content?: React.ReactNode, highlight?: boolean }) => {
    let bg = 'bg-[#1a1c21]';
    if (type === 'LAVA') bg = 'bg-red-900/50';
    if (type === 'WATER') bg = 'bg-blue-900/50';
    return (
        <div className={`w-[38px] h-[38px] ${bg} border ${highlight ? 'border-yellow-400 bg-yellow-900/20' : 'border-gray-700'} flex items-center justify-center relative`}>
            {content}
        </div>
    );
};

const UnitIcon = ({ color, char }: { color: string, char: string }) => (
    <div className={`w-6 h-6 ${color} rounded-sm flex items-center justify-center font-bold text-black text-xs z-10 border border-black/20`}>{char}</div>
);

/** Coloured callout. `tone` only picks the accent, so every box on the screen matches. */
const Note: React.FC<{ tone: 'green' | 'red' | 'amber' | 'blue' | 'purple'; title: string; children: React.ReactNode }> = ({ tone, title, children }) => {
    const accents: Record<string, string> = {
        green: 'border-green-500 text-green-400',
        red: 'border-red-500 text-red-400',
        amber: 'border-amber-500 text-amber-400',
        blue: 'border-sky-500 text-sky-400',
        purple: 'border-purple-500 text-purple-400',
    };
    const [border, text] = accents[tone].split(' ');
    return (
        <div className={`bg-[#15171c] border-l-2 ${border} pl-3 py-2 pr-2`}>
            <strong className={`${text} block mb-1 text-[11px] uppercase tracking-widest`}>{title}</strong>
            <div className="text-gray-300 text-[13px] leading-5">{children}</div>
        </div>
    );
};

/** Bulleted fact list — the shape most of this manual wants. */
const Facts: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
    <ul className="space-y-1.5">
        {items.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] leading-5 text-gray-300">
                <span className="text-gray-600 mt-[3px] shrink-0">▸</span>
                <span>{line}</span>
            </li>
        ))}
    </ul>
);

// --- TOPIC CONTENT ---

const BasicsContent: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">
                {t('Each unit gets one move and one action per turn.')}
            </p>
            <Note tone="red" title={t('Order matters')}>
                {t('Attacking ENDS that unit\'s turn. Move first and then attack — never the other way round.')}
            </Note>
            <Note tone="green" title={t('Basic attacks are free')}>
                {t('Every hero\'s basic attack costs no Sun, so a hero is never left with nothing to do.')}
            </Note>
            <div className="text-center">
                <MiniBoard>
                    <MiniTile content={<UnitIcon color="bg-green-500" char="P" />} />
                    <MiniTile highlight content={<div className="w-2 h-2 bg-sky-400 rounded-full" />} />
                    <MiniTile />
                </MiniBoard>
                <p className="text-[11px] text-gray-500">{t('Select unit → click a highlighted tile to move')}</p>
            </div>
        </div>
    );
};

const IntentContent: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">{t('Nothing the zombies do is a surprise. Every attack is announced a full turn before it lands.')}</p>
            <Facts items={[
                <>{t('Red stripes mark every tile that will be hit next turn. The number on them is the damage.')}</>,
                <>{t('A dashed amber trail is where a zombie intends to WALK. A route is not a hit.')}</>,
                <>{t('Step out of a marked tile and the attack lands on empty ground.')}</>,
                <>{t('Reading the board beats out-damaging it. That is the whole game.')}</>,
            ]} />
            <div className="text-center">
                <MiniBoard>
                    <MiniTile content={<UnitIcon color="bg-gray-400" char="Z" />} />
                    <MiniTile highlight content={<Crosshair size={18} className="text-red-500" />} />
                    <MiniTile content={<UnitIcon color="bg-green-500" char="P" />} />
                </MiniBoard>
                <p className="text-[11px] text-gray-500">{t('The zombie will hit the middle tile. Nobody is standing there.')}</p>
            </div>
        </div>
    );
};

const PushContent: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">
                {t('Many skills push the target one tile back.')}
            </p>
            <Note tone="amber" title={t('Collision')}>
                {t('Shoved into a unit, a mountain or the edge of the map, BOTH take 1 damage.')}
            </Note>
            <Note tone="green" title={t('Ground is worth more than damage')}>
                {t('A zombie pushed back is a zombie that does not reach a house this turn. Buying a turn often beats dealing 2.')}
            </Note>
            <div className="text-center">
                <MiniBoard>
                    <MiniTile content={<UnitIcon color="bg-green-500" char="P" />} />
                    <MiniTile />
                    <MiniTile content={<div className="relative"><UnitIcon color="bg-gray-400" char="Z" /><span className="absolute -top-2 -right-2 text-xs">💥</span></div>} />
                </MiniBoard>
                <p className="text-[11px] text-gray-500">{t('Pushing a zombie into another hurts both.')}</p>
            </div>
        </div>
    );
};

const BrainContent: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">{t('Brains are what the run is actually made of. Each house on the board holds one.')}</p>
            <Facts items={[
                <>{t('A zombie that reaches a house eats its brain. Lose EVERY brain on one board and the run ends there.')}</>,
                <>{t('The budget is 5 brains for the WHOLE run, not per battle. A campfire can buy one back with Coin, and the price climbs each time.')}</>,
                <>{t('Most missions are won by surviving to the end of the turn counter. Some ask for something else — protect one marked house, clear the board, hold a tile. The objective panel always says which.')}</>,
                <>{t('Bonus objectives are optional and pay extra Coin. They ask you to take a risk you are allowed to refuse.')}</>,
            ]} />
            <Note tone="red" title={t('A fallen hero is not a dead hero')}>
                {t('At 0 HP a hero is knocked out for the rest of the run. Revive them at a campfire for Coin, or free at the end of a chapter.')}
            </Note>
            <Note tone="amber" title={t('Damage carries')}>
                {t('Hero HP now persists between battles. A hero who limps out of one fight starts the next one hurt — healing is a real purchase.')}
            </Note>
        </div>
    );
};

const EconomyContent: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">{t('Two currencies that never touch each other. Mixing them up is the most common mistake.')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-[#15171c] border border-yellow-700/40 p-3">
                    <strong className="text-yellow-400 flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-widest">
                        <Sun size={14} /> {t('Sun — inside one battle')}
                    </strong>
                    <Facts items={[
                        <>{t('Every fight starts at 50 and pays 25 at the end of each turn.')}</>,
                        <>{t('It resets when the battle does. Nothing carries out.')}</>,
                        <><strong className="text-white">{t('It buys exactly one thing: hero skills.')}</strong></>,
                        <>{t('Sunspot\'s Harvest adds 25 more, but spends her whole action.')}</>,
                        <>{t('Kills pay nothing. Some fusions add income.')}</>,
                    ]} />
                </div>
                <div className="bg-[#15171c] border border-amber-700/40 p-3">
                    <strong className="text-amber-400 flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-widest">
                        <Coins size={14} /> {t('Coin — between battles')}
                    </strong>
                    <Facts items={[
                        <>{t('Earned by clearing nodes, bonus objectives and events. Carries across the whole run.')}</>,
                        <>{t('Shop: base plants for the bench, and combat items.')}</>,
                        <>{t('Campfire: reviving a fallen hero.')}</>,
                        <>{t('Buying a lost brain back.')}</>,
                    ]} />
                </div>
            </div>
            <Note tone="red" title={t('Sun does NOT buy')}>
                {t('Items, plants, revives or brains. Those are all Coin, and they are all spent on the map — never on the battlefield.')}
            </Note>
        </div>
    );
};

/**
 * The one mechanic the game charges for before it explains: the player meets elements as four
 * chips at squad select, pays MAX health for one, and until this page existed was never told a
 * single rule. LIGHTNING in particular is unguessable from the word — nothing about "Lightning"
 * says "half the HERO's damage stat, rounded down, no floor".
 *
 * Same icons as the picker (ElementBadge / SquadSelectScreen) and the same accents, because a
 * player arrives here holding the memory of that screen; a second visual language for one
 * system would read as a second system.
 */
const ELEMENT_TOPIC_ICONS: Record<ElementId, React.ComponentType<{ size?: number }>> = {
    ICE: Snowflake,
    FIRE: Flame,
    LIGHTNING: Zap,
};

/**
 * The status each rule leaves behind, in the terms the board shows it. Kept beside the card
 * rather than folded into ELEMENT_DEFINITIONS.description: that string is the one-line answer
 * the picker and the badge tooltip need, and this is the footnote only a manual has room for.
 */
const ELEMENT_FOOTNOTES: Record<ElementId, string> = {
    ICE: 'A slowed enemy covers half its usual ground on its next turn.',
    FIRE: 'A burning enemy takes 1 damage before it acts.',
    LIGHTNING: 'Half the HERO\'s damage stat — never the number written on the skill.',
};

const ElementContent: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">
                {t('An element is not a second kit. It is one rule laid over everything a hero already does. Pick one per hero at squad select — it is locked in for the whole run.')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ELEMENTS.map(id => {
                    const def = ELEMENT_DEFINITIONS[id];
                    const Icon = ELEMENT_TOPIC_ICONS[id];
                    return (
                        <div key={id} className="bg-[#15171c] border p-3" style={{ borderColor: `${def.accent}66` }}>
                            <strong
                                className="flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-widest"
                                style={{ color: def.accent }}
                            >
                                <Icon size={14} /> {t(def.name)}
                            </strong>
                            {/* Straight from ELEMENT_DEFINITIONS, so the manual cannot drift
                                away from what the picker promised two screens ago. */}
                            <p className="text-[13px] leading-5 text-gray-300">{t(def.description)}</p>
                            <p className="text-[11px] leading-4 text-gray-500 mt-1.5">{t(ELEMENT_FOOTNOTES[id])}</p>
                        </div>
                    );
                })}
            </div>
            {/* The figure is READ from ELEMENT_HP_COST. It has already moved once (1 -> 2, when
                hero health doubled) and the screen that hardcoded it ended up showing a "-2"
                badge above the words "-1 max HP". A manual that misquotes the bill is worse
                than no manual. */}
            <Note tone="red" title={t('The price')}>
                {t('Carrying an element costs {n} MAX health, and hero health persists between battles — so it is a bill you keep paying. Base form is free.', { n: ELEMENT_HP_COST })}
            </Note>
            <Facts items={[
                <><strong className="text-white">{t('It rides the ATTACK, not the damage.')}</strong> {t('A hero who deals 0 still carries one: Chardwall\'s shove throws its target AND slows it.')}</>,
                <>{t('Lightning arcs ONCE, from the main target only, to one enemy beside it — for half the hero\'s damage stat, rounded down, with no minimum. A hero on 0 or 1 damage arcs for the effect alone.')}</>,
                <>{t('A hero whose free attack cannot reach an enemy carries the element on her paid skill instead. Sunspot\'s basic action is +25 Sun, so hers rides Sun Burn.')}</>,
                <>{t('It applies to EVERY source of damage that hero has — retaliation included.')}</>,
            ]} />
            <Note tone="blue" title={t('It changes most where damage was never the point')}>
                {t('Thornhide + Ice taunts the horde onto himself and everything that bites him walks away slowed. Chardwall + Lightning is one swing that throws two bodies.')}
            </Note>

            {/* RESONANCE. It lives at the bottom of THIS page rather than in a topic of its
                own because it is not a second system — it is what the three rules above do
                when a player stops hedging. Both figures are computed from SQUAD_SIZE and
                ELEMENT_HP_COST for the reason the price note gives: the per-hero cost has
                moved once already, and a total typed out by hand would have survived it. */}
            <Note tone="amber" title={t('Resonance — all {n} heroes on one element', { n: SQUAD_SIZE })}>
                {t('Commit the whole squad to a single element and it opens a fourth rule, one a mixed squad cannot reach at all. The bill is the same {n} per hero as always, so {total} max health across the squad — and it is read from the squad you picked, never from who is still standing, so it can never switch on because a hero fell.', { n: ELEMENT_HP_COST, total: SQUAD_SIZE * ELEMENT_HP_COST })}
            </Note>
            {/* Same three-column shape as the element cards above, deliberately: this is the
                same three elements answering a second question, not a new kind of thing. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {ELEMENTS.map(id => {
                    const def = ELEMENT_DEFINITIONS[id];
                    const Icon = ELEMENT_TOPIC_ICONS[id];
                    return (
                        <div key={id} className="bg-[#15171c] border p-3" style={{ borderColor: `${def.accent}66` }}>
                            <strong
                                className="flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-widest"
                                style={{ color: def.accent }}
                            >
                                <Icon size={14} /> {t('{element} resonance', { element: t(def.name) })}
                            </strong>
                            {/* Straight from RESONANCE_DESCRIPTIONS, so the manual and the
                                squad-select banner quote one source and cannot disagree. */}
                            <p className="text-[13px] leading-5 text-gray-300">{t(RESONANCE_DESCRIPTIONS[id])}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const FusionContent: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">{t('Fusion is how a squad actually grows. You are not buying a number — you are buying a trait.')}</p>
            <Facts items={[
                <>{t('At a campfire, graft one bench plant into one hero. It is permanent and the plant is consumed.')}</>,
                <><strong className="text-white">{t('The effect comes from the PAIR, not the plant.')}</strong> {t('A Peashooter makes Shadeleaf fire twice, but hands Sunspot the ranged shot she never had.')}</>,
                <>{t('Two slots per hero. The same plant never stacks into the same hero twice.')}</>,
                <>{t('The graft heals that hero to full.')}</>,
                <>{t('You must know the recipe. Each hero starts knowing the plant it grew from; the rest open one per commander level.')}</>,
                <>{t('Grafting needs intact tissue — a seedling worn down by deployments cannot be fused until it has been healed.')}</>,
            ]} />
            <Note tone="purple" title={t('One visit, one choice')}>
                {t('A campfire gives you a single decision. Fusing spends it — you cannot also sleep, revive or search the packs.')}
            </Note>
        </div>
    );
};

const BenchContent: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">{t('The shop sells base plants. Up to two of them wait on the bench.')}</p>
            <Note tone="blue" title={t('Two uses, and you only get one')}>
                {t('A benched plant is either insurance or fusion material. Choosing one spends the other.')}
            </Note>
            <Facts items={[
                <><strong className="text-white">{t('Insurance:')}</strong> {t('when a hero is knocked out, a bench plant can fill the empty squad slot for the next battle. It blocks zombies and fights — but it has no hero skill and takes no fusions.')}</>,
                <><strong className="text-white">{t('Wear:')}</strong> {t('every battle a seedling is sent into costs it 1 permanent HP. It never drops below 1 — only dying on the field removes it from the bench.')}</>,
                <>{t('That wear is the clock on the decision: a plant carried as insurance too long is no longer intact enough to graft.')}</>,
                <>{t('Sleeping at a campfire heals the bench as well as the squad, which rewinds the clock.')}</>,
            ]} />
        </div>
    );
};

const ItemContent: React.FC = () => {
    const { t } = useI18n();
    const items: Array<[string, string, string]> = [
        ['Potato Mine', '25', 'Armed on an empty tile. The first zombie to step there takes 5.'],
        ['Snow Pea', '40', 'Freezes a 3x3. Frozen units lose their turn until something hits them.'],
        ['Jalapeno', '50', 'Burns a whole row for 5 and turns it to lava.'],
        ['Blover', '60', 'A gust across the board: fliers are blown away, everything else is shoved a tile back.'],
        ['Cherry Bomb', '75', '6 damage in a 3x3, and survivors catch fire.'],
        ['Coffee Bean', '100', 'One hero that has already acted may move and act again this turn.'],
    ];
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">{t('Bought with Coin at the shop, carried into battle, one use each.')}</p>
            <Note tone="green" title={t('An item is not an action')}>
                {t('Using one does not spend a hero\'s move or attack. The cost was paid at the shop.')}
            </Note>
            <div className="border border-[#2a2f38] divide-y divide-[#2a2f38]">
                {items.map(([name, cost, desc]) => (
                    <div key={name} className="flex items-start gap-3 px-3 py-2 bg-[#15171c]">
                        <span className="text-white text-[12px] w-[92px] shrink-0">{t(name)}</span>
                        <span className="text-amber-400 text-[12px] w-9 shrink-0 text-right">{cost}</span>
                        <span className="text-gray-400 text-[12px] leading-5">{t(desc)}</span>
                    </div>
                ))}
            </div>
            <Note tone="red" title={t('Blast items do not pick sides')}>
                {t('Cherry Bomb, Jalapeno and Snow Pea hit whatever is standing on the tile — your own plants included.')}
            </Note>
        </div>
    );
};

const FriendlyFireContent: React.FC = () => {
    const { t } = useI18n();
    return (
        <div className="space-y-3">
            <p className="text-[13px] leading-5 text-gray-300">{t('The board does not care whose side a unit is on.')}</p>
            <Facts items={[
                <>{t('Pushing a zombie into your own plant hurts the plant too.')}</>,
                <>{t('Shoving a plant into lava, or into water it cannot swim, kills it outright.')}</>,
                <>{t('Blast items damage everything inside the blast.')}</>,
                <>{t('A plant standing in fire burns like anything else.')}</>,
            ]} />
            <div className="text-center bg-black/30 border border-gray-800 py-3">
                <p className="text-gray-500 uppercase text-[11px] tracking-[0.2em] italic">{t('"The lawn does not discriminate."')}</p>
            </div>
        </div>
    );
};

// --- TOPIC DATA ---
type TopicId = 'BASICS' | 'INTENT' | 'PUSH' | 'BRAINS' | 'ECONOMY' | 'ELEMENTS' | 'FUSION' | 'BENCH' | 'ITEMS' | 'FRIENDLY_FIRE';

interface Topic {
    id: TopicId;
    title: string;
    icon: React.ReactNode;
    desc: string;
    content: React.ReactNode;
}

const TUTORIAL_TOPICS: Topic[] = [
    { id: 'BASICS', title: 'Movement & Attack', icon: <Move className="text-sky-400" />, desc: 'One move, one action, and the order you spend them in.', content: <BasicsContent /> },
    { id: 'INTENT', title: 'Enemy Intent', icon: <AlertTriangle className="text-red-400" />, desc: 'Every attack is announced a turn before it lands.', content: <IntentContent /> },
    { id: 'PUSH', title: 'Push & Collision', icon: <ChevronsRight className="text-orange-400" />, desc: 'Taking ground away is often worth more than damage.', content: <PushContent /> },
    { id: 'BRAINS', title: 'Brains & Defeat', icon: <Brain className="text-fuchsia-400" />, desc: 'What you are defending, and what happens when you lose it.', content: <BrainContent /> },
    { id: 'ECONOMY', title: 'Sun & Coin', icon: <Sun className="text-yellow-400" />, desc: 'Two currencies that never touch each other.', content: <EconomyContent /> },
    // Ahead of FUSION because it is decided first — the element is picked before the run
    // starts, the graft happens at a campfire inside it.
    { id: 'ELEMENTS', title: 'Elements', icon: <Atom className="text-cyan-400" />, desc: 'One rule laid over a whole hero, paid for in max health.', content: <ElementContent /> },
    { id: 'FUSION', title: 'Fusion', icon: <FlaskConical className="text-purple-400" />, desc: 'Grafting a plant into a hero. The main way a squad grows.', content: <FusionContent /> },
    { id: 'BENCH', title: 'The Bench', icon: <Sprout className="text-green-400" />, desc: 'Backup plants: insurance, or fusion material. Not both.', content: <BenchContent /> },
    { id: 'ITEMS', title: 'Combat Items', icon: <Package className="text-amber-400" />, desc: 'One-use tools bought with Coin.', content: <ItemContent /> },
    { id: 'FRIENDLY_FIRE', title: 'Friendly Fire', icon: <Zap className="text-rose-400" />, desc: 'Watch where you aim.', content: <FriendlyFireContent /> },
];

export const TutorialScreen: React.FC<TutorialScreenProps> = ({
    onBack, unlocks, initialSection = 'MANUAL', overlay = false,
}) => {
    const { t } = useI18n();
    const [selectedTopicId, setSelectedTopicId] = useState<TopicId | null>(null);
    const [section, setSection] = useState<Section>(unlocks ? initialSection : 'MANUAL');

    const activeTopic = TUTORIAL_TOPICS.find(topic => topic.id === selectedTopicId);
    const counts = unlocks ? codexCounts(unlocks) : null;
    const level = levelOf(unlocks?.xp ?? 0, levelCapFor(unlocks?.heroes.length ?? 0, STARTING_MATERIALS.length));

    const SectionTab: React.FC<{ id: Section; icon: React.ReactNode; label: string; count?: string }> =
        ({ id, icon, label, count }) => (
            <button
                onClick={() => { setSection(id); setSelectedTopicId(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 border uppercase text-[11px] font-bold tracking-widest transition-colors
                    ${section === id
                        ? 'bg-[#16241d] border-green-600 text-green-300'
                        : 'border-[#2b303b] text-gray-500 hover:bg-[#1a1d24] hover:text-gray-300'}`}
            >
                {icon} {label}
                {count && <span className={section === id ? 'text-green-400' : 'text-gray-600'}>{count}</span>}
            </button>
        );

    return (
        <div className={`${overlay ? 'fixed inset-0 z-[80]' : 'w-full h-screen'} bg-[#0d0e11] flex flex-col font-pixel text-white relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[length:40px_40px] opacity-20 pointer-events-none"></div>

            {/* Header */}
            <div className="bg-[#1a1c21] border-b border-gray-700 px-4 py-3 flex items-center gap-3 z-10 shrink-0">
                <button
                    onClick={() => selectedTopicId ? setSelectedTopicId(null) : onBack()}
                    className="p-2 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white group border border-gray-700 hover:border-white"
                    title={overlay ? t('Close') : undefined}
                >
                    {overlay && !selectedTopicId
                        ? <X size={18} />
                        : <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />}
                </button>
                <div>
                    <h1 className="text-base uppercase font-bold tracking-[0.15em] text-green-400">{t('Tactical Archive')}</h1>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                        {selectedTopicId ? t('Database // {topic}', { topic: t(activeTopic?.title || '') }) : t('Database // Root Index')}
                    </span>
                </div>

                {/* The three books, side by side. The Codex used to be a second full screen
                    behind its own menu button; a manual and a roster are the same act — reading
                    up between runs — so they are tabs of one thing now. */}
                {counts && (
                    <div className="ml-auto flex items-center gap-2">
                        {/* The level is the thing everything else is paid out of, so it is
                            stated once, plainly, at the top of the book that lists them. */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-700/60 bg-amber-950/25">
                            <Star size={13} className="text-amber-400" />
                            <span className="text-[11px] uppercase tracking-widest text-gray-400">{t('Level')}</span>
                            <span className="text-sm font-black text-amber-300">{level.level}</span>
                            <span className="text-[10px] font-mono text-gray-600">
                                {level.capped ? t('MAX') : `${level.into}/${level.needed}`}
                            </span>
                        </div>
                        <SectionTab id="MANUAL" icon={<BookOpen size={13} />} label={t('Manual')} />
                        <SectionTab id="HEROES" icon={<Users size={13} />} label={t('Heroes')}
                                    count={`${counts.heroesOwned}/${counts.heroesTotal}`} />
                        <SectionTab id="FUSIONS" icon={<FlaskConical size={13} />} label={t('Fusions')}
                                    count={`${counts.recipesKnown}/${counts.recipesTotal}`} />
                    </div>
                )}
            </div>

            {section === 'HEROES' && unlocks && (
                <div className="flex-1 min-h-0"><HeroGrid unlocks={unlocks} /></div>
            )}
            {section === 'FUSIONS' && unlocks && (
                <div className="flex-1 min-h-0"><RecipeMatrix unlocks={unlocks} /></div>
            )}

            {/* Content Area */}
            {section === 'MANUAL' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <div className="max-w-4xl mx-auto w-full pb-6">

                    {/* VIEW 1: GRID MENU */}
                    {!selectedTopicId && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                            {TUTORIAL_TOPICS.map((topic) => (
                                <button
                                    key={topic.id}
                                    onClick={() => setSelectedTopicId(topic.id)}
                                    className="group bg-[#1a1c21] border border-[#363b45] hover:border-green-500 hover:bg-[#23262f] p-3 text-left transition-all relative overflow-hidden active:scale-[0.98] flex flex-col"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-1.5 bg-black border border-gray-700 group-hover:border-green-500/50 transition-colors">
                                            {React.cloneElement(topic.icon as React.ReactElement<any>, { size: 18 })}
                                        </div>
                                        <CornerDownRight className="text-gray-700 group-hover:text-green-500 transition-colors" size={14} />
                                    </div>
                                    <h3 className="text-[13px] font-bold uppercase tracking-wide text-white group-hover:text-green-400 transition-colors mb-1 leading-tight">
                                        {t(topic.title)}
                                    </h3>
                                    <p className="text-[11px] text-gray-500 leading-4">{t(topic.desc)}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* VIEW 2: DETAIL TOPIC */}
                    {activeTopic && (
                        <div className="bg-[#1a1c21] border border-[#363b45] flex flex-col md:flex-row">
                            <div className="md:w-56 shrink-0 p-4 border-b md:border-b-0 md:border-r border-[#363b45] bg-[#15171c] flex flex-col">
                                <div className="mb-3 p-2.5 bg-black border border-gray-700 w-fit">
                                    {React.cloneElement(activeTopic.icon as React.ReactElement<any>, { size: 28 })}
                                </div>
                                <h2 className="text-lg font-bold uppercase text-white mb-2 leading-tight">{t(activeTopic.title)}</h2>
                                <p className="text-gray-400 text-[12px] leading-5">{t(activeTopic.desc)}</p>
                                <div className="mt-4 md:mt-auto pt-4">
                                    <button
                                        onClick={() => setSelectedTopicId(null)}
                                        className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-white uppercase font-bold text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft size={14} /> {t('Return')}
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 p-4 min-w-0">{activeTopic.content}</div>
                        </div>
                    )}

                </div>
            </div>
            )}

            {counts && (
                <div className="shrink-0 px-4 py-2 border-t border-[#2b303b] bg-[#12141a] text-[11px] text-gray-500 normal-case tracking-normal">
                    {section === 'MANUAL'
                        ? t('Everything here describes the rules as they are now, not as the tutorial taught them.')
                        : t('Both are paid by your commander level, and the level is paid by how far a run got — winning is not required.')}
                </div>
            )}

            <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #111; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #444; border: 2px solid #111; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666; }
            .line-clamp-2 {
                display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
                overflow: hidden;
            }
        `}</style>
        </div>
    );
};
