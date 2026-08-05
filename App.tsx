
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Position, UnitClass, Skill, UnitType, Unit,
  HeroId, ItemDefinition, MaterialId, EventEffect, GameState, MapNode
} from './types';
import {
  INITIAL_GAME_STATE, UNIT_SKILLS as INITIAL_SKILLS, DEFAULT_UNIT_DEFINITIONS,
  DEFAULT_TERRAIN_DEFS, DEFAULT_ITEM_DEFINITIONS,
  GENERATE_MAP, GENERATE_BREACH_MAP, SHOP_OFFER_COUNT, shopRerollCost, BENCH_CAPACITY, SQUAD_SIZE,
  coinOnRunStart, COIN_FUSE, COIN_HEAL_PER_HP, COIN_REPAIR_SEEDLING
} from './constants';
import { HERO_DEFINITIONS } from './data/heroes';
import { bossById, elementsUnlocked } from './data/unlocks';
import { MATERIAL_DEFINITIONS, STARTING_MATERIALS } from './data/materials';
import { applyFusion, applyFusionToSkill, applyUpgrade, hasFusionEffect, getFusionEffectValue, canFuse } from './utils/fusion';
import { computeThreatenedTiles, computeThreatDetail } from './utils/threat';
import { missionMarkers } from './data/missions';
import { useGameEngine, FAST_SPEED } from './hooks/useGameEngine';
import { useGameProgression, RunPayout } from './hooks/useGameProgression';
import { processTurn } from './utils/turnManager';
import {
  getValidMoves, getValidSkillTargets, getSkillGeometry,
  getSkillTargetPath, getUnitAt, getTileAt, isSunProducingSkill, gustDirection, getSolidUnitAt } from './utils/gameLogic';
// Combat resolution used to live in this file, as ~500 lines inside handleTileClick.
// It is pure — units in, TurnAction[] out — so it belongs beside the rest of the rules.
import { planSkillActions } from './utils/skillResolution';
import { activeResonance } from './utils/elements';
import { isBattleOnlyUnit } from './utils/unitFactory';
import { freshHero } from './utils/unitFactory';
import { itemTargetInvalid, planItemActions } from './utils/itemResolution';
import { loadConfigFromStorage } from './utils/persistence';
import { saveRunState, loadRunState, clearRunState, hasSavedRun } from './utils/runPersistence';
import { TUTORIAL_DIALOGUES } from './data/tutorialDialogues';
import { GENERATE_TUTORIAL_MAP } from './data/tutorial';
import { TutorialDialogue } from './components/TutorialDialogue';

import { Board } from './components/Board';
import { HUD } from './components/HUD';
import { ActionPanel } from './components/ActionPanel';
import { SquadSidebar } from './components/SquadSidebar';
import { OrientationOverlay } from './components/OrientationOverlay';
import { MapScreen } from './components/MapScreen';
import { ShopScreen } from './components/ShopScreen';
import { StartMenu } from './components/StartMenu';
import { StageSelectScreen } from './components/StageSelectScreen';
import { IntroComic } from './components/IntroComic';
import { OutroComic, OUTRO_PANELS } from './components/OutroComic';
import { TutorialPrompt } from './components/TutorialPrompt';
import { LevelBar } from './components/LevelBar';
import { TutorialScreen } from './components/TutorialScreen';
import { SquadSelectScreen, type HeroElementMap } from './components/SquadSelectScreen';
import { VictoryScreen } from './components/VictoryScreen';
import { FusionPanel } from './components/FusionPanel';
import { CampScreen } from './components/CampScreen';
import { UpgradePicker } from './components/UpgradePicker';
import { ActIntro } from './components/ActIntro';
import { SquadViewer } from './components/SquadViewer';
import { BalanceScreen } from './components/BalanceScreen';
import { DebugPanel, buildDebugMap, type DebugJump } from './components/DebugPanel';
import { EventScreen } from './components/EventScreen';
import { CoachMark } from './components/CoachMark';
import { Spotlight } from './components/Spotlight';
import { TutorialSkipButton } from './components/TutorialSkipButton';
import { TUTORIAL_CHAIN, tutorialBattle, tutorialNode, tutorialSteps, stepActor, stepMaterial, stepItem, stepCopies, stepSatisfied } from './data/tutorial';
import { Flag } from 'lucide-react';
import { GAME_EVENTS } from './data/events';
import { useI18n } from './i18n';
import { sfx, playMusic, installAudioUnlock, type MusicTrack } from './utils/audio';
import { SettingsModal } from './components/SettingsModal';
import { balancedGlobal } from './utils/balance';
import { TUTORIAL_RECIPES } from './data/unlocks';
import { ScreenFade } from './components/ScreenFade';

/** Shared empty list, so the tutorial index memo does not recompute on every render. */
const EMPTY_ACK: number[] = [];

const App: React.FC = () => {
  const { t } = useI18n();
  const [unitDefs, setUnitDefs] = useState(DEFAULT_UNIT_DEFINITIONS);
  const [skillDefs, setSkillDefs] = useState(INITIAL_SKILLS);
  const [terrainDefs, setTerrainDefs] = useState(DEFAULT_TERRAIN_DEFS);
  const [itemDefs, setItemDefs] = useState(DEFAULT_ITEM_DEFINITIONS);

  useEffect(() => {
      const savedConfig = loadConfigFromStorage();
      if (savedConfig) {
          setUnitDefs(savedConfig.unitDefs);
          setSkillDefs(savedConfig.skillDefs);
          setTerrainDefs(savedConfig.terrainDefs);
          setItemDefs(savedConfig.itemDefs);
      }
  }, []);

  // --- AUDIO ---------------------------------------------------------------
  // Browsers refuse to play anything until the user has interacted with the page, so the
  // whole system stays silent until the first click or keypress arms it.
  useEffect(() => installAudioUnlock(), []);

  // One click sound for every button in the game, registered once. The alternative was an
  // onClick tweak in twenty components, which would go stale the moment anyone adds a
  // twenty-first. Capture phase so it still fires when a handler stops propagation.
  useEffect(() => {
      const onDown = (e: PointerEvent) => {
          const el = e.target as HTMLElement | null;
          const btn = el?.closest?.('button, [role="button"]') as HTMLElement | null;
          if (!btn) return;
          // Backing out gets its own note. `ui-back` shipped with a file and a mix level and
          // was never called, because the one global listener above cannot tell "confirm" from
          // "cancel" by looking at a <button>. The button says which it is, via data-sfx —
          // one decision here, one attribute there, instead of an onClick in twenty components
          // that goes stale the moment somebody adds the twenty-first.
          sfx(btn.dataset.sfx === 'back' ? 'ui-back' : 'ui-click');
      };
      document.addEventListener('pointerdown', onDown, true);
      return () => document.removeEventListener('pointerdown', onDown, true);
  }, []);


  // The screen-driven music effects live below, next to the state they read — `gameState`
  // is declared further down and touching it here would be a temporal dead zone error.

  const {
      gameState, setGameState, board, setBoard, units, setUnits,
      projectiles, effects, addDamageEvent, addEffect, executeTurnActions,
      turnResetsUsed, resetTurn, beginTurnRewindWindow,
      speed, setSpeed, skipAnimation
  } = useGameEngine();

  const {
      mapNodes, selectNode, completeLevel, previewRewards, performTurnZeroAI, setMapNodes,
      registerSquad, handleHeroFallen, reviveHero, reviveHeroPaid, addBenchPlant, removeBenchPlant,
      brainCost, buyBrain, finishTutorial, previewUnlocks, runPayoutPreview, recordRunLost, fusableHeroes, fuseQueuedHero, upgradeQueuedHero,
      unlocks, unlockEverything, resetProgress, reviveAllHeroes
  } = useGameProgression({
      gameState, setGameState, setBoard, units, setUnits, unitDefs, terrainDefs
  });

  // The music effect lives further down, below `showIntro` — it reads that flag, and this
  // point in the function body is still inside its temporal dead zone.

  /**
   * Coin changed hands. Watched centrally for the same reason the click is: Coin moves through
   * level rewards, shop purchases, rerolls, revives, brain buy-backs and half the event
   * outcomes, and `ui-coin` had a file and a mix level but no call site because no single one
   * of those places felt like the obvious owner. The BALANCE is the event.
   *
   * Deliberately fires for spending as well as earning — the sample is coins being handled, and
   * a purchase is the moment the player most wants to hear that it went through.
   */
  const prevCoinsRef = useRef(gameState.coins);
  useEffect(() => {
      if (gameState.coins !== prevCoinsRef.current) {
          prevCoinsRef.current = gameState.coins;
          sfx('ui-coin');
      }
  }, [gameState.coins]);

  // Heroes carry their own two skills instead of the class skill table. Each of the five
  // heroes has a distinct base class, so keying the override by class is unambiguous.
  const heroSkillDefs = useMemo(() => {
      const merged: Record<UnitClass, Skill[]> = { ...skillDefs };
      Object.values(HERO_DEFINITIONS).forEach(hero => {
          merged[hero.baseClass] = [hero.basicAttack, hero.heroSkill];
      });
      return merged;
  }, [skillDefs]);

  /**
   * Skills available to one specific unit. A GRANT_ATTACK fusion hands a hero an attack it
   * did not have (Sun Shooter, Battlement, Spitter), so the skill list can no longer be
   * keyed by class alone. `effect.value` carries the Sun price of the granted shot.
   */
  const skillsFor = React.useCallback((unit: Unit | null): Skill[] => {
      if (!unit) return [];
      // heroSkillDefs overrides a CLASS entry with that hero's kit — but the override must
      // only apply to the hero. A bench Peashooter shares the class, and through this table
      // it was quietly carrying Shadeleaf's basic AND her 50-Sun Precision Blast: a 100-Coin
      // shop plant with a hero's signature move. Base plants read the plain class table.
      const base = (unit.isHero ? heroSkillDefs[unit.class] : skillDefs[unit.class]) || [];
      if (!hasFusionEffect(unit, 'GRANT_ATTACK')) return base;

      const cost = getFusionEffectValue(unit, 'GRANT_ATTACK');
      const granted: Skill = {
          id: 'fusion_granted_shot',
          name: t('Fused Shot'),
          description: cost > 0
              ? t('A ranged shot granted by fusion. Costs {cost} Sun.', { cost })
              : t('A ranged shot granted by fusion. Free.'),
          rangeType: 'LINE',
          rangeValue: 6,
          sunCost: cost,
          effects: [{ type: 'DAMAGE', value: 2 }],
      };
      return base.some(sk => sk.id === granted.id) ? base : [...base, granted];
  }, [heroSkillDefs, skillDefs, t]);

  const [showSquadViewer, setShowSquadViewer] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  /**
   * The codex is a pure reference overlay, so it is local UI state rather than a GameState
   * field: nothing about it is worth persisting, and putting it in GameState would mean a
   * saved run could resume with the encyclopedia open over the map.
   */
  const [showCodex, setShowCodex] = useState(false);
  /**
   * The payout a lost run just banked. Captured from `recordRunLost` rather than recomputed,
   * because committing it is what zeroes the run's tally — by the time the defeat screen
   * renders there is nothing left to read.
   */
  const [lostRunPayout, setLostRunPayout] = useState<RunPayout | null>(null);

  /** Whether the menu should offer "Continue Campaign". Re-checked whenever the menu shows. */
  const [hasResumableRun, setHasResumableRun] = useState(() => hasSavedRun());
  useEffect(() => {
      if (gameState.screen === 'START_MENU') setHasResumableRun(hasSavedRun());
  }, [gameState.screen]);

  // Autosave the run at every safe point (saveRunState ignores unsafe screens itself).
  useEffect(() => {
      saveRunState(gameState, units, mapNodes);
  }, [gameState, units, mapNodes]);

  // A dead run must not be resumable. It still pays out, though: objectives banked on the
  // way down convert to fusion recipes here, same as they would on a boss clear.
  useEffect(() => {
      if (gameState.screen === 'GAME_OVER') { clearRunState(); setLostRunPayout(recordRunLost()); }
  }, [gameState.screen]);
  const [hoveredTile, setHoveredTile] = useState<Position | null>(null);
  
  const [selectedRosterId, setSelectedRosterId] = useState<string | null>(null);
  const [showFusionPanel, setShowFusionPanel] = useState(false);

  /**
   * The intro comic is a first-run-only beat. Kept in localStorage rather than in the run
   * state because it is about the PLAYER, not the run: abandoning a run must not re-show it.
   */
  const INTRO_SEEN_KEY = 'pitb_intro_seen_v1';
  const [showIntro, setShowIntro] = useState(false);
  /** True when the comic was opened from the menu's replay button rather than by starting. */
  const introWasReplay = React.useRef(false);

  /**
   * The outro comic — the intro's bookend, shown once the Blightlord falls.
   *
   * ART GATE: the epilogue's artwork ships separately (art-src/ART-PROMPTS.md § outro), so
   * the screen must not exist until the files do. One probe of the FIRST panel decides for
   * the whole page — the panels are one commission in one style, so "panel 1 exists" is the
   * honest proxy for "the set exists", and probing all eight would just be eight ways to
   * learn the same fact. Until it loads, a campaign win goes straight to the normal victory
   * flow and nothing half-built is ever shown.
   */
  const [outroReady, setOutroReady] = useState(false);
  const [showOutro, setShowOutro] = useState(false);
  useEffect(() => {
      const probe = new Image();
      probe.onload = () => setOutroReady(true);
      probe.src = OUTRO_PANELS[0].art;
  }, []);

  /**
   * The tutorial is OFFERED, never forced. It used to be the only road into a first run —
   * Start Mission dropped a new player straight onto the scripted map with no way out but
   * finishing it. Now the first Start Mission asks once, and the answer sticks: played it,
   * skipped it or bailed out mid-way all count as answered, and the question never returns.
   * Stored per PLAYER (localStorage) like the intro comic, not per run.
   */
  const TUTORIAL_ASKED_KEY = 'pitb_tutorial_asked_v1';
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const markTutorialAsked = () => {
      try { localStorage.setItem(TUTORIAL_ASKED_KEY, '1'); } catch {}
  };

  // Music follows the screen. playMusic is idempotent, so re-running this on unrelated
  // state changes does not restart the track.
  useEffect(() => {
      const TRACKS: Partial<Record<GameState['screen'], MusicTrack | null>> = {
          START_MENU: 'menu', SQUAD_SELECT: 'menu', TUTORIAL: 'menu',
          MAP: 'map', SHOP: 'map', EVENT: 'map',
          COMBAT: 'combat',
          // Silence under the win/lose stinger — music competing with it just muddies both.
          VICTORY: null, GAME_OVER: null,
      };
      // The comic is an overlay on top of START_MENU, so the screen alone cannot tell the
      // prologue apart from the menu behind it — without this check the story would play
      // over the menu loop and land as a pause rather than a scene.
      playMusic(showIntro ? 'intro' : (TRACKS[gameState.screen] ?? null));

      if (gameState.screen === 'VICTORY') sfx('victory');
      else if (gameState.screen === 'GAME_OVER') sfx('defeat');
  }, [gameState.screen, showIntro]);

  /**
   * Every run now begins at the hero picker. The tutorial is a separate road, taken only by
   * answering the prompt below — it still skips the picker, because every scripted board
   * names its own squad and a first-time player has no basis for choosing three heroes.
   */
  const enterRun = () => {
      // First Start Mission of a player's life: ask about the tutorial instead of picking
      // for them. A player who already finished it is never asked.
      let asked = false;
      try { asked = localStorage.getItem(TUTORIAL_ASKED_KEY) === '1'; } catch {}
      if (!asked && !unlocks?.tutorialDone) {
          setShowTutorialPrompt(true);
          return;
      }
      // Starting a NEW mission explicitly abandons whatever run was saved before.
      clearRunState();
      setHasResumableRun(false);
      setGameState(prev => ({ ...prev, screen: 'STAGE_SELECT', targetBossId: null }));
  };

  /** Pick the saved run back up exactly where the last safe point left it. */
  const continueRun = () => {
      const saved = loadRunState();
      if (!saved) { setHasResumableRun(false); return; }
      setMapNodes(saved.mapNodes);
      setUnits(saved.units);
      setGameState({ ...saved.gameState, screen: 'MAP' });
  };

  /**
   * Replay the tutorial chain from the menu — a fresh run on the scripted seven-node map.
   * Available even after tutorialDone, for the player who wants the refresher.
   */
  const replayTutorial = () => {
      markTutorialAsked();
      clearRunState();
      setHasResumableRun(false);
      seenDialogues.current.clear();
      registerSquad([]);
      setUnits([]);
      setMapNodes(GENERATE_TUTORIAL_MAP());
      setGameState({ ...INITIAL_GAME_STATE, screen: 'MAP', sun: 0, coins: balancedGlobal('global.COIN_ON_RUN_START') });
  };

  /**
   * Walking away from the scripted chain, from the prompt or from the Skip button inside it.
   * `finishTutorial` keeps the recipes it taught and marks the tutorial done, so the run that
   * follows is an ordinary one — but the abandoned tutorial run itself is thrown away rather
   * than left running underneath, which is what made Skip feel like being shoved into a game
   * the player had not chosen: it dumped them onto a live map mid-run.
   */
  const leaveTutorial = (destination: 'START_MENU' | 'SQUAD_SELECT') => {
      markTutorialAsked();
      finishTutorial();
      clearRunState();
      setHasResumableRun(false);
      seenDialogues.current.clear();
      registerSquad([]);
      setUnits([]);
      setGameState({ ...INITIAL_GAME_STATE, screen: destination });
  };

  /**
   * Tutorial nodes open with a short dialogue scene (data/tutorialDialogues.ts), once per
   * run. The node itself is entered only after the scene ends or is skipped.
   */
  const [pendingDialogueNode, setPendingDialogueNode] = useState<MapNode | null>(null);
  const seenDialogues = React.useRef<Set<string>>(new Set());

  // Shadeleaf's map briefing: plays over the FIRST look at the tutorial map, bridging the
  // intro comic's rooftop ending into the run (what the symbols mean, find the others).
  /** Node types the current map-intro line is describing, lit up in the legend. */
  const [mapIntroHighlight, setMapIntroHighlight] = useState<string[] | undefined>(undefined);
  const [showMapIntro, setShowMapIntro] = useState(false);
  useEffect(() => {
      if (gameState.screen === 'MAP'
          && mapNodes.some(n => n.tutorialId)
          && !seenDialogues.current.has('tut_map')) {
          setShowMapIntro(true);
      }
  }, [gameState.screen, mapNodes]);

  const handleSelectNode = (node: MapNode) => {
      const tutId = node.tutorialId;
      if (tutId && TUTORIAL_DIALOGUES[tutId] && !seenDialogues.current.has(tutId)) {
          setPendingDialogueNode(node);
          return;
      }
      selectNode(node, undefined, gameState.debugMode);
  };

  const startRun = () => {
      let seen = false;
      try { seen = localStorage.getItem(INTRO_SEEN_KEY) === '1'; } catch {}
      if (seen) {
          enterRun();
      } else {
          setShowIntro(true);
      }
  };

  /** Reading it, skipping it and re-reading it all count as "seen". */
  const closeIntro = () => {
      try { localStorage.setItem(INTRO_SEEN_KEY, '1'); } catch {}
      setShowIntro(false);
      // A replay from the menu should land back on the menu, not launch a run.
      if (gameState.screen === 'START_MENU' && !introWasReplay.current) enterRun();
      introWasReplay.current = false;
  };

  // A hero that leaves the board is knocked out for the rest of the run until revived.
  // The engine just removes the unit, so watch for the disappearance here.
  const knownHeroesRef = React.useRef<Map<HeroId, Unit>>(new Map());
  const prevScreenRef = React.useRef(gameState.screen);
  useEffect(() => {
      const live = new Map<HeroId, Unit>();
      units.forEach(u => { if (u.isHero && u.heroId) live.set(u.heroId, u); });

      // The screen may ALREADY have flipped to VICTORY by the time this runs: a hero killed
      // on the last turn dies in the same batch that resolves the mission. Testing only the
      // current screen therefore missed exactly that case — she vanished from the run with
      // no record, so the revive event had nobody to offer and the tutorial's whole
      // death-then-revive arc quietly did not happen. Accepting the previous screen too
      // catches the last-turn death without catching the between-level squad rebuild, which
      // always arrives from MAP.
      const inBattle = gameState.screen === 'COMBAT' || prevScreenRef.current === 'COMBAT';
      knownHeroesRef.current.forEach((snapshot, heroId) => {
          if (!live.has(heroId) && inBattle) {
              handleHeroFallen(heroId, snapshot);
          }
      });
      knownHeroesRef.current = live;
      prevScreenRef.current = gameState.screen;
  }, [units, gameState.screen]);

  const selectedUnit = units.find(u => u.id === gameState.selectedUnitId) || null;
  const selectedTileData = gameState.selectedTile ? getTileAt(gameState.selectedTile, board) || null : null;
  
  const selectedRosterUnit = useMemo(() => {
      if (gameState.interactionMode === 'PLACEMENT' && selectedRosterId) {
          return units.find(u => u.id === selectedRosterId) || null;
      }
      return null;
  }, [gameState.interactionMode, selectedRosterId, units]);

  useEffect(() => {
      if (gameState.interactionMode === 'PLACEMENT') {
          const current = units.find(u => u.id === selectedRosterId);
          if (!selectedRosterId || !current) {
              const firstPlant = units.find(u => u.type === UnitType.PLANT);
              if (firstPlant) setSelectedRosterId(firstPlant.id);
          }
      }
  }, [gameState.interactionMode, units]);

  const validMoveTiles = useMemo(() => {
      if (gameState.interactionMode !== 'IDLE' || !selectedUnit || !selectedUnit.type) return [];
      if (selectedUnit.isEnemy) return [];
      return getValidMoves(selectedUnit, units, board, terrainDefs);
  }, [selectedUnit, units, board, gameState.interactionMode, terrainDefs]);

  const validSkillTargetTiles = useMemo(() => {
      if (gameState.interactionMode === 'PLACEMENT') {
          // The deploy zone is authored into the map, not derived from column numbers.
          return board
              .filter(t => t.isDeployZone && terrainDefs[t.terrain]?.isWalkable)
              .map(t => ({ x: t.x, y: t.y }));
      }
      
      if (gameState.interactionMode !== 'TARGETING' || !selectedUnit || !gameState.selectedSkillId) return [];
      const baseSkill = skillsFor(selectedUnit).find(s => s.id === gameState.selectedSkillId);
      if (!baseSkill) return [];
      // Fusions can change a skill's reach (Pea Lance, Wall-nut Bowling) — targeting
      // must see the same skill the cast will resolve with.
      const skill = applyFusionToSkill(baseSkill, selectedUnit);
      
      if (skill.requiresSunCharge && (!selectedUnit.sunCharge || selectedUnit.sunCharge <= 0)) {
          return [];
      }
      // Sun producers may walk now, but a turn spent walking is a turn without light.
      // Enforced here as well as on the button so the rule holds however the cast is reached.
      if (selectedUnit.hasMoved && isSunProducingSkill(skill)) {
          return [];
      }
      // Can't afford it — offer no targets so the player can't spend Sun they don't have.
      // Must use the same discounted price the click handler charges, or the UI would offer
      // a move the game then refuses.
      const netCost = Math.max(0, (skill.sunCost || 0) - getFusionEffectValue(selectedUnit, 'SKILL_DISCOUNT'));
      if (netCost > gameState.sun) {
          return [];
      }

      return getValidSkillTargets(selectedUnit, skill, units, board, terrainDefs);
  }, [gameState.interactionMode, selectedUnit, gameState.selectedSkillId, units, board, skillDefs, terrainDefs]);

  const skillGeometryTiles = useMemo(() => {
      if ((gameState.interactionMode !== 'TARGETING' && gameState.interactionMode !== 'IDLE') || !selectedUnit) return [];
      if (gameState.selectedSkillId) {
           const skill = skillsFor(selectedUnit).find(s => s.id === gameState.selectedSkillId);
           return skill ? getSkillGeometry(selectedUnit, applyFusionToSkill(skill, selectedUnit)) : [];
      }
      return [];
  }, [gameState.interactionMode, selectedUnit, gameState.selectedSkillId, skillDefs]);

  const attackPath = useMemo(() => {
      if (gameState.interactionMode === 'TARGETING' && selectedUnit && gameState.selectedSkillId && hoveredTile) {
          const isValid = validSkillTargetTiles.some(t => t.x === hoveredTile.x && t.y === hoveredTile.y);
          if (!isValid) return [];
          
          const baseSkill = skillsFor(selectedUnit).find(s => s.id === gameState.selectedSkillId);
          if (!baseSkill) return [];

          return getSkillTargetPath(selectedUnit, applyFusionToSkill(baseSkill, selectedUnit), hoveredTile, board);
      }
      return [];
  }, [gameState.interactionMode, selectedUnit, gameState.selectedSkillId, hoveredTile, validSkillTargetTiles, skillDefs, board]);

  const previewPushDirection = useMemo(() => {
      // Blover: show which way the wind will blow before the player commits.
      if (gameState.interactionMode === 'ITEM_TARGETING' && gameState.selectedItemId && hoveredTile) {
          const item = itemDefs.find(i => i.id === gameState.selectedItemId);
          if (item?.effect === 'GUST') {
              const { dx, dy } = gustDirection(hoveredTile);
              if (dx === 1) return 'DOWN';
              if (dx === -1) return 'UP';
              if (dy === 1) return 'RIGHT';
              return 'LEFT';
          }
      }

      if (gameState.interactionMode === 'TARGETING' && selectedUnit && gameState.selectedSkillId && hoveredTile) {
           const baseSkill = skillsFor(selectedUnit).find(s => s.id === gameState.selectedSkillId);
           const skill = baseSkill ? applyFusionToSkill(baseSkill, selectedUnit) : null;
           if (skill) {
               const hasPush = skill.effects.some(e => e.type === 'PUSH');
               const hasPull = skill.effects.some(e => e.type === 'PULL');
               const hasGlobalPush = skill.effects.some(e => e.type === 'GLOBAL_PUSH');

               if (hasGlobalPush) {
                   const dx = Math.sign(hoveredTile.x - selectedUnit.position.x);
                   const dy = Math.sign(hoveredTile.y - selectedUnit.position.y);
                   if (dx === 1) return 'DOWN';
                   if (dx === -1) return 'UP';
                   if (dy === 1) return 'RIGHT';
                   if (dy === -1) return 'LEFT';
               }

               if (!hasPush && !hasPull) return null;
               
               const dx = hoveredTile.x - selectedUnit.position.x;
               const dy = hoveredTile.y - selectedUnit.position.y;
               
               if (hasPush) {
                   if (dx > 0) return 'DOWN';
                   if (dx < 0) return 'UP';
                   if (dy > 0) return 'RIGHT';
                   if (dy < 0) return 'LEFT';
               }
               if (hasPull) {
                   if (dx > 0) return 'UP';
                   if (dx < 0) return 'DOWN';
                   if (dy > 0) return 'LEFT';
                   if (dy < 0) return 'RIGHT';
               }
           }
      }
      return null;
  }, [gameState.interactionMode, selectedUnit, gameState.selectedSkillId, hoveredTile, skillDefs]);

  /**
   * HOW FAR the shove goes, not just which way.
   *
   * The arrow above only ever showed a direction, which was true while every PUSH in the game
   * moved exactly one tile. Chardwall shoves TWO, and a fusion can add more — and this game
   * promises the player perfect information, so an arrow that says "that way" about a two-tile
   * throw is the telegraph lying. Read off the FUSED skill for the same reason the direction is:
   * what is drawn has to be what resolves.
   */
  const previewPushDistance = useMemo(() => {
      if (gameState.interactionMode !== 'TARGETING' || !selectedUnit || !gameState.selectedSkillId) return 1;
      const baseSkill = skillsFor(selectedUnit).find(s => s.id === gameState.selectedSkillId);
      const skill = baseSkill ? applyFusionToSkill(baseSkill, selectedUnit) : null;
      const shove = skill?.effects.find(e => e.type === 'PUSH' || e.type === 'PULL');
      return Math.max(1, shove?.value ?? 1);
  }, [gameState.interactionMode, selectedUnit, gameState.selectedSkillId, skillDefs]);

  // Blast preview for the item being aimed: mirrors the exact area the use-code hits,
  // so what the player sees is what resolves. Follows the hovered tile.
  const itemAoeTiles = useMemo((): Position[] => {
      if (gameState.interactionMode !== 'ITEM_TARGETING' || !gameState.selectedItemId || !hoveredTile) return [];
      const item = itemDefs.find(i => i.id === gameState.selectedItemId);
      if (!item) return [];

      // Jalapeno burns the whole row it lands on.
      if (item.id === 'jalapeno') {
          return Array.from({ length: 8 }, (_, col) => ({ x: hoveredTile.x, y: col }));
      }

      // Blover is board-wide. Highlighting only the hovered tile would imply it is a point
      // effect and hide the fact that the click only chooses a direction.
      if (item.effect === 'GUST') {
          const all: Position[] = [];
          for (let x = 0; x < 8; x++) for (let y = 0; y < 8; y++) all.push({ x, y });
          return all;
      }

      const radius = item.rangeRadius || 0;
      const tiles: Position[] = [];
      for (let x = hoveredTile.x - radius; x <= hoveredTile.x + radius; x++) {
          for (let y = hoveredTile.y - radius; y <= hoveredTile.y + radius; y++) {
              if (x >= 0 && x < 8 && y >= 0 && y < 8) tiles.push({ x, y });
          }
      }
      return tiles;
  }, [gameState.interactionMode, gameState.selectedItemId, hoveredTile, itemDefs]);

  /**
   * @param heroElements The element each picked hero carries for this run, from the squad
   *        screen. It travels two ways on purpose: into the BODIES built right here (so the
   *        map's squad panel already shows the health that was paid for), and into GameState
   *        via `registerSquad`, which is what rebuilds a revived hero correctly three nodes
   *        later and what survives an F5.
   */
  const handleStartGame = (selectedHeroes: HeroId[], heroElements: HeroElementMap = {}) => {
      // Was a hand-inlined copy of `freshHero` that differed only in the id — and once the
      // element arrived, that copy would also have had to re-derive the max-HP price. One
      // factory, one place the bill is charged (utils/unitFactory.ts).
      const initialUnits: Unit[] = selectedHeroes.map((heroId, idx) =>
          freshHero(heroId, `player-${idx}-${Date.now()}`, heroElements[heroId]));

      setUnits(initialUnits);
      registerSquad(selectedHeroes, heroElements);
      // A picked squad always means an ordinary run, so the map is generated here rather than
      // inherited. Without this, a player who declined the tutorial still carried the scripted
      // seven-node map that useGameProgression lays down for anyone who has not finished it.
      //
      // Bosses beaten picks the sector chain: three of them means the run walks stage II's
      // coast, thornwaste and ice instead of the opening three (utils/mapGenerator.ts).
      // The campaign screen chose an act: the map is laid out for that stage and its boss
      // node carries that boss. Falling back to the save's progress keeps every other entry
      // point (tutorial skip, debug jump) behaving exactly as before.
      const target = gameState.targetBossId ? bossById(gameState.targetBossId) : undefined;
      // Stage 0 is the Breach, and it is not a stage: it is a hand-authored gauntlet of all ten
      // bosses. Routing it through GENERATE_MAP gave it a stage III map with Blightlord stapled
      // to the end, which is the one thing the final act was never supposed to be.
      setMapNodes(target?.stage === 0
          ? GENERATE_BREACH_MAP()
          : GENERATE_MAP(
              unlocks.bossesBeaten.length,
              target && target.stage > 0 ? target.stage - 1 : undefined,
              target?.id,
          ));
      // Coin is the cross-level currency now; Sun is granted per level by setupCombat.
      // The purse is sized to the act being attempted: a stage III run is the same ten layers
      // against harder boards, and the Breach is ten bosses with no shop in it at all.
      setGameState(prev => ({
          ...prev,
          screen: 'MAP',
          sun: 0,
          coins: coinOnRunStart(target?.stage ?? 1, balancedGlobal('global.COIN_ON_RUN_START')),
      }));
  };

  // --- SHOP: rolling offers, rerolling, buying base plants ---

  const rollShopOffers = (): MaterialId[] => {
      const pool = [...(unlocks.materials.length ? unlocks.materials : STARTING_MATERIALS)];
      const picked: MaterialId[] = [];
      while (picked.length < SHOP_OFFER_COUNT && pool.length > 0) {
          picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      return picked;
  };

  /**
   * Stock the shelves ON ARRIVAL — once per visit, and never again.
   *
   * This used to re-fire whenever the shelf hit zero, which was invisible until a purchase
   * started removing cards: buying the last plant instantly conjured a fresh random shelf.
   * In the tutorial that blew the pinned stock apart (a random Snow Pea for 175 where the
   * budget expects nothing), and in a real run it meant infinite stock for anyone with Coin
   * — the shop could never actually sell out. Keyed on the VISIT, not on the shelf being
   * empty, so an emptied shelf stays empty until the next shop.
   */
  const stockedVisitRef = useRef<string | null>(null);
  useEffect(() => {
      if (gameState.screen !== 'SHOP') { stockedVisitRef.current = null; return; }
      const visit = gameState.currentLevelId ?? 'shop';
      if (stockedVisitRef.current === visit) return;
      stockedVisitRef.current = visit;
      // A tutorial shop arrives pre-stocked (useGameProgression pins it); only roll for the
      // generated map, and only when the shelf is genuinely bare. The item shelf is
      // materialised here too: `null` means "the whole catalogue", and it has to become a
      // concrete list before a purchase can take anything off it.
      setGameState(prev => ({
          ...prev,
          shopOffers: prev.shopOffers.length === 0 ? rollShopOffers() : prev.shopOffers,
          shopItemOffers: prev.shopItemOffers ?? itemDefs.map(i => i.id),
      }));
  }, [gameState.screen, gameState.currentLevelId]);

  const handleReroll = () => {
      // A pinned shop cannot be rerolled. rollShopOffers() would replace the two plants the
      // tutorial's budget is built around with a random pair — a 175-Coin Snow Pea here and
      // the revive on board 5 is unaffordable, which is the exact failure pinning prevents.
      if (tutorialNode(gameState.currentLevelId ?? '')?.shopOffers) return;

      const cost = shopRerollCost(gameState.shopRerolls);
      if (gameState.coins < cost) return;
      setGameState(prev => ({
          ...prev,
          coins: prev.coins - cost,
          shopRerolls: prev.shopRerolls + 1,
          shopOffers: rollShopOffers()
      }));
  };

  const handleBuyMaterial = (materialId: MaterialId, index?: number) => {
      const def = MATERIAL_DEFINITIONS[materialId];
      if (!def || gameState.coins < def.coinCost) return;
      if (gameState.bench.length >= BENCH_CAPACITY) return;
      // The card leaves the shelf. Stock that never depleted was not stock at all: one card
      // could be bought over and over until the bench filled, which made the offer list
      // decorative and the reroll pointless — why pay to change the shelf when the shelf is
      // infinite? Removing by INDEX, not by material, so two cards of the same species are
      // two separate purchases.
      setGameState(prev => ({
          ...prev,
          coins: prev.coins - def.coinCost,
          shopOffers: typeof index === 'number'
              ? prev.shopOffers.filter((_, i) => i !== index)
              : prev.shopOffers.filter((id, i) => !(id === materialId && i === prev.shopOffers.indexOf(materialId))),
      }));
      addBenchPlant(materialId);
  };

  // Fusion consumes the plant: it can no longer be held back as insurance.
  // That trade is the whole point, so App owns both halves of it.
  /** Set once a fuse happens at a stage campfire — spends the rest (see the effect below). */
  const fusedAtCampfire = React.useRef(false);

  /** The node the player is standing in, when they are standing in one. */
  const currentNode = mapNodes.find(n => n.id === gameState.currentLevelId);

  const handleFuse = (heroUnitId: string, materialId: MaterialId, benchId?: string) => {
      // By bench id when the caller knows it. Falling back to the first material match
      // picked the WORN copy when two of the same species were benched — the panel offered
      // the pristine one, the mutation looked at the other, and the full-HP gate rejected a
      // fusion the player had every right to make.
      const benchEntry = (benchId && gameState.bench.find(b => b.id === benchId))
          || gameState.bench.find(b => b.materialId === materialId);
      if (!benchEntry) return;

      // Gated here as well as in the panel: the panel is UI, this is the mutation, and a
      // check that only lives in the view is one refactor away from not existing.
      // The scripted tutorial fuses pairings a fresh save has not learned, so it is exempt.
      const heroUnit = fusableHeroes(units).find(u => u.id === heroUnitId);
      const allowedRecipes = unlocks?.tutorialDone
          ? unlocks.recipes
          : [...(unlocks?.recipes ?? []), ...TUTORIAL_RECIPES];
      if (heroUnit && !canFuse(heroUnit, materialId, t, allowedRecipes, benchEntry).ok) return;

      // IN THE BREACH a graft is bought; at a stage campfire it is free.
      //
      // Not an inconsistency — the two rest points charge for different things. A campfire
      // costs you the OTHER two options (see MapNode.paidCamp), so billing the graft as well
      // would be charging twice for one visit. A Breach camp has no such rule: nothing is
      // exclusive there, so Coin is the only thing standing between the player and all of it.
      //
      // Charged here rather than on the button that opens the panel, because the panel can be
      // opened, browsed and closed again without committing to anything.
      const paidGraft = !!currentNode?.paidCamp;
      if (paidGraft) {
          if (gameState.coins < COIN_FUSE) return;
          setGameState(prev => ({ ...prev, coins: prev.coins - COIN_FUSE }));
      }

      sfx('fusion');
      // A fusion is also a night's rest for the recipient: hp snaps to the (possibly
      // just raised) maximum. Fusing only ever happens at the campfire.
      const onField = units.some(u => u.id === heroUnitId);
      if (onField) {
          setUnits(prev => prev.map(u => {
              if (u.id !== heroUnitId) return u;
              const fused = applyFusion(u, materialId);
              return { ...fused, hp: fused.maxHp };
          }));
      } else if (heroUnit?.heroId) {
          // A revived hero has no Unit until the next battle builds one. Her snapshot is
          // where she lives in the meantime, so that is where the fusion has to land.
          fuseQueuedHero(heroUnit.heroId, materialId);
      }
      removeBenchPlant(benchEntry.id);
      // At a campfire the graft IS the visit's one choice, so the bench closes on the spot and
      // the effect below files the rest as spent. At a Breach camp nothing is spent by fusing:
      // the panel closes and the player is back in the camp with whatever Coin is left.
      if (!paidGraft) fusedAtCampfire.current = true;
      setShowFusionPanel(false);
  };

  /**
   * A stage campfire is one visit, one choice: closing the bench after at least one fuse
   * resolves the event just like picking any other option — no second choice after.
   */
  const closeFusionPanel = () => setShowFusionPanel(false);

  // The "a fuse spends the rest" rule lives HERE, not inside closeFusionPanel: as a plain
  // function it consumed the fused flag against whatever gameState its closure happened to
  // hold, and a stale closure (an HMR remount mid-session was enough) swallowed the flag
  // and silently skipped the resolve — the campfire stayed open after fusing. An effect
  // re-reads everything fresh on every render, so however the panel got closed (button,
  // empty-bench auto-close, anything), the visit ends exactly once.
  useEffect(() => {
      if (!showFusionPanel && fusedAtCampfire.current
          && gameState.screen === 'EVENT' && gameState.currentEventId === 'rest_site') {
          fusedAtCampfire.current = false;
          handleEventResolve([]);
      }
  });

  // Fusion effects are grafted onto skills by applyFusionToSkill (utils/fusion.ts) —
  // shared with the targeting memos above so reach-changing fusions show correctly.
  const withFusionEffects = applyFusionToSkill;


  // Into the Breach's core promise: the player sees every incoming hit before committing.
  const threatenedTiles = useMemo(() => computeThreatenedTiles(units), [units]);
  const threatMarks = useMemo(() => computeThreatDetail(units), [units]);

  /**
   * Every click on the board. Four modes, and each one now delegates the rules to a pure
   * planner in utils/ — this function's job is React state, not combat.
   */
  const handleTileClick = (pos: Position) => {
      // The board is still resolving. A click now can start a SECOND executeTurnActions
      // against state the first one has not finished writing — the same overwrite
      // handleEndTurn already refuses, except here the two pipelines both try to hand back
      // interactionMode at the end and the game can settle on EXECUTING and never leave.
      // Nothing legitimate happens during an animation, so the whole handler stands down.
      if (gameState.interactionMode === 'EXECUTING' || gameState.interactionMode === 'MOVING') return;

      if (gameState.interactionMode === 'PLACEMENT' && selectedRosterId) {
          placeRosterUnit(pos);
          return;
      }

      if (gameState.interactionMode === 'ITEM_TARGETING' && gameState.selectedItemId) {
          useItemAt(pos);
          return;
      }

      if (gameState.interactionMode === 'TARGETING' && selectedUnit && gameState.selectedSkillId) {
          castSelectedSkill(pos);
          return;
      }

      selectOrMove(pos);
  };

  /** Deployment phase: drop the chosen plant, then advance to the next undeployed one. */
  const placeRosterUnit = (pos: Position) => {
      const placementTile = getTileAt(pos, board);
      const isValid = !!placementTile && !!placementTile.isDeployZone
          && terrainDefs[placementTile.terrain]?.isWalkable;

      if (!isValid) {
          addDamageEvent(pos.x, pos.y, 0, 'BLOCKED');
          return;
      }

      const existing = getUnitAt(pos, units);
      // Clicking a plant on its own tile picks it back up.
      if (existing && existing.id === selectedRosterId) {
          setUnits(prev => prev.map(u => u.id === selectedRosterId ? { ...u, position: { x: -1, y: -1 } } : u));
          return;
      }
      if (existing) {
          addDamageEvent(pos.x, pos.y, 0, 'BLOCKED');
          return;
      }
      setUnits(prev => prev.map(u => u.id === selectedRosterId ? { ...u, position: pos } : u));

      const plants = units.filter(u => u.type === UnitType.PLANT);
      const currentIdx = plants.findIndex(u => u.id === selectedRosterId);
      const nextForward = plants.find((u, i) => i > currentIdx && u.position.x === -1);
      const nextId = nextForward?.id ?? plants.find((u, i) => i < currentIdx && u.position.x === -1)?.id;
      if (nextId) setSelectedRosterId(nextId);
  };

  /**
   * Spend an item on a tile. The order matters: validate, then consume, then resolve — the
   * item is spent unconditionally once resolution starts, so a target that cannot take it
   * has to be rejected first or the Coin is gone for nothing.
   */
  const useItemAt = (pos: Position) => {
      const item = itemDefs.find(i => i.id === gameState.selectedItemId);
      if (!item) return;

      const ctx = { units, board, terrainDefs };
      if (itemTargetInvalid(item, pos, ctx)) {
          addDamageEvent(pos.x, pos.y, 0, 'BLOCKED');
          return;
      }

      sfx('ui-item');

      // Using an item costs nothing here — it was already paid for in Coin at the shop.
      // The consumption must live INSIDE the snapshot handed to the engine: a separate
      // setGameState was overwritten when the turn resolved, so used items came back.
      const stateAfterUse = {
          ...gameState,
          inventory: gameState.inventory.filter(id => id !== item.id),
          interactionMode: 'IDLE' as const,
          selectedItemId: null,
      };
      setGameState(stateAfterUse);

      // A trap writes a tile rather than producing actions — see planItemActions.
      if (item.effect === 'TRAP') {
          setBoard(prev => prev.map(t =>
              t.x === pos.x && t.y === pos.y
                  ? { ...t, trap: { damage: item.damage, imgUrl: item.imgUrl } }
                  : t));
          return;
      }

      executeTurnActions(planItemActions(item, pos, ctx, selectedUnit), stateAfterUse);
  };

  /** Fire the selected skill at a tile, if that tile is a legal target for it. */
  const castSelectedSkill = (pos: Position) => {
      if (!selectedUnit) return;
      const isValid = validSkillTargetTiles.some(t => t.x === pos.x && t.y === pos.y);
      if (!isValid) {
          setGameState(prev => ({ ...prev, interactionMode: 'IDLE', selectedSkillId: null }));
          return;
      }

      const baseSkill = skillsFor(selectedUnit).find(s => s.id === gameState.selectedSkillId)!;
      // Fused materials graft their effect onto whatever the hero throws. Folding them
      // into the skill's own effect list means the whole resolution path picks them up
      // unchanged — push, freeze and the rest already know how to run.
      const skill = withFusionEffects(baseSkill, selectedUnit);

      // Ultimates are the ones that burn a Sun charge, so that flag is also the
      // line between "a move" and "a moment" as far as the mix is concerned.
      sfx(skill.requiresSunCharge ? 'skill-ult' : 'skill-cast');

      if (skill.requiresSunCharge) {
          setUnits(prev => prev.map(u => u.id === selectedUnit.id ? { ...u, sunCharge: (u.sunCharge || 0) - 1 } : u));
      }

      // The engine treats the state it is handed as a spend-only snapshot and folds
      // income back in from GAIN_SUN actions. So the cost has to be inside that
      // snapshot — a separate setGameState here would be overwritten when the turn
      // resolves. A fused hero can pay less for its signature move.
      const discount = getFusionEffectValue(selectedUnit, 'SKILL_DISCOUNT');
      const sunCost = Math.max(0, (skill.sunCost || 0) - discount);
      if (sunCost > gameState.sun) return;
      const stateAfterSpend = { ...gameState, sun: gameState.sun - sunCost };

      // Resonance is derived from the SQUAD THAT WAS PICKED, never from who is still standing —
      // see the note on resonanceOf. Computed at the call site so the resolver stays pure and
      // knows nothing about GameState. `activeResonance` adds the one exception the pick
      // cannot know about: a SEVERED hero suspends the bonus while the theft lasts.
      const resonance = activeResonance(gameState.heroElements, SQUAD_SIZE, units);
      const actions = planSkillActions(selectedUnit, skill, pos, { units, board, terrainDefs, resonance });
      executeTurnActions(actions, stateAfterSpend);
  };

  /** No mode active: the click either selects a unit, walks the selected one, or clears. */
  const selectOrMove = (pos: Position) => {
      // Solid, not present. Clicking the sand must not open the boss's stat card — the burrow
      // rule is worth nothing if the sidebar reads its exact HP out for free.
      const unit = getSolidUnitAt(pos, units);
      if (unit) {
          if (unit.id === gameState.selectedUnitId) {
              setGameState(prev => ({ ...prev, selectedUnitId: null, selectedTile: pos }));
          } else {
              setGameState(prev => ({
                  ...prev,
                  selectedUnitId: unit.id,
                  selectedTile: pos,
                  interactionMode: 'IDLE',
                  selectedSkillId: null,
              }));
          }
          return;
      }

      if (gameState.selectedUnitId && !gameState.selectedSkillId) {
          const u = units.find(x => x.id === gameState.selectedUnitId);
          if (u && !u.isEnemy && !u.hasMoved) {
              const moves = getValidMoves(u, units, board, terrainDefs);
              if (moves.some(m => m.x === pos.x && m.y === pos.y)) {
                  executeTurnActions([{ type: 'UNIT_MOVE', unitId: u.id, path: [pos] }], gameState);
                  return;
              }
          }
      }

      setGameState(prev => ({ ...prev, selectedUnitId: null, selectedTile: pos, selectedSkillId: null, interactionMode: 'IDLE' }));
  };

  const handleActionSelect = (skillId: string) => {
      setGameState(prev => ({ 
          ...prev, 
          selectedSkillId: skillId, 
          interactionMode: 'TARGETING' 
      }));
  };

  const handleEndTurn = () => {
      // A second End Turn while the previous one is still animating would run processTurn
      // against stale state and the two resolutions would overwrite each other — the turn
      // counter simply stops advancing. Easy to hit by double-clicking.
      if (gameState.interactionMode === 'EXECUTING') return;

      const result = processTurn(units, board, gameState, unitDefs, terrainDefs);
      // A new turn starts with nothing selected. Carrying last turn's hero over means the
      // player opens the turn already holding a tool they did not pick, with move highlights
      // painted from the old board — and it silently skips the tutorial's "choose her" beat,
      // which now reads the selection instead of counting the click.
      executeTurnActions(result.actions, {
          ...result.finalGameState,
          selectedUnitId: null,
          selectedTile: null,
      });
  };

  const handleLevelComplete = () => {
      if (gameState.currentLevelId) {
          completeLevel(gameState.currentLevelId);
          setGameState(prev => ({ ...prev, screen: 'MAP' }));
      }
  };

  /**
   * Applies one option's effects in order. Every branch here changes something that survives
   * into the next battle — see the header of data/events.ts for why the old Sun/heal/stat
   * effects were removed rather than fixed.
   */
  const handleEventResolve = (effects: EventEffect[]) => {
      effects.forEach(effect => {
          switch (effect.type) {
              case 'GAIN_COIN':
                  setGameState(prev => ({ ...prev, coins: prev.coins + (effect.value || 0) }));
                  break;

              case 'LOSE_COIN':
                  setGameState(prev => ({ ...prev, coins: Math.max(0, prev.coins - (effect.value || 0)) }));
                  break;

              case 'GAIN_BRAIN':
                  // Never silently wasted: a full budget pays out in Coin instead, and the
                  // option's outcome chips say so up front.
                  setGameState(prev => prev.brainsRemaining >= prev.brainsMax
                      ? { ...prev, coins: prev.coins + 100 }
                      : { ...prev, brainsRemaining: prev.brainsRemaining + (effect.value || 1) });
                  break;

              case 'LOSE_BRAIN':
                  setGameState(prev => ({
                      ...prev,
                      brainsRemaining: Math.max(0, prev.brainsRemaining - (effect.value || 1)),
                  }));
                  break;

              case 'HEAL_SQUAD_FULL':
                  // The Campfire's "Sleep It Off". Since the shop's repair service was
                  // removed, this and a fusion are the only ways a damaged squad gets back
                  // to full — which is what makes reaching a Campfire matter.
                  setUnits(prev => prev.map(u => u.type === UnitType.PLANT ? { ...u, hp: u.maxHp } : u));
                  // The bench sleeps too. This is the counterweight to deployment attrition:
                  // a seedling worn below full cannot be grafted, and a night by the fire is
                  // what buys that option back — so "rest now or fuse later" is a real
                  // question instead of a door that quietly closed several boards ago.
                  setGameState(prev => ({ ...prev, bench: prev.bench.map(b => ({ ...b, hp: undefined })) }));
                  break;

              case 'GAIN_BENCH_PLANT': {
                  const pool = unlocks?.materials?.length ? unlocks.materials : STARTING_MATERIALS;
                  // Some events promise a named plant ("you win the Wall-nut"); the rest roll.
                  const pick = effect.materialId ?? pool[Math.floor(Math.random() * pool.length)];
                  // addBenchPlant returns false when the bench is full; refund so the choice
                  // is never a dead click.
                  if (!addBenchPlant(pick)) {
                      setGameState(prev => ({ ...prev, coins: prev.coins + 30 }));
                  }
                  break;
              }

              case 'LOSE_BENCH_PLANT':
                  if (gameState.bench.length > 0) removeBenchPlant(gameState.bench[0].id);
                  break;

              case 'NEXT_BATTLE_MOD':
                  // Merged, not replaced: two events before one battle both count.
                  setGameState(prev => {
                      const m = effect.mods || {};
                      const cur = prev.nextBattleMods || {};
                      return {
                          ...prev,
                          nextBattleMods: {
                              turns: (cur.turns || 0) + (m.turns || 0),
                              enemies: (cur.enemies || 0) + (m.enemies || 0),
                              brainlessHouses: (cur.brainlessHouses || 0) + (m.brainlessHouses || 0),
                              coinOnWin: (cur.coinOnWin || 0) + (m.coinOnWin || 0),
                          },
                      };
                  });
                  break;

              case 'GAIN_ITEM': {
                  const potential = itemDefs.filter(i => !gameState.inventory.includes(i.id));
                  if (potential.length > 0) {
                      const item = potential[Math.floor(Math.random() * potential.length)];
                      setGameState(prev => ({ ...prev, inventory: [...prev.inventory, item.id] }));
                  } else {
                      // Owns everything already — pay out rather than hand over nothing.
                      setGameState(prev => ({ ...prev, coins: prev.coins + 60 }));
                  }
                  break;
              }

              // REVIVE_HERO is resolved inside EventScreen, which has to ask *which* hero.
              case 'REVIVE_HERO':
              case 'NOTHING':
              default:
                  break;
          }
      });

      if (gameState.currentLevelId) completeLevel(gameState.currentLevelId);
      setGameState(prev => ({ ...prev, screen: 'MAP' }));
  };

  const handleStartBattle = () => {
      setGameState(prev => ({ 
          ...prev, 
          interactionMode: 'IDLE',
          turn: 1
      }));
      const newUnits = performTurnZeroAI(units, board, !!gameState.scriptedBattleId);
      setUnits(newUnits);
      // Chrona's rewind: fresh charge, and the turn-1 photo. Queued AFTER setUnits, so
      // the no-op reducers inside read the deployed board, not the placement roster.
      beginTurnRewindWindow();
  };

  // --- DEV TRAVEL (debug) ---
  // Reaching a Shop or a Campfire normally means winning three battles first, which makes
  // testing anything past the first node painfully slow.
  const toggleDebugMode = () => setGameState(prev => ({ ...prev, debugMode: !prev.debugMode }));

  /** Enough Coin to actually exercise the shop. Brains are deliberately NOT topped up —
   *  handing them out free would make the buy-back untestable. */
  const debugGrant = () => setGameState(prev => ({ ...prev, coins: prev.coins + 500 }));

  /** Burn a brain so the buy-back panel becomes reachable without losing a real map. */
  const debugLoseBrain = () => setGameState(prev => ({
      ...prev,
      brainsRemaining: Math.max(0, prev.brainsRemaining - 1),
  }));

  // --- DEV CONSOLE (F9) -------------------------------------------------------------
  // Dev-only: `import.meta.env.DEV` is statically replaced, so neither the panel nor its
  // hotkey survives a production build.
  const [showDebug, setShowDebug] = useState(false);

  /** The squad a debug jump deploys when the player has not started a run yet. */
  const debugFallbackSquad = useMemo(() => {
      const owned = (Object.keys(HERO_DEFINITIONS) as HeroId[])
          .filter(h => unlocks?.heroes.includes(h));
      return (owned.length ? owned : (Object.keys(HERO_DEFINITIONS) as HeroId[])).slice(0, SQUAD_SIZE);
  }, [unlocks]);

  /**
   * Drop straight into a fight of the chosen shape.
   *
   * It goes through the ORDINARY path — build a squad the way handleStartGame does, lay a
   * throwaway map of the requested depth, then `selectNode` — instead of assembling an
   * encounter directly. Depth is read off the map graph (layerOfNode counts node rows), and
   * mission, hazard, Sun and reward all hang off the node, so a shortcut around the map
   * would be a second, quietly different game to test against.
   */
  const debugJumpToFight = (jump: DebugJump) => {
      const squad = units.filter(u => u.isHero && u.hp > 0).map(u => u.heroId as HeroId);
      const roster = squad.length ? squad : debugFallbackSquad;
      const fresh = roster.map((heroId, idx) =>
          freshHero(heroId, `dbg-${idx}-${Date.now()}`, gameState.heroElements?.[heroId]));
      setUnits(fresh);
      registerSquad(roster, gameState.heroElements ?? {});

      const { nodes, target } = buildDebugMap(jump);
      setMapNodes(nodes);
      setShowDebug(false);
      setGameState(prev => ({
          ...prev,
          screen: 'MAP',
          sun: 0,
          coins: Math.max(prev.coins, balancedGlobal('global.COIN_ON_RUN_START')),
          currentWorld: jump.world,
          scriptedBattleId: null,
      }));
      // After the state above lands, so setupCombat reads the map it is meant to.
      setTimeout(() => selectNode(target, undefined, true), 0);
  };

  /**
   * COMBAT HOTKEYS. The keycaps were drawn on the buttons long before anything listened
   * for them, so every label was a lie. Order matches the `['Q','W','E']` labels ActionPanel
   * prints on the skill list.
   *
   * The gating deliberately mirrors ActionPanel's `isDisabled`: a hotkey must never reach a
   * skill the button itself refuses, or the keyboard becomes a way to cheat the rules.
   */
  const SKILL_HOTKEYS = ['q', 'w', 'e'];

  /**
   * The `data-tut` key the tutorial overlay currently has a hole over, or undefined when it
   * is not holding the player's hand. Read by the keyboard handler, which is declared above
   * the step derivation and so cannot close over it directly.
   */
  const tutFocusRef = useRef<string | undefined>(undefined);

  /**
   * Two slices of UI state the tutorial overlay has to see, lifted out of the components
   * that own them. Both are the observable result of a step off the battlefield: arming
   * the revive opens a hero picker, and the fusion bench is three choices deep before its
   * confirm button means anything.
   */
  const [eventPicking, setEventPicking] = useState(false);
  const [fusionSel, setFusionSel] = useState<{ heroId: HeroId | null; materialId: MaterialId | null }>(
      { heroId: null, materialId: null });

  // Both flags are per-screen facts, so a screen change wipes them. eventPicking went TRUE
  // at board 5's revive and nothing ever set it back — so the campfire's "pick a rest
  // option" step, which reads it, was born satisfied and the whole campfire script was
  // silently skipped past.
  useEffect(() => {
      setEventPicking(false);
      setFusionSel({ heroId: null, materialId: null });
  }, [gameState.screen, gameState.currentEventId, gameState.currentLevelId]);

  // The fusion bench closes itself once the bench empties: with nothing left to fuse it is
  // a dead screen, and it was physically covering the campfire's rest options — the
  // tutorial's next step pointed at a button underneath it and a real player was stuck
  // (scripted clicks bypass z-order, which is why the driver sailed through the hole).
  useEffect(() => {
      if (showFusionPanel && gameState.bench.length === 0) {
          const id = window.setTimeout(() => closeFusionPanel(), 450);
          return () => window.clearTimeout(id);
      }
  }, [showFusionPanel, gameState.bench.length]);

  useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
          if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
              e.preventDefault();
              toggleDebugMode();
              return;
          }

          // While the overlay has a hole, that hole is the ONLY way in. Hotkeys used to walk
          // straight past it — Space ended the turn from under a step asking for an attack,
          // W aimed a skill the step had not introduced — which is exactly the wandering the
          // shade exists to prevent. Escape is blocked with the rest: with steps now read off
          // the board there is nothing to get unstuck from.
          if (tutFocusRef.current) return;

          // Never steal keys from a text field (the Admin screen is full of them) or from
          // a modifier combo the browser owns.
          const target = e.target as HTMLElement | null;
          if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
          if (e.ctrlKey || e.altKey || e.metaKey) return;

          // F9 is the one key that works on EVERY screen: the console's whole job is
          // reaching a state you are not currently in. Checked before the combat gate below.
          if (import.meta.env.DEV && e.key === 'F9') {
              e.preventDefault();
              setShowDebug(v => !v);
              return;
          }
          if (showDebug) return;

          // Modals own the keyboard while they are up.
          if (gameState.screen !== 'COMBAT') return;
          if (gameState.showAdmin || showQuitConfirm || showFusionPanel || showSquadViewer) return;

          const key = e.key.toLowerCase();

          if (key === 'escape') {
              e.preventDefault();
              setGameState(prev => ({
                  ...prev,
                  interactionMode: prev.interactionMode === 'TARGETING' || prev.interactionMode === 'ITEM_TARGETING' ? 'IDLE' : prev.interactionMode,
                  selectedSkillId: null,
                  selectedItemId: null,
                  // A second Escape, with nothing being aimed, drops the selection entirely.
                  selectedUnitId: prev.interactionMode === 'IDLE' ? null : prev.selectedUnitId,
              }));
              return;
          }

          if (key === ' ' || e.code === 'Space') {
              e.preventDefault();
              // Placement mode ends with Start Battle, not End Turn.
              if (gameState.interactionMode === 'PLACEMENT') return;
              if (gameState.interactionMode === 'EXECUTING' || gameState.interactionMode === 'MOVING') return;
              handleEndTurn();
              return;
          }

          const slot = SKILL_HOTKEYS.indexOf(key);
          if (slot === -1) return;
          if (!selectedUnit || selectedUnit.isEnemy) return;
          if (gameState.interactionMode === 'EXECUTING' || gameState.interactionMode === 'MOVING' || gameState.interactionMode === 'PLACEMENT') return;

          // Same blocks the button honours: spent its action, disabled by status, digesting.
          if (selectedUnit.hasAttacked) return;
          if (selectedUnit.statusEffects?.includes('STUN') || selectedUnit.statusEffects?.includes('FREEZE') || selectedUnit.statusEffects?.includes('DORMANT')) return;
          if ((selectedUnit.digestingTurns || 0) > 0) return;

          const skill = skillsFor(selectedUnit)[slot];
          if (!skill) return;
          if (skill.requiresSunCharge && !((selectedUnit.sunCharge || 0) > 0)) return;
          if (selectedUnit.hasMoved && isSunProducingSkill(skill)) return;
          const netCost = Math.max(0, (skill.sunCost || 0) - getFusionEffectValue(selectedUnit, 'SKILL_DISCOUNT'));
          if (netCost > gameState.sun) return;

          e.preventDefault();
          // Pressing the same key again cancels, matching the button's click-to-toggle.
          if (gameState.selectedSkillId === skill.id && gameState.interactionMode === 'TARGETING') {
              setGameState(prev => ({ ...prev, interactionMode: 'IDLE', selectedSkillId: null }));
          } else {
              handleActionSelect(skill.id);
          }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
  }, [gameState, selectedUnit, showQuitConfirm, showFusionPanel, showSquadViewer, skillsFor, units, board]);

  /**
   * How far through the current turn's script the player is.
   *
   * Keyed on (battle, phase, turn) so a new turn always starts its own list, and derived
   * from the BOARD rather than from clicks. Counting clicks meant a click that failed to do
   * what the script assumed still advanced it — the next lesson then pointed at a control
   * that was not rendered and the overlay fell back to a hole-less shade. Reading the
   * outcome makes the script self-correcting: a step that did not happen stays up, and one
   * that happened another way (hotkey, a shove onto the target tile) clears anyway.
   */
  /**
   * Which tutorial screen the player is on, in the vocabulary TutorialStep.phase uses.
   * The camp has its own screen now, so it no longer has to be told apart from a plain event
   * by looking at the node type.
   */
  const tutNode = gameState.currentLevelId ? tutorialNode(gameState.currentLevelId) : undefined;
  const tutPhase: 'PLACEMENT' | 'COMBAT' | 'SHOP' | 'EVENT' | 'CAMPFIRE' | null =
      gameState.screen === 'COMBAT' ? (gameState.interactionMode === 'PLACEMENT' ? 'PLACEMENT' : 'COMBAT')
      : gameState.screen === 'SHOP' ? 'SHOP'
      // Both rest points speak the same phase word. A stage run's campfire is an EVENT the
      // node type identifies; the Breach's is its own screen.
      : gameState.screen === 'CAMP' ? 'CAMPFIRE'
      : gameState.screen === 'EVENT' ? (tutNode?.type === 'CAMPFIRE' ? 'CAMPFIRE' : 'EVENT')
      : null;

  // The turn only partitions a battle; off the board every step shares turn 1, and the
  // phase is what re-keys the list when the player moves between screens.
  const tutPhaseKey = `${gameState.currentLevelId}:${tutPhase}:${gameState.turn}`;
  // A note with no target is the one kind of step the board cannot report on, so its
  // dismissal is the only tutorial progress still kept in state.
  const [tutAck, setTutAck] = useState<{ key: string; done: number[] }>({ key: '', done: [] });
  const tutAcked = tutAck.key === tutPhaseKey ? tutAck.done : EMPTY_ACK;

  const tutTurnSteps = useMemo(() => {
      // Keyed on the node being part of the tutorial chain, NOT on unlocks.tutorialDone —
      // gating on that silenced the whole overlay for anyone REPLAYING the tutorial.
      if (!tutPhase) return [];
      const steps = tutorialSteps(gameState.currentLevelId);
      if (!steps.length) return [];
      // Off the board there is one turn, so the turn filter is a no-op there and the phase
      // does all the separating.
      return steps.filter(st =>
          (st.phase ?? 'COMBAT') === tutPhase
          && (tutPhase === 'PLACEMENT' || tutPhase === 'COMBAT' ? st.turn === gameState.turn : true));
  }, [tutPhase, gameState.currentLevelId, gameState.turn]);

  const tutIndex = useMemo(() => {
      const probe = {
          units,
          selectedUnitId: gameState.selectedUnitId,
          selectedSkillId: gameState.selectedSkillId,
          selectedItemId: gameState.selectedItemId,
          bench: gameState.bench,
          inventory: gameState.inventory,
          fallenHeroes: gameState.fallenHeroes,
          turnResetsUsed,
          eventPicking,
          fusionOpen: showFusionPanel,
          fusionHeroId: fusionSel.heroId,
          fusionPlantId: fusionSel.materialId,
      };

      // Scan BACKWARDS for the furthest step already done, not forwards for the first one
      // outstanding. Some steps stop being true once the next one happens — aiming a skill
      // is undone by firing it — and a forward scan would rewind onto them forever.
      let i = 0;
      for (let k = tutTurnSteps.length - 1; k >= 0; k--) {
          const done = tutAcked.includes(k)
              || stepSatisfied(tutTurnSteps[k], stepActor(tutTurnSteps, k), probe,
                  stepMaterial(tutTurnSteps, k), stepItem(tutTurnSteps, k), stepCopies(tutTurnSteps, k));
          if (done) { i = k + 1; break; }
      }

      // A step that reaches through a hero needs that hero selected. If the player dropped
      // the selection — a second click on her own tile does it — the skill button is gone
      // and there is nothing to cut a hole over. Rewind to the step that asks for her
      // instead of pointing at a control that is not on screen. The steps already cleared
      // stay cleared, so this costs one click, not the lesson.
      const st = tutTurnSteps[i];
      // ITEM tiles act through no hero, so a dropped selection cannot strand them.
      const reachesThroughHero = !!st && ((!!st.act && st.act !== 'ITEM') || /^skill-/.test(st.focus ?? ''));
      if (reachesThroughHero) {
          const actor = stepActor(tutTurnSteps, i);
          // Bench plants are found by materialId — their unit id is minted per battle.
          const unit = actor ? units.find(u => u.heroId === actor || u.materialId === actor) : null;
          if (!unit || gameState.selectedUnitId !== unit.id) {
              for (let k = i - 1; k >= 0; k--) {
                  const f = tutTurnSteps[k].focus;
                  if (f === `hero-${actor}` || f === `unit-${actor}`) return k;
              }
          }
      }
      return i;
  }, [tutTurnSteps, tutAcked, units, gameState.selectedUnitId, gameState.selectedSkillId,
      gameState.selectedItemId, gameState.bench, gameState.inventory, gameState.fallenHeroes,
      turnResetsUsed, eventPicking, showFusionPanel, fusionSel]);

  const activeTutStep = tutTurnSteps[tutIndex] ?? null;
  tutFocusRef.current = activeTutStep?.focus;

  // Keyed on the NODE, not on scriptedBattleId — that one is null everywhere except a
  // scripted fight, so the shop, the revive and the campfire all reported the number of the
  // last battle instead of their own (three screens in a row reading "2/7").
  const tutBoardIndex = TUTORIAL_CHAIN.findIndex(n => n.id === gameState.currentLevelId) + 1;

  /**
   * The note for the board and turn the player is actually on. Derived rather than stored:
   * a step counter kept in state drifts the moment a turn is retried or a battle restarts,
   * and then the tutorial narrates the wrong lesson.
   */
  const coachNote = useMemo(() => {
      // Same gate as tutTurnSteps: the scripted battle IS the signal, not tutorialDone.
      if (gameState.screen !== 'COMBAT') return null;
      const script = gameState.scriptedBattleId ? tutorialBattle(gameState.scriptedBattleId) : null;
      if (!script) return null;
      // The latest note whose turn has already arrived, so a lesson stays on screen until
      // the next one is due instead of blinking out on turns that have nothing to say.
      const due = script.steps.filter(st => st.turn <= gameState.turn);
      const step = due[due.length - 1];
      if (!step) return null;
      const index = TUTORIAL_CHAIN.findIndex(n => n.id === gameState.scriptedBattleId) + 1;
      return { note: step.note, index, total: TUTORIAL_CHAIN.length };
  }, [gameState.screen, gameState.scriptedBattleId, gameState.turn]);

  const handleQuitRun = () => {
      setShowQuitConfirm(true);
  };

  /**
   * True when the fight just won was the boss — i.e. this victory ends the run.
   *
   * A Breach corridor boss is deliberately excluded: the victory screen it triggers is the
   * end-of-run payout screen, and showing it after the first of ten fights would tell the
   * player the gauntlet was over nine bosses early.
   */
  const currentNodeIsBoss = (() => {
      const node = mapNodes.find(n => n.id === gameState.currentLevelId);
      return node?.type === 'BOSS' && node.endsRun !== false;
  })();

  const confirmQuit = () => {
      clearRunState();
      setGameState(INITIAL_GAME_STATE);
      setUnits([]);
      setMapNodes(GENERATE_MAP(unlocks.bossesBeaten.length));
      setShowQuitConfirm(false);
  };

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const isInRun = !['START_MENU', 'STAGE_SELECT', 'SQUAD_SELECT', 'TUTORIAL'].includes(gameState.screen);

  return (
    <div className="w-full h-[100dvh] bg-[#111] flex flex-col overflow-hidden select-none">

      <OrientationOverlay />

      {/* Global Settings Modal (Audio, Language, Abandon Run) */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        showFloatingTrigger={false}
        inRun={isInRun}
        onAbandonRun={confirmQuit}
      />
      <ScreenFade screen={gameState.screen} />

      {gameState.screen === 'START_MENU' && (
          <StartMenu
            onStart={startRun}
            onContinue={hasResumableRun ? continueRun : undefined}
            onTutorial={() => setGameState(prev => ({ ...prev, screen: 'TUTORIAL' }))}
            onOpenSettings={() => setShowSettingsModal(true)}
            onReplayTutorial={replayTutorial}
            onReplayIntro={() => { introWasReplay.current = true; setShowIntro(true); }}
          />
      )}

      {gameState.screen === 'TUTORIAL' && (
          <TutorialScreen
            unlocks={unlocks}
            onBack={() => setGameState(prev => ({ ...prev, screen: 'START_MENU' }))}
          />
      )}

      {/*
        The prop was never passed, so the picker fell back to its STARTING_HEROES default
        and every unlocked hero stayed behind a padlock — Maw and Frostpod included, on a
        save that already owned them. The unlock table, the boss rewards and the victory
        announcement were all working; the one screen that hands the hero to the player
        was reading a constant.
      */}
      {gameState.screen === 'STAGE_SELECT' && (
          <StageSelectScreen
            unlocks={unlocks}
            onBack={() => setGameState(prev => ({ ...prev, screen: 'START_MENU' }))}
            onOpenSettings={() => setShowSettingsModal(true)}
            onSelectAct={bossId => setGameState(prev => ({
                ...prev, targetBossId: bossId, screen: 'SQUAD_SELECT',
            }))}
          />
      )}

      {gameState.screen === 'SQUAD_SELECT' && (
          <SquadSelectScreen
            unlockedHeroes={unlocks?.heroes}
            /* Derived from the bosses on the save, not stored: an element belongs to the
               stage-ending boss that pays it, so beating that boss IS owning it. */
            unlockedElements={elementsUnlocked(unlocks?.bossesBeaten ?? [])}
            onStartGame={handleStartGame}
            onBack={() => setGameState(prev => ({ ...prev, screen: 'STAGE_SELECT' }))}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
      )}

      {/*
        FUSION IS A REST-POINT ACTION (game-wide, not just in the tutorial).
        It used to be a button parked on the map, usable at any moment, which meant a plant
        bought at the shop was fused at the shop — the purchase and the decision collapsed
        into one click. Gating it to the Campfire turns a bench plant into something you
        have to carry, and makes reaching the next rest point matter.
        The entry point lives INSIDE the campfire card (EventScreen's onOpenFusion), styled
        like one of the event's own options — not a floating corner button over the screen.
      */}

      {gameState.screen === 'MAP' && (
          <MapScreen 
            nodes={mapNodes}
            onSelectNode={handleSelectNode}
            // The opening dialogue names five map symbols in a row, so the legend is pinned
            // open for the whole of it — each icon can be looked at as it is described.
            forceLegend={showMapIntro}
            highlightLegend={mapIntroHighlight}
            onOpenCodex={() => setShowCodex(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            debugMode={gameState.debugMode}
            onToggleDebug={toggleDebugMode}
            onDebugGrant={debugGrant}
            onDebugLoseBrain={debugLoseBrain}
            units={units} 
            sun={gameState.sun} 
            unitDefs={unitDefs}
            onUpgradeUnit={(id, stat) => {
                const u = units.find(unit => unit.id === id);
                if (!u) return;
                const def = unitDefs[u.class];
                let cost = 0;
                let changes = {};
                
                if (stat === 'HP') { cost = def.upgradeCosts.hp; changes = { maxHp: u.maxHp + 1, hp: u.hp + 1 }; }
                if (stat === 'DMG') { cost = def.upgradeCosts.dmg; changes = { damage: u.damage + 1 }; }
                
                if (gameState.sun >= cost) {
                    setGameState(prev => ({ ...prev, sun: prev.sun - cost }));
                    setUnits(prev => prev.map(unit => unit.id === id ? { ...unit, ...changes } : unit));
                    addDamageEvent(0, 0, cost, 'SUN'); 
                }
            }}
            onEvolveUnit={(id, targetClass) => {
                const u = units.find(unit => unit.id === id);
                if (!u) return;
                const def = unitDefs[u.class];
                const cost = def.evolutionCost || 999;
                
                if (gameState.sun >= cost) {
                    const newDef = unitDefs[targetClass];
                    setGameState(prev => ({ ...prev, sun: prev.sun - cost }));
                    setUnits(prev => prev.map(unit => unit.id === id ? { 
                        ...unit, 
                        class: targetClass,
                        name: newDef.name,
                        maxHp: newDef.maxHp,
                        hp: newDef.maxHp, 
                        damage: newDef.damage,
                        moveRange: newDef.moveRange,
                        imgUrl: newDef.imgUrl,
                        immunities: newDef.immunities,
                        movementType: newDef.movementType
                    } : unit));
                }
            }}
          />
      )}

      {gameState.screen === 'SHOP' && (
          <ShopScreen
             sun={gameState.sun}
             coins={gameState.coins}
             items={gameState.shopItemOffers
                 ? itemDefs.filter(i => gameState.shopItemOffers!.includes(i.id))
                 : itemDefs}
             units={units}
             offers={gameState.shopOffers}
             rerollsUsed={gameState.shopRerolls}
             bench={gameState.bench}
             squad={fusableHeroes(units)}
             onBuyMaterial={handleBuyMaterial}
             onReroll={handleReroll}
             brainsRemaining={gameState.brainsRemaining}
             brainsMax={gameState.brainsMax}
             brainCost={brainCost()}
             onBuyBrain={buyBrain}
             onBuyItem={(item) => {
                 // Items are bought with Coin now — Sun never leaves the battlefield.
                 // One card, one sale, exactly like the plants: an item that stayed on the
                 // shelf could be bought until the purse ran dry, which made the "worst
                 // shopping trip" the budget assertion checks a fiction — a player could
                 // spend the revive fund on eight Potato Mines.
                 setGameState(prev => ({
                     ...prev,
                     coins: prev.coins - item.coinCost,
                     inventory: [...prev.inventory, item.id],
                     shopItemOffers: (prev.shopItemOffers ?? []).filter(id => id !== item.id),
                 }));
             }}
             onLeave={handleLevelComplete}
          />
      )}

      {/*
        AN ACT'S UPGRADE, spent on the map rather than on the victory screen.

        The victory screen is a report — it tells the player what just happened and is
        dismissed by a button. A choice that changes the squad for the rest of the run does not
        belong inside something people click through. On the map the fight is over, the state
        is saved (MAP is a safe screen for runPersistence), and the picker can reopen for as
        many picks as are owed without fighting the report for the same space.
      */}
      {/*
        THE ACT CUT, in front of everything else — including the upgrade picker, which is the
        first thing waiting on the other side of it. Order matters: the reward for act one
        should land in act two's briefing room, not over the top of it.
      */}
      {gameState.actIntro && (
          <ActIntro
             boss={gameState.actIntro}
             onContinue={() => setGameState(prev => ({ ...prev, actIntro: undefined }))}
          />
      )}

      {gameState.screen === 'MAP' && !gameState.actIntro && (gameState.upgradePicks ?? 0) > 0 && (
          <UpgradePicker
             squad={fusableHeroes(units)}
             picks={gameState.upgradePicks ?? 0}
             onPick={(heroId, upgradeId) => {
                 // On the field or waiting on a revive — the same two homes a fusion has.
                 const onField = units.some(u => u.heroId === heroId);
                 if (onField) {
                     setUnits(prev => prev.map(u => u.heroId === heroId ? applyUpgrade(u, upgradeId) : u));
                 } else {
                     upgradeQueuedHero(heroId, upgradeId);
                 }
                 setGameState(prev => ({ ...prev, upgradePicks: Math.max(0, (prev.upgradePicks ?? 0) - 1) }));
             }}
          />
      )}

      {gameState.screen === 'CAMP' && (
          <CampScreen
             coins={gameState.coins}
             units={units}
             bench={gameState.bench}
             fallenHeroes={gameState.fallenHeroes}
             items={(gameState.shopItemOffers ?? []).map(id => itemDefs.find(i => i.id === id)).filter(Boolean) as ItemDefinition[]}
             gear={gameState.shopOffers}
             canFuseHere={gameState.bench.length > 0 && fusableHeroes(units).length > 0}
             onHeal={unitId => {
                 const target = units.find(u => u.id === unitId);
                 if (!target) return;
                 const cost = (target.maxHp - target.hp) * COIN_HEAL_PER_HP;
                 if (cost <= 0 || gameState.coins < cost) return;
                 setUnits(prev => prev.map(u => u.id === unitId ? { ...u, hp: u.maxHp } : u));
                 setGameState(prev => ({ ...prev, coins: prev.coins - cost }));
             }}
             onRepairSeedling={benchId => {
                 if (gameState.coins < COIN_REPAIR_SEEDLING) return;
                 setGameState(prev => ({
                     ...prev,
                     coins: prev.coins - COIN_REPAIR_SEEDLING,
                     // `undefined` is the bench's word for "never deployed, still whole" —
                     // the same state a fusion demands (types.ts BenchPlant.hp).
                     bench: prev.bench.map(b => b.id === benchId ? { ...b, hp: undefined } : b),
                 }));
             }}
             onRevive={reviveHeroPaid}
             onBuyItem={item => {
                 if (gameState.coins < item.coinCost) return;
                 setGameState(prev => ({
                     ...prev,
                     coins: prev.coins - item.coinCost,
                     inventory: [...prev.inventory, item.id],
                     // One card, one sale — the same rule the shop shelf follows.
                     shopItemOffers: (prev.shopItemOffers ?? []).filter(id => id !== item.id),
                 }));
             }}
             /* Same handler the shop uses: one card, one sale, straight to the bench. */
             onBuyGear={handleBuyMaterial}
             onOpenFusion={() => setShowFusionPanel(true)}
             onLeave={handleLevelComplete}
          />
      )}

      {gameState.screen === 'EVENT' && (
          <EventScreen
            event={GAME_EVENTS.find(e => e.id === gameState.currentEventId) || GAME_EVENTS[0]}
            sun={gameState.sun}
            coins={gameState.coins}
            units={units}
            benchCount={gameState.bench.length}
            fallenHeroes={gameState.fallenHeroes}
            onReviveHero={reviveHeroPaid}
            onPickingChange={setEventPicking}
            onResolve={handleEventResolve}
            onOpenFusion={gameState.currentEventId === 'rest_site' ? () => setShowFusionPanel(true) : undefined}
          />
      )}

      {gameState.screen === 'VICTORY' && (
          <VictoryScreen
             rewards={previewRewards()}
             unlocks={previewUnlocks()}
             // Between nodes this is what the run WOULD be worth — the level is paid by the
             // result of the whole run, so showing it early is the only way the player can
             // watch it grow instead of being handed a number at the end.
             payout={{ ...runPayoutPreview(currentNodeIsBoss), pending: !currentNodeIsBoss }}
             // The ledger is shown only where it can carry a story: a boss fight. Ordinary
             // 3-4 turn battles would print a table of ones and teach nothing.
             bossStats={gameState.mission?.objective === 'SLAY_BOSS' ? gameState.battleStats : undefined}
             // The Blightlord's win routes through the epilogue first — AFTER the report and
             // payout, because the story is the last word, not a gate in front of the loot.
             onContinue={() => {
                 const node = mapNodes.find(n => n.id === gameState.currentLevelId);
                 if (node?.bossId === 'BLIGHTLORD' && outroReady) setShowOutro(true);
                 else handleLevelComplete();
             }}
          />
      )}

      {gameState.screen === 'GAME_OVER' && (
          // Not a death screen — a REWIND. Chrona promised it in the boss dialogue ("khi
          // thua, tôi sẽ NHẢY"): losing hands the timeline back, it does not end the story.
          // Cyan/temporal styling instead of blood-red, and the button is the jump itself.
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-pixel text-white">
              <p className="text-cyan-400 mb-3 uppercase tracking-widest animate-pulse">{t('TICK... TICK...')}</p>
              <h1 className="text-5xl text-cyan-300 mb-4 font-bold uppercase tracking-widest drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]">{t('Timeline Lost')}</h1>
              <p className="text-gray-400 mb-2 uppercase tracking-widest">{t('The Zombies ate your brains...')}</p>
              <p className="text-gray-300 mb-6 tracking-widest">{t('Chrona: "I still hold a copy of this timeline. Jump with me."')}</p>

              {/* Losing pays too, and this is the only place that can prove it. Without a
                  readout here the promise in DESIGN.md section 7 — that a deeper run always
                  moves the save forward — is invisible exactly when it matters most. */}
              {lostRunPayout && (
                  <div className="w-full max-w-sm mb-8">
                      <LevelBar {...lostRunPayout} />
                  </div>
              )}
              <button onClick={() => setGameState(INITIAL_GAME_STATE)} className="px-8 py-4 bg-gray-900 border border-cyan-400 text-cyan-300 hover:bg-cyan-300 hover:text-black uppercase tracking-widest font-bold transition-colors">
                  {t('Rewind Time')}
              </button>
          </div>
      )}

      {gameState.screen === 'COMBAT' && (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0d0e11]">
            <HUD 
                gameState={gameState} 
                itemDefs={itemDefs}
                onEndTurn={handleEndTurn} 
                onToggleAdmin={() => setGameState(prev => ({ ...prev, showAdmin: !prev.showAdmin }))}
                onOpenSettings={() => setShowSettingsModal(true)}
                onSelectItem={(id) => setGameState(prev => ({ 
                    ...prev, 
                    selectedItemId: prev.selectedItemId === id ? null : id, 
                    interactionMode: prev.selectedItemId === id ? 'IDLE' : 'ITEM_TARGETING' 
                }))}
                onOpenSquad={() => setShowSquadViewer(true)}
                onQuitRun={handleQuitRun}
                speed={speed}
                onToggleSpeed={() => setSpeed(speed > 1 ? 1 : FAST_SPEED)}
                onSkipAnimation={skipAnimation}
            />
            
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex items-center justify-center relative p-4 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                    <Board 
                        boardData={board}
                        units={units}
                        selectedUnitId={gameState.selectedUnitId}
                        onTileClick={handleTileClick}
                        onTileHover={setHoveredTile}
                        hoveredTile={hoveredTile}
                        attackPath={attackPath}
                        validMoveTiles={validMoveTiles}
                        validTargetTiles={validSkillTargetTiles}
                        threatenedTiles={threatenedTiles}
                        threatMarks={threatMarks}
                        hazardTiles={gameState.hazard?.tiles || []}
                        hazardLabel={gameState.hazard?.description || ''}
                        missionTiles={missionMarkers(gameState.mission)}
                        upcomingSpawns={gameState.enemySpawnQueue}
                        damageEvents={gameState.damageEvents}
                        shake={gameState.shake}
                        terrainDefs={terrainDefs}
                        projectiles={projectiles}
                        effects={effects}
                        skillRangeTiles={skillGeometryTiles}
                        itemAoeTiles={itemAoeTiles}
                        previewPushDirection={previewPushDirection}
                        previewPushDistance={previewPushDistance}
                        interactionMode={gameState.interactionMode}
                        selectedRosterUnit={selectedRosterUnit}
                    />
                </div>
                
                <ActionPanel 
                    selectedUnit={selectedUnit}
                    selectedTile={selectedTileData}
                    interactionMode={gameState.interactionMode}
                    selectedSkillId={gameState.selectedSkillId}
                    terrainDefs={terrainDefs}
                    skillDefs={heroSkillDefs}
                    extraSkills={skillsFor(selectedUnit)}
                    currentSun={gameState.sun}
                    onActionSelect={handleActionSelect}
                    onCancelAction={() => setGameState(prev => ({ ...prev, interactionMode: 'IDLE', selectedSkillId: null, selectedItemId: null }))}
                    onEndTurn={handleEndTurn}
                    onWait={() => {
                        if (selectedUnit) {
                            setUnits(prev => prev.map(u => u.id === selectedUnit.id ? { ...u, hasAttacked: true, hasMoved: true } : u));
                            setGameState(prev => ({ ...prev, selectedUnitId: null }));
                        }
                    }}
                    onUndoMove={() => {
                        if (selectedUnit && selectedUnit.prevPosition) {
                            setUnits(prev => prev.map(u => u.id === selectedUnit.id ? { ...u, position: u.prevPosition!, hasMoved: false, prevPosition: undefined } : u));
                        }
                    }}
                    onStartBattle={handleStartBattle}
                    /* The SQUAD, not "everything on my side of the board".
                       The deployment panel counts what it is given, and the gear crate and any
                       wild plant are already standing on their tiles when placement opens — so
                       a fight that rolled one showed "4 / 3", refused to start, and listed a
                       crate as a squad member the player could try to pick up. Neither is
                       deployable and neither belongs to the run (`isBattleOnlyUnit`). */
                    rosterUnits={units.filter(u => u.type === UnitType.PLANT && !isBattleOnlyUnit(u))}
                    onSelectRosterUnit={setSelectedRosterId}
                    selectedRosterId={selectedRosterId}
                    onResetTurn={() => { if (gameState.interactionMode === 'IDLE') resetTurn(); }}
                    turnResetsLeft={1 - turnResetsUsed}
                />
            </div>

            <SquadSidebar 
                units={units} 
                selectedUnitId={gameState.selectedUnitId}
                onSelectUnit={(id) => setGameState(prev => ({ ...prev, selectedUnitId: id, selectedTile: null, interactionMode: 'IDLE' }))} 
            />
        </div>
      )}

      {showIntro && <IntroComic onDone={closeIntro} />}
      {showOutro && <OutroComic onDone={() => { setShowOutro(false); handleLevelComplete(); }} />}

      {showTutorialPrompt && (
          <TutorialPrompt
            onPlay={() => { setShowTutorialPrompt(false); replayTutorial(); }}
            onSkip={() => { setShowTutorialPrompt(false); leaveTutorial('SQUAD_SELECT'); }}
          />
      )}

      {showMapIntro && (
          <TutorialDialogue
            lines={TUTORIAL_DIALOGUES['tut_map']}
            onLineChange={line => setMapIntroHighlight(line?.highlight)}
            onDone={() => {
                seenDialogues.current.add('tut_map');
                setShowMapIntro(false);
            }}
          />
      )}

      {pendingDialogueNode && pendingDialogueNode.tutorialId && (
          <TutorialDialogue
            lines={TUTORIAL_DIALOGUES[pendingDialogueNode.tutorialId]}
            onDone={() => {
                const node = pendingDialogueNode;
                seenDialogues.current.add(node.tutorialId!);
                setPendingDialogueNode(null);
                selectNode(node, undefined, gameState.debugMode);
            }}
          />
      )}

      {showFusionPanel && (
          <FusionPanel
            // fusableHeroes, not units — a hero revived at the previous node is QUEUED, not
            // on the field, so `units` has no card for her and the campfire step naming her
            // pointed at nothing. handleFuse and the shop's status column were both already
            // reading fusableHeroes; this mount was the one place still reading `units`.
            squad={fusableHeroes(units)}
            bench={gameState.bench}
            onFuse={handleFuse}
            knownRecipes={unlocks?.tutorialDone ? unlocks.recipes : [...(unlocks?.recipes ?? []), ...TUTORIAL_RECIPES]}
            onSelectionChange={setFusionSel}
            onClose={closeFusionPanel}
          />
      )}

      {activeTutStep && (
          <Spotlight
            focus={activeTutStep.focus}
            note={activeTutStep.note}
            index={tutBoardIndex}
            total={TUTORIAL_CHAIN.length}
            // Nothing on the board is a legal target while the board is still moving, so the
            // hole closes for the duration. Without this the next turn's first step opens a
            // hole over a hero who is mid-animation and may not be standing there yet.
            busy={gameState.interactionMode === 'EXECUTING' || gameState.interactionMode === 'MOVING'}
            onAdvance={() => setTutAck(prev => ({
                key: tutPhaseKey,
                done: [...(prev.key === tutPhaseKey ? prev.done : []), tutIndex],
            }))}
          />
      )}

      {!activeTutStep && coachNote && (
          <CoachMark
            note={coachNote.note}
            index={coachNote.index}
            total={coachNote.total}
          />
      )}

      {/* THE one exit from the tutorial, pinned top-right for the whole run. It replaces
          the per-surface skips (Spotlight footer, CoachMark X, dialogue corner button),
          each of which read as "dismiss this text" while actually ending everything.
          Mounted whenever the loaded map IS the tutorial chain, on every screen the run
          passes through — so it is one fixed thing in one fixed place, not a control
          that chases the content around. */}
      {mapNodes.some(n => n.tutorialId)
          && ['MAP', 'COMBAT', 'SHOP', 'EVENT'].includes(gameState.screen) && (
          <TutorialSkipButton
            onSkip={() => {
                // A pre-node dialogue may be mid-scene; left set, it would render its
                // overlay on top of the start menu after the state reset below.
                setPendingDialogueNode(null);
                setShowMapIntro(false);
                leaveTutorial('START_MENU');
            }}
          />
      )}

      {showSquadViewer && <SquadViewer units={units} onClose={() => setShowSquadViewer(false)} />}

      {/* Reads `unlocks`, writes nothing. Reachable from the menu and from the map, because
          "which pairings am I still missing" is a question asked both while planning a run
          and in the middle of one. */}
      {showCodex && unlocks && (
          <TutorialScreen
            overlay
            unlocks={unlocks}
            // Mid-run the question is "what pairings am I still missing", not "how does
            // pushing work" — so the map's button opens the matrix, not the manual.
            initialSection="FUSIONS"
            onBack={() => setShowCodex(false)}
          />
      )}

      {/* The old AdminScreen edited whole definition objects — names, descriptions, image
          paths — and persisting those is what silently broke the Vietnamese translation and
          later the terrain textures. BalanceScreen stores numbers only, and generates its
          rows from the data tables so it cannot drift behind them the way that one did. */}
      {import.meta.env.DEV && showDebug && (
          <DebugPanel
            unlocks={unlocks}
            squad={units.filter(u => u.isHero && u.hp > 0).map(u => u.heroId as HeroId)}
            fallbackSquad={debugFallbackSquad}
            onClose={() => setShowDebug(false)}
            onUnlockAll={unlockEverything}
            onResetProgress={resetProgress}
            onJump={debugJumpToFight}
            onGrantCoin={debugGrant}
            onGrantSun={() => setGameState(prev => ({ ...prev, sun: prev.sun + 200 }))}
            onHealSquad={reviveAllHeroes}
          />
      )}

      {gameState.showAdmin && (
          <BalanceScreen onClose={() => setGameState(prev => ({ ...prev, showAdmin: false }))} />
      )}

      {showQuitConfirm && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center font-pixel">
              <div className="bg-[#1a1c21] border-2 border-red-500 p-8 max-w-sm text-center shadow-2xl">
                  <Flag size={48} className="mx-auto text-red-500 mb-4" />
                  <h2 className="text-2xl text-white font-bold uppercase mb-2">{t('Abandon Run?')}</h2>
                  <p className="text-gray-400 text-base mb-6">{t('All progress will be lost. Are you sure?')}</p>
                  <div className="flex gap-4">
                      <button onClick={confirmQuit} className="flex-1 py-3 bg-red-900/50 hover:bg-red-800 text-white font-bold border border-red-500 uppercase">{t('Yes, Quit')}</button>
                      <button onClick={() => setShowQuitConfirm(false)} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold border border-gray-600 uppercase">{t('Cancel')}</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default App;
