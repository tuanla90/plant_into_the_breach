
import { Skill, SkillRangeType, SkillEffectDefinition, EffectType } from '../types';

/**
 * SkillFactory helps create consistent Skill objects and exposes 
 * configuration parameters previously hidden in code.
 */
export const SkillFactory = {
    
    // 1. BASIC ATTACKS
    createAttack: (
        id: string, 
        name: string, 
        rangeType: SkillRangeType, 
        rangeValue: number, 
        damage: number, 
        description: string,
        extraEffects: SkillEffectDefinition[] = []
    ): Skill => {
        return {
            id, name, description,
            rangeType, rangeValue,
            effects: [
                { type: 'DAMAGE', value: damage },
                ...extraEffects
            ]
        };
    },

    createLineAttack: (id: string, name: string, range: number, damage: number, desc: string, pierce: boolean = false): Skill => {
        const effects: SkillEffectDefinition[] = [];
        if (pierce) effects.push({ type: 'PIERCE_ATTACK' });
        
        return SkillFactory.createAttack(id, name, 'LINE', range, damage, desc, effects);
    },

    createLobAttack: (id: string, name: string, range: number, damage: number, desc: string, extra: SkillEffectDefinition[] = []): Skill => {
        return SkillFactory.createAttack(id, name, 'LOB', range, damage, desc, extra);
    },

    createMeleeAttack: (id: string, name: string, damage: number, desc: string, extra: SkillEffectDefinition[] = []): Skill => {
        return SkillFactory.createAttack(id, name, 'MELEE', 1, damage, desc, extra);
    },

    // 2. SUPPORT SKILLS
    createResourceGen: (id: string, name: string, amount: number, desc: string, isStationary: boolean = false): Skill => {
        // Technically range is SELF
        return {
            id, name, description: desc,
            rangeType: 'SELF', rangeValue: 0,
            effects: [
                { type: 'RESOURCE_GAIN', value: amount, resource: 'SUN' }
            ]
        };
    },

    createBuffSkill: (id: string, name: string, rangeType: SkillRangeType, range: number, buffType: EffectType, value: number, desc: string): Skill => {
        return {
            id, name, description: desc,
            rangeType, rangeValue: range,
            effects: [
                { type: buffType, value: value }
            ]
        };
    },

    createSelfHealOrShield: (id: string, name: string, type: 'HEAL' | 'SHIELD', value: number, desc: string): Skill => {
        return {
            id, name, description: desc,
            rangeType: 'SELF', rangeValue: 0,
            effects: [
                { type: type, value: value, targetSelf: true }
            ]
        };
    },
    
    // 3. UTILITY
    createDash: (id: string, name: string, range: number, damage: number, push: boolean, desc: string): Skill => {
        const effects: SkillEffectDefinition[] = [{ type: 'DAMAGE', value: damage }];
        if (push) effects.push({ type: 'PUSH', value: 1 });
        
        return {
            id, name, description: desc,
            rangeType: 'DASH', rangeValue: range,
            effects
        };
    }
};
