
import { UnitClass, Skill } from '../types';
import { SkillFactory } from '../utils/skillFactory';

export const UNIT_SKILLS: Record<UnitClass, Skill[]> = {
  [UnitClass.PEASHOOTER]: [
    SkillFactory.createLineAttack('pea_shot', 'Pea Shot', 8, 2, 'Fires a pea in a straight line.')
  ],
  // Was two entries sharing the id 'snow_pea'. Skill lookup is by id, so the second one
  // (the one that actually froze) could never be selected. Collapsed into a single skill.
  [UnitClass.SNOW_PEA]: [
    {
        ...SkillFactory.createLineAttack('snow_pea', 'Ice Pea', 8, 2, 'Deals 2 damage and freezes the target for one turn.'),
        effects: [{ type: 'DAMAGE', value: 2 }, { type: 'STUN' }]
    }
  ],
  [UnitClass.REPEATER]: [
    SkillFactory.createLineAttack('repeater', 'Double Shot', 8, 4, 'Fires two peas.')
  ],
  [UnitClass.BLOOMERANG]: [
    SkillFactory.createLineAttack('boomerang_toss', 'Boomerang', 4, 1, 'Attacks all enemies in line.', true)
  ],
  [UnitClass.CACTUS]: [
    SkillFactory.createLineAttack('needle_shot', 'Needle Shot', 8, 2, 'Fires a piercing spike.', true),
    SkillFactory.createBuffSkill('height', 'Stretch', 'SELF', 0, 'BUFF_STAT', 1, 'Gain range bonus.') 
  ],
  [UnitClass.MELON_PULT]: [
    SkillFactory.createLobAttack('melon_lob', 'Melon Lob', 4, 4, 'Heavy lobbed damage + Push.', [{ type: 'PUSH', value: 1 }])
  ],
  [UnitClass.CABBAGE_PULT]: [
    SkillFactory.createLobAttack('cabbage_lob', 'Cabbage', 4, 2, 'Lobs a cabbage at the target.')
  ],
  [UnitClass.KERNEL_PULT]: [
    SkillFactory.createLobAttack('corn_toss', 'Corn Kernel', 4, 1, 'Lob corn over obstacles.'),
    SkillFactory.createLobAttack('butter_splat', 'Butter Splat', 4, 1, 'Immobilize enemy with butter.', [{ type: 'STUN' }])
  ],
  [UnitClass.MAGNET_SHROOM]: [
    {
        id: 'magnetic_pull', name: 'Magnetize', description: 'Pulls the target 1 tile closer.',
        rangeType: 'LINE', rangeValue: 4,
        effects: [{ type: 'PULL', value: 1 }]
    }
  ],
  [UnitClass.SUN_SHROOM]: [
    {
        id: 'synthesize_shroom', name: 'Synthesize', description: 'Absorb nutrients. Charges ability.',
        rangeType: 'SELF', rangeValue: 0,
        effects: [{ type: 'CHARGE_SUN', value: 1 }]
    },
    {
        id: 'harvest_shroom', name: 'Harvest', description: 'Gain 25 Sun. Requires Charge.',
        rangeType: 'SELF', rangeValue: 0,
        requiresSunCharge: true,
        effects: [{ type: 'RESOURCE_GAIN', value: 25, resource: 'SUN' }]
    }
  ],
  [UnitClass.SCAREDY_SHROOM]: [
    SkillFactory.createLineAttack('spore_shot', 'Spore Shot', 4, 3, 'Deals damage. Cannot use if Enemy is adjacent.')
  ],
  [UnitClass.WALLNUT]: [
    SkillFactory.createSelfHealOrShield('harden', 'Harden', 'SHIELD', 3, 'Gain 3 Armor.'),
    SkillFactory.createMeleeAttack('body_slam', 'Body Slam', 1, 'Bash and Push enemy.', [{ type: 'PUSH', value: 1 }])
  ],
  [UnitClass.TALL_NUT]: [
    SkillFactory.createSelfHealOrShield('iron_stance', 'Iron Stance', 'SHIELD', 5, 'Gain 5 Armor.'),
    {
        id: 'seismic_slam', name: 'Seismic Slam', description: 'Push all adjacent enemies.',
        rangeType: 'SELF', rangeValue: 0,
        effects: [{ type: 'PUSH', value: 1 }]
    }
  ],
  [UnitClass.ENDURIAN]: [
    SkillFactory.createSelfHealOrShield('harden', 'Harden', 'HEAL', 2, 'Gain 2 Temporary HP.')
  ],
  [UnitClass.SWEET_POTATO]: [
    {
        id: 'sweet_scent', name: 'Sweet Scent', description: 'Pulls a distant enemy towards you.',
        rangeType: 'LOB', rangeValue: 3,
        effects: [{ type: 'PULL', value: 1 }]
    }
  ],
  [UnitClass.IRON_NUT]: [
    SkillFactory.createSelfHealOrShield('iron_fortress', 'Iron Fortress', 'SHIELD', 5, 'Gain 5 Armor.'),
    SkillFactory.createMeleeAttack('shield_bash', 'Shield Bash', 3, 'Bash and push enemy.', [{ type: 'PUSH', value: 1 }])
  ],
  [UnitClass.PUMPKIN]: [
    SkillFactory.createBuffSkill('pumpkin_shell', 'Pumpkin Shell', 'ADJACENT', 1, 'SHIELD', 5, 'Add +5 Shield to target ally.')
  ],
  // No damage on purpose — the shove IS the attack. Where the target lands (water, a
  // mountain, another body) is what costs it health, not the swing itself.
  [UnitClass.CHARD_GUARD]: [
    SkillFactory.createMeleeAttack('chard_backswing', 'Backswing', 0, 'Hurls an adjacent enemy two tiles back.', [{ type: 'PUSH', value: 2 }])
  ],
  [UnitClass.CHOMPER]: [
    SkillFactory.createMeleeAttack('burrow_strike', 'Burrow Strike', 999, 'Instantly kill non-massive unit.'),
    {
        ...SkillFactory.createLineAttack('goop', 'Sticky Goop', 3, 1, 'Slow and damage enemy.', true),
        effects: [{ type: 'DAMAGE', value: 1 }, { type: 'STUN' }]
    }
  ],
  [UnitClass.BONK_CHOY]: [
    SkillFactory.createMeleeAttack('uppercut', 'Uppercut', 3, 'Heavy punch that pushes enemy.', [{ type: 'PUSH', value: 1 }])
  ],
  [UnitClass.SUNFLOWER]: [
    {
        id: 'synthesize', name: 'Synthesize', description: 'Absorb light. Charges ability.',
        rangeType: 'SELF', rangeValue: 0,
        effects: [{ type: 'CHARGE_SUN', value: 1 }]
    },
    {
        id: 'harvest', name: 'Harvest', description: 'Produce 50 Sun. Requires Charge.',
        rangeType: 'SELF', rangeValue: 0,
        requiresSunCharge: true,
        effects: [{ type: 'RESOURCE_GAIN', value: 50, resource: 'SUN' }]
    }
  ],
  [UnitClass.TWIN_SUNFLOWER]: [
    {
        id: 'synthesize_twin', name: 'Synthesize', description: 'Absorb light. Charges ability.',
        rangeType: 'SELF', rangeValue: 0,
        effects: [{ type: 'CHARGE_SUN', value: 1 }]
    },
    {
        id: 'harvest_twin', name: 'Harvest', description: 'Produce 100 Sun. Requires Charge.',
        rangeType: 'SELF', rangeValue: 0,
        requiresSunCharge: true,
        effects: [{ type: 'RESOURCE_GAIN', value: 100, resource: 'SUN' }]
    }
  ],
  [UnitClass.COFFEE_BEAN]: [
    {
        id: 'caffeine_boost', name: 'Caffeine Boost', description: 'Reset an ally\'s Move and Attack.',
        rangeType: 'ADJACENT', rangeValue: 1,
        effects: [{ type: 'REFRESH_ACTION' }]
    }
  ],
  [UnitClass.HYPNO_SHROOM]: [
    {
        id: 'hypnosis', name: 'Hypnotize', description: 'Turns an enemy around to fight for you.',
        rangeType: 'ADJACENT', rangeValue: 1,
        effects: [{ type: 'HYPNOTIZE' }]
    }
  ],
  [UnitClass.BLOVER]: [
    {
        id: 'gust', name: 'Gust', description: 'Choose a direction to blow ALL enemies.',
        rangeType: 'ADJACENT', rangeValue: 1, 
        effects: [{ type: 'GLOBAL_PUSH' }]
    }
  ],
  [UnitClass.UMBRELLA_LEAF]: [
    {
        id: 'bounce_away', name: 'Bounce Away', description: 'Push all adjacent units away.',
        rangeType: 'SELF', rangeValue: 0,
        effects: [{ type: 'PUSH', value: 1 }]
    }
  ],
  [UnitClass.TORCHWOOD]: [
    {
        id: 'ignite', name: 'Ignite', description: 'Create a Fire tile adjacent to self.',
        rangeType: 'ADJACENT', rangeValue: 1,
        effects: [{ type: 'TERRAIN_MOD' }]
    }
  ],
  
  // ZOMBIES
  // No skills at all. The crate is cargo, not a combatant — an empty list is what makes
  // the action bar honest when the player clicks it.
  [UnitClass.GEAR_CRATE]: [],

  [UnitClass.BASIC_ZOMBIE]: [ SkillFactory.createMeleeAttack('bite', 'Bite', 1, 'Chomp.') ],
  [UnitClass.CONEHEAD]: [ SkillFactory.createMeleeAttack('cone_smash', 'Cone Smash', 2, 'Heavy hit.') ],
  [UnitClass.BUCKETHEAD]: [ SkillFactory.createMeleeAttack('bucket_smash', 'Bucket Smash', 2, 'Crushing blow.') ],
  [UnitClass.NEWSPAPER_ZOMBIE]: [ SkillFactory.createMeleeAttack('paper_slap', 'Paper Slap', 1, 'Slaps.') ],
  [UnitClass.SCREEN_DOOR_ZOMBIE]: [ SkillFactory.createMeleeAttack('door_bash', 'Door Bash', 2, 'Hits with door.') ],
  [UnitClass.DIGGER_ZOMBIE]: [ SkillFactory.createMeleeAttack('pickaxe', 'Pickaxe', 2, 'Hits with pickaxe.') ],
  [UnitClass.FOOTBALL_ZOMBIE]: [ SkillFactory.createMeleeAttack('tackle', 'Tackle', 2, 'Rushes target.', [{ type: 'PUSH', value: 1 }]) ],
  [UnitClass.POLE_VAULTER]: [ SkillFactory.createDash('vault_kick', 'Vault Kick', 4, 2, false, 'Jumps over.') ],
  [UnitClass.DISCO_ZOMBIE]: [ 
    { id: 'summon_backup', name: 'Summon Backup', rangeType: 'ADJACENT', rangeValue: 1, description: 'Summons backup.', effects: [{ type: 'SPAWN' }] } 
  ],
  [UnitClass.BALLOON_ZOMBIE]: [ SkillFactory.createMeleeAttack('balloon_drop', 'Drop Kick', 2, 'Drops onto a plant from above.') ],
  [UnitClass.CATAPULT_ZOMBIE]: [ SkillFactory.createLobAttack('basketball_lob', 'Basketball', 3, 2, 'Shells a plant from three tiles away.') ],
  [UnitClass.FLAG_ZOMBIE]: [ SkillFactory.createMeleeAttack('flag_swat', 'Flag Swat', 1, 'A feeble whack with the flagpole.') ],
  [UnitClass.DISCO_ZOMBOSS]: [
    SkillFactory.createMeleeAttack('mic_swing', 'Mic Swing', 1, 'A backhand with the microphone. The damage was never the point.'),
    { id: 'call_the_dancers', name: 'Call the Dancers', rangeType: 'ADJACENT', rangeValue: 1, description: 'Four more take the floor.', effects: [{ type: 'SPAWN' }] }
  ],
  [UnitClass.CINDER_COLOSSUS]: [
    SkillFactory.createMeleeAttack('molten_backhand', 'Molten Backhand', 3, 'A swing that leaves a scorch mark on whatever it touches.')
  ],
  [UnitClass.VOLTMAW]: [
    SkillFactory.createLineAttack('arc_lash', 'Arc Lash', 8, 3, 'A bolt that jumps to everything standing beside its target, and then once more.'),
    { id: 'overload', name: 'Overload', rangeType: 'SELF', rangeValue: 0,
      description: 'Below half, every live tile on the board discharges — including the one under its own feet.',
      effects: [{ type: 'DAMAGE', value: 1 }, { type: 'STUN' }] }
  ],
  [UnitClass.YETI]: [
    SkillFactory.createMeleeAttack('frost_grip', 'Frost Grip', 0, 'Locks a plant in ice. No damage — the damage is next turn.', [{ type: 'STUN' }]),
    SkillFactory.createMeleeAttack('ice_smash', 'Ice Smash', 3, 'A club of ice. Twice as heavy on anything that cannot move.')
  ],
  [UnitClass.IRONCART]: [
    SkillFactory.createLobAttack('shell_barrage', 'Shell Barrage', 4, 3, 'Three damage where it lands, one on everything beside it.'),
    { id: 'reverse_line', name: 'Reverse Down the Line', rangeType: 'SELF', rangeValue: 0,
      description: 'Rolls back along the rail after firing. It is never where you aimed.', effects: [] }
  ],
  [UnitClass.CLOCKJAW]: [
    SkillFactory.createMeleeAttack('second_hand', 'Second Hand', 3, 'Two full swings a turn, both telegraphed. Anything with thorns answers each one separately.'),
    { id: 'winding_backwards', name: 'Winding Backwards', rangeType: 'SELF', rangeValue: 0,
      description: 'Below half it swings three times instead of twice, for one less each. The same six damage, one more decision.',
      effects: [] }
  ],
  // Three phases on one body (PLAN-boards-bosses.md, final act). Listed here so the codex and
  // the intent panel have something true to show; none of it is wired to BOSS_HOOKS yet, so it
  // currently fights with ordinary zombie AI.
  [UnitClass.BLIGHTLORD]: [
    SkillFactory.createMeleeAttack('blight_reach', 'Blight Reach', 4, 'Four damage from two tiles away. Nothing you own resists it and nothing you own stops it.'),
    { id: 'they_are_still_here', name: 'They Are Still Here', rangeType: 'SELF', rangeValue: 0,
      description: 'Phase one: every turn it calls back a boss you already put down, as a 4 HP shade carrying exactly one move from that boss.',
      effects: [] },
    { id: 'what_is_yours', name: 'What Is Yours Is Mine', rangeType: 'SELF', rangeValue: 0,
      description: 'Phase two: one hero loses their element for the turn. An all-one-element squad loses its resonance with them.',
      effects: [] },
    { id: 'walking_it_back', name: 'Walking It Back', rangeType: 'SELF', rangeValue: 0,
      description: 'Phase three: at the end of each turn it returns to where it stood and the health it had one turn ago — unless it took 6 or more damage that turn.',
      effects: [] }
  ],
  [UnitClass.ARMADA]: [
    SkillFactory.createLobAttack('bomb_drop', 'Bomb Drop', 2, 2, 'Two damage on the tile and on all four beside it. Coming from above, nothing is behind anything.'),
    { id: 'landing_party', name: 'Landing Party', rangeType: 'LOB', rangeValue: 4,
      description: 'Two crews touch down between your line and the house it is guarding.',
      effects: [{ type: 'SPAWN' }] },
    SkillFactory.createMeleeAttack('wreck_salvo', 'Wreck Salvo', 4, 'Grounded, it stops flying and starts hurting: four damage, one tile at a time.')
  ],
  [UnitClass.SANDREAVER]: [
    SkillFactory.createMeleeAttack('eruption', 'Eruption', 4,
      'Comes up under your formation and hits all four tiles around it. Four separate swings — anything with thorns answers every one.',
      [{ type: 'PUSH', value: 1 }]),
    SkillFactory.createMeleeAttack('drag_under', 'Drag Under', 0,
      'Pulls a hero into the sand. No damage — it takes the turn they needed to step out of the ring.',
      [{ type: 'STUN' }])
  ],
  [UnitClass.GARGANTUAR]: [
    SkillFactory.createMeleeAttack('telephone_smash', 'Telephone Smash', 5, 'Massive damage.'),
    { id: 'imp_toss', name: 'Throw Imp', rangeType: 'LOB', rangeValue: 4, description: 'Throws Imp.', effects: [{ type: 'SPAWN' }] }
  ],
  [UnitClass.IMP]: [ SkillFactory.createMeleeAttack('bite', 'Bite', 1, 'Small bite.') ],
  [UnitClass.ROCK]: [],
  [UnitClass.GRAVE]: [],
};
