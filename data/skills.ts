
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
  [UnitClass.GARGANTUAR]: [
    SkillFactory.createMeleeAttack('telephone_smash', 'Telephone Smash', 5, 'Massive damage.'),
    { id: 'imp_toss', name: 'Throw Imp', rangeType: 'LOB', rangeValue: 4, description: 'Throws Imp.', effects: [{ type: 'SPAWN' }] }
  ],
  [UnitClass.IMP]: [ SkillFactory.createMeleeAttack('bite', 'Bite', 1, 'Small bite.') ],
  [UnitClass.ROCK]: [],
  [UnitClass.GRAVE]: [],
};
