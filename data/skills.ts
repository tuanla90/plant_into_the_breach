
import { UnitClass, Skill } from '../types';
import { SkillFactory } from '../utils/skillFactory';

export const UNIT_SKILLS: Record<UnitClass, Skill[]> = {
  [UnitClass.SEED_GUN]: [
    SkillFactory.createLineAttack('pea_shot', 'Seed Shot', 8, 2, 'Fires a seed in a straight line.')
  ],
  // Bench Rotor Wing — the seedling body of MAT_CATTAIL. A plain homing dart, nothing fancy:
  // the drone tricks belong to Reedwing, the hero grown from it.
  [UnitClass.ROTOR_WING]: [
    SkillFactory.createLineAttack('tail_dart', 'Rotor Dart', 4, 2, 'Fires a spiked dart.')
  ],
  [UnitClass.CORN_MORTAR]: [
    SkillFactory.createLobAttack('corn_toss', 'Corn Kernel', 4, 1, 'Lob corn over obstacles.'),
    SkillFactory.createLobAttack('nova_shell', 'Nova Shell', 4, 1, 'A concussive shell: immobilizes the target.', [{ type: 'STUN' }])
  ],
  [UnitClass.ARMOR_PLATE]: [
    // Shields are LAYERS (PLAN-hero-zephyr §6.0): the value only says "this grants one".
    SkillFactory.createSelfHealOrShield('harden', 'Harden', 'SHIELD', 1, 'Raise a shell layer — the next hit is blocked in full.'),
    SkillFactory.createMeleeAttack('body_slam', 'Body Slam', 1, 'Bash and Push enemy.', [{ type: 'PUSH', value: 1 }])
  ],
  [UnitClass.SPIKE_ARMOR]: [
    SkillFactory.createSelfHealOrShield('harden', 'Harden', 'HEAL', 2, 'Gain 2 Temporary HP.')
  ],
  [UnitClass.BUNKER_SHELL]: [
    SkillFactory.createBuffSkill('pumpkin_shell', 'Bunker Plating', 'ADJACENT', 1, 'SHIELD', 1, 'Shell an ally in a layer — the next hit against them is blocked in full.')
  ],
  // No damage on purpose — the shove IS the attack. Where the target lands (water, a
  // mountain, another body) is what costs it health, not the swing itself.
  [UnitClass.SPRING_ARM]: [
    SkillFactory.createMeleeAttack('chard_backswing', 'Backswing', 0, 'Hurls an adjacent enemy two tiles back.', [{ type: 'PUSH', value: 2 }])
  ],
  [UnitClass.STEEL_JAWS]: [
    SkillFactory.createMeleeAttack('burrow_strike', 'Burrow Strike', 999, 'Instantly kill non-massive unit.'),
    {
        ...SkillFactory.createLineAttack('sap_snare', 'Sap Snare', 3, 1, 'Slow and damage enemy.', true),
        effects: [{ type: 'DAMAGE', value: 1 }, { type: 'STUN' }]
    }
  ],
  [UnitClass.SOL_BATTERY]: [
    {
        id: 'synthesize', name: 'Synthesize', description: 'Absorb light. Charges ability.',
        rangeType: 'SELF', rangeValue: 0,
        effects: [{ type: 'CHARGE_SUN', value: 1 }]
    },
    {
        id: 'harvest', name: 'Harvest', description: 'Produce 50 Sol. Requires Charge.',
        rangeType: 'SELF', rangeValue: 0,
        requiresSunCharge: true,
        effects: [{ type: 'RESOURCE_GAIN', value: 50, resource: 'SUN' }]
    }
  ],
  
  // ZOMBIES
  // No skills at all. The crate is cargo, not a combatant — an empty list is what makes
  // the action bar honest when the player clicks it.
  [UnitClass.GEAR_CRATE]: [],

  [UnitClass.WALKER]: [ SkillFactory.createMeleeAttack('bite', 'Bite', 1, 'Chomp.') ],
  [UnitClass.SCRAPCAP]: [ SkillFactory.createMeleeAttack('scrap_smash', 'Scrap Smash', 2, 'Heavy hit.') ],
  [UnitClass.POTHELM]: [ SkillFactory.createMeleeAttack('pot_smash', 'Pot Smash', 2, 'Crushing blow.') ],
  [UnitClass.TATTERGUARD]: [ SkillFactory.createMeleeAttack('paper_slap', 'Paper Slap', 1, 'Slaps.') ],
  [UnitClass.DOORBEARER]: [ SkillFactory.createMeleeAttack('door_bash', 'Door Bash', 2, 'Hits with door.') ],
  [UnitClass.MINER]: [ SkillFactory.createMeleeAttack('pickaxe', 'Pickaxe', 2, 'Hits with pickaxe.') ],
  [UnitClass.LINEBREAKER]: [ SkillFactory.createMeleeAttack('tackle', 'Tackle', 2, 'Rushes target.', [{ type: 'PUSH', value: 1 }]) ],
  [UnitClass.LEAPER]: [ SkillFactory.createDash('vault_kick', 'Vault Kick', 4, 2, false, 'Jumps over.') ],
  [UnitClass.DANCER]: [ 
    { id: 'summon_backup', name: 'Summon Backup', rangeType: 'ADJACENT', rangeValue: 1, description: 'Summons backup.', effects: [{ type: 'SPAWN' }] } 
  ],
  [UnitClass.FLOATER]: [ SkillFactory.createMeleeAttack('balloon_drop', 'Drop Kick', 2, 'Drops onto a plant from above.') ],
  [UnitClass.LOBBER]: [ SkillFactory.createLobAttack('boulder_lob', 'Boulder Lob', 3, 2, 'Shells a plant from three tiles away.') ],
  [UnitClass.BANNERMAN]: [ SkillFactory.createMeleeAttack('flag_swat', 'Flag Swat', 1, 'A feeble whack with the flagpole.') ],
  [UnitClass.HEADLINER]: [
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
      description: 'Two crews touch down between your line and the Greenspire it is guarding.',
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
  [UnitClass.GRAVEHULK]: [
    SkillFactory.createMeleeAttack('telephone_smash', 'Tombstone Smash', 5, 'Massive damage.'),
    { id: 'runt_toss', name: 'Throw Runt', rangeType: 'LOB', rangeValue: 4, description: 'Throws Runt.', effects: [{ type: 'SPAWN' }] }
  ],
  [UnitClass.RUNT]: [ SkillFactory.createMeleeAttack('bite', 'Bite', 1, 'Small bite.') ],
  [UnitClass.ROCK]: [],
  [UnitClass.GRAVE]: [],
};
