import { Position, Skill, StatusEffectType, TurnAction, Unit, UnitType } from '../types';
import { addBleedStack, grantLayer, calculateDamage, getSkillTargetPath, getTileAt, planPush, shieldUpdatesFor, survivesWater, wingMid, wingNear, wingTwin } from './gameLogic';
import { getFusionEffects, getFusionEffectValue, hasFusionEffect, collisionAura } from './fusion';
import { applyPushPlan, applyCollisionDamage, pushKill, type ResolveContext } from './actionBuilders';
import { chainDamageFor, chainStep, skillCarriesElement } from './elements';
import { HERO_DEFINITIONS } from '../data/heroes';

/**
 * EVERY HERO ATTACK IN THE GAME, RESOLVED.
 *
 * This was ~300 lines inside App.tsx's click handler — the rules for pierce, splash, the
 * Repeater's second pass, digestion, every status and every push all reachable only by
 * clicking a tile in a rendered React tree. That is why the fusion bugs in here were each
 * found by playing rather than by reading, and why none of it could be exercised by the
 * tutorial replay without a hand-copied twin (utils/scriptedReplay).
 *
 * It is a pure function: units, board and terrain in, TurnAction[] out. Nothing is mutated
 * except the simulation map it builds for itself.
 *
 * The caller still owns the two things that are NOT actions: spending the Sol (which must be
 * inside the snapshot handed to the engine) and burning a Sol charge.
 */
export const planSkillActions = (
    caster: Unit,
    /** Fusion effects must already be folded in — see applyFusionToSkill. */
    skill: Skill,
    pos: Position,
    ctx: ResolveContext,
): TurnAction[] => {
    const { units, board, terrainDefs, resonance } = ctx;
    const actions: TurnAction[] = [];

    actions.push({
        type: 'UNIT_ATTACK',
        unitId: caster.id,
        targetPos: pos,
        attackRange: skill.rangeType,
    });

    /**
     * SLINGSHOT CHARD (`SKILL_DASH`) — CÚ LAO PHẢI XONG TRƯỚC KHI CÚ QUÉT BẮT ĐẦU.
     *
     * Đây là thứ tự ngược với mọi skill DASH khác trong game, và sự ngược đó là toàn bộ ô này.
     * Rolling Charge của Ironhusk *húc rồi mới dừng lại* — sát thương rơi ở nơi cô lao TỚI,
     * nên khối DASH ở cuối hàm (phát `UNIT_MOVE` sau cùng) là đúng cho cô. Anh này thì *lao
     * tới rồi mới nổ*: vòng quét phải mọc quanh ô anh ĐÁP, không phải ô anh xuất phát.
     *
     * Cách rẻ nhất và an toàn nhất để cả hàm đọc đúng vị trí mới là **dời chính `caster` sang
     * ô đáp ngay tại đây**, trước khi bất cứ dòng nào đọc `caster.position`. Có hơn hai mươi
     * chỗ đọc nó — vòng quét (`hasRadialPush`), vector đẩy "ra xa tôi" trong `resolveTargets`,
     * ô neo của bụi, tâm của Provoke — và vá từng chỗ một là mời đúng loại lệch mà file này đã
     * gặp ba lần. Một phép gán, mọi nơi đọc cùng một sự thật.
     *
     * `tempUnits` được dựng muộn hơn (từ `units` của caller) nên thân anh trong mô phỏng cũng
     * phải dời theo — nếu không, mọi cú đẩy sẽ né một bức tường vô hình ở ô anh vừa rời đi.
     */
    const slingshot = skill.rangeType === 'DASH'
        && hasFusionEffect(caster, 'SKILL_DASH')
        && skill.effects.some(e => e.type === 'PUSH' || e.type === 'PULL');
    if (slingshot) {
        // Ô đáp: đúng ô ngắm nếu nó trống, còn nếu có thân chắn thì dừng ngay trước nó — cùng
        // luật với khối DASH ở cuối hàm, để hai đường không bao giờ kể hai câu chuyện.
        const blocker = units.find(u => u.hp > 0 && !u.isBurrowed
            && u.position.x === pos.x && u.position.y === pos.y);
        let landing = { ...pos };
        if (blocker) {
            const path = getSkillTargetPath(caster, skill, pos, board);
            landing = path.length > 1 ? { ...path[path.length - 2] } : { ...caster.position };
        }
        if (landing.x !== caster.position.x || landing.y !== caster.position.y) {
            actions.push({ type: 'UNIT_MOVE', unitId: caster.id, path: [landing] });
        }
        caster = { ...caster, position: landing };
    }

    // Check for POWER TILE boost
    let damageBoost = 0;
    const standingTile = getTileAt(caster.position, board);
    if (standingTile?.environment === 'POWER_TILE') {
        damageBoost = 1;
    }

    const targets = [pos];
    const hasPierce = skill.effects.some(e => e.type === 'PIERCE_ATTACK');

    // Slingshot Chard vẫn là một cú quét RADIAL — chỉ là tâm của nó đã dời tới ô đáp (xem
    // khối SKILL_DASH phía trên). Cú lao thay đổi cách tiếp cận, không thay đổi cú quét.
    const hasRadialPush = (skill.rangeType === 'SELF' || slingshot)
        && skill.effects.some(e => e.type === 'PUSH' || e.type === 'PULL');

    // Encase's shape (PLAN-hero-zephyr §6.3): a PAID self-shield covers the caster AND the
    // four tiles beside him — under layers the worth of a shield skill is breadth. Gated on
    // the Sol cost so the bench plants' free self-shells (Harden, Iron Stance) stay personal.
    const hasRadialShield = skill.rangeType === 'SELF'
        && (skill.sunCost ?? 0) > 0
        && skill.effects.some(e => e.type === 'SHIELD');

    if ((skill.rangeType === 'DASH' || skill.rangeType === 'LINE') && !slingshot) {
        if (hasPierce) {
            const path = getSkillTargetPath(caster, skill, pos, board);
            path.forEach(p => {
                if (p.x !== pos.x || p.y !== pos.y) targets.push(p);
            });
        }
    // Nhánh `skill.id === 'gust'` (quét toàn bàn) đã bỏ cùng Storm Fan — nó khoá theo ID của
    // đúng một cây, và cây đó không còn. Vật phẩm Blover thổi bay cả bàn bằng đường khác
    // (utils/itemResolution), không đi qua đây.
    } else if (hasRadialPush) {
        // SELF-range push (Seismic Slam, Bounce Away) hits every adjacent tile.
        // Without this the skill resolved against the caster's own tile and did nothing.
        targets.length = 0;
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(o => {
            const t = { x: caster.position.x + o.x, y: caster.position.y + o.y };
            if (t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8) targets.push(t);
        });
    } else if (skill.rangeType === 'WING_PAIR') {
        // The aimed cell selects a HEADING; its twin fires with it (utils/gameLogic,
        // wingTwin). Two cells, two separate instances — which is exactly how a layer reads
        // them: the first pops it, the second lands (§6.0, decision 15).
        const tw = wingTwin(caster.position, pos);
        if (tw.x >= 0 && tw.x < 8 && tw.y >= 0 && tw.y < 8
            && !(tw.x === pos.x && tw.y === pos.y)) {
            targets.push(tw);
        }
        // Cluster Load: a third rocket into the gap the pair always leaves between them. A
        // third full instance, on the same terms as the twin — so a layer standing in the
        // middle is popped by it rather than shrugging the whole volley.
        if (hasFusionEffect(caster, 'WING_MIDSHOT')) {
            const mid = wingMid(caster.position, pos);
            if (mid.x >= 0 && mid.x < 8 && mid.y >= 0 && mid.y < 8
                && !targets.some(t => t.x === mid.x && t.y === mid.y)) {
                targets.push(mid);
            }
        }
        // Underslung Pods: mỗi nòng kéo xuống một ô chéo kề cô. Cũng là instance đầy đủ như
        // twin và midshot — nên một lớp chắn đứng đó bị nó bóc, không phải chỉ nhìn thấy.
        if (hasFusionEffect(caster, 'EXTENDED_BARRELS')) {
            [pos, tw].forEach(c => {
                const near = wingNear(caster.position, c);
                if (near.x >= 0 && near.x < 8 && near.y >= 0 && near.y < 8
                    && !targets.some(t => t.x === near.x && t.y === near.y)) {
                    targets.push(near);
                }
            });
        }
    } else if (hasRadialShield) {
        /**
         * Tâm dấu cộng là ô người chơi BẤM, không phải ô Gourdward đứng.
         *
         * Với Encase trần hai thứ đó là một (SELF chỉ ngắm được chính mình), nên dòng này
         * không đổi gì. Với Rolling Rind (`ENCASE_RANGE`) thì tâm dời sang ô kề — và anh vẫn
         * được bọc, tự động, vì anh vẫn kề cái tâm mới. Không cần một luật đặc biệt nào để
         * "vẫn bảo vệ cả Gourdward": hình học đã lo.
         *
         * Ally được lọc bởi chính nhánh SHIELD phía dưới.
         */
        targets.length = 0;
        targets.push(pos);
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(o => {
            const t = { x: pos.x + o.x, y: pos.y + o.y };
            if (t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8) targets.push(t);
        });
    }

    // Cob Howitzer: the stun splatters onto the four neighbouring tiles.
    // Gated on the skill costing Sol — the same effect on a free basic attack would
    // be splash damage every turn for nothing, which is a different (and much
    // stronger) game than the one this fusion is priced for. NOTE: allies in the
    // splash ring take the damage since friendly fire — aim the big shots accordingly.
    //
    // THE RING IS HALF-STRENGTH. Splash tiles used to resolve the FULL skill — Needle
    // Bloom's card said "4 to the target, 2 around it" while the engine dealt 4 everywhere,
    // and Nova Shell's ring landed a full STUN on five tiles at once, which is the free
    // mass-stun the STUN RULE in data/fusionRecipes.ts exists to ban. Membership in this
    // set is what resolveTargets uses to halve damage and shield, and to soften STUN to
    // SLOW — one rule, and all three splash cards read true at once.
    const splashRing = new Set<string>();
    if ((skill.sunCost ?? 0) > 0 && hasFusionEffect(caster, 'SKILL_SPLASH')) {
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(o => {
            const t = { x: pos.x + o.x, y: pos.y + o.y };
            if (t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8) {
                targets.push(t);
                splashRing.add(`${t.x},${t.y}`);
            }
        });
    }

    /**
     * SPLIT SHELL (SPLIT_SHOT) — viên phụ bay tiếp MỘT ô theo đường kẻ từ Cornova tới mục tiêu.
     *
     * Trục là đường HÌNH HỌC caster → target, không phải đường bay của viên đạn: đạn cối bay
     * vòng cung nên nó không có "phía sau" nào để đọc. Bước hướng lấy bằng dấu của hiệu toạ độ,
     * ra đúng một trong tám hướng — hoàn toàn xác định, không dò địch, không chọn, không hoà.
     *
     * Cơ chế chạy ở cả tám hướng, nhưng chỉ khi cô đứng THẲNG HÀNG hoặc THẲNG CỘT với mục tiêu
     * thì ô phụ mới nằm chỗ xếp đội hình được — nên người chơi tự học rằng đứng thẳng là đứng
     * đúng, mà không cần một luật nào nói thế.
     *
     * Trúng gì thì trúng, kể cả người nhà: viên đạn không biết ai đứng sau lưng con nó bắn.
     */
    /**
     * Ô PHỤ — ô thứ hai nằm THÊM một bước trên đường kẻ caster → mục tiêu, và **luôn đúng 1
     * sát thương**. Hai ô khác hàng khác cột dùng chung đúng một hình học và đúng một con số:
     * Split Shell (`SPLIT_SHOT`, viên đạn phụ của Cornova) và Piercing Needles
     * (`PIERCING_NEEDLE`, cú quét xuyên của Thornshell).
     *
     * Ghim ở 1 chứ không đọc `damage` của chủ thể: nếu để nó ăn theo thì mọi buff đều nhân
     * đôi qua cửa này — đúng cái lỗ VOLLEY CAP tồn tại để bịt, chỉ mở ở chỗ khác. Với Piercing
     * Needles con số này còn là lời hứa gốc trên thẻ ("giảm dần xuống 1").
     */
    const secondaryTiles = new Set<string>();
    {
        /**
         * SPLIT SHELL: trục là đường HÌNH HỌC caster → target, không phải đường bay của viên
         * đạn — đạn cối bay vòng cung nên nó không có "phía sau" nào để đọc. Bước hướng lấy
         * bằng dấu của hiệu toạ độ, ra đúng một trong tám hướng: xác định, không dò địch,
         * không chọn, không hoà. Chỉ khi cô đứng thẳng hàng/thẳng cột thì ô phụ mới nằm chỗ
         * xếp đội hình được — người chơi tự học rằng đứng thẳng là đứng đúng.
         *
         * PIERCING NEEDLES: cùng hình học, nhưng chỉ trên đòn CẬN CHIẾN có sát thương — nên
         * hướng luôn là một trong bốn trục, và "ô ngay sau" đọc đúng nghĩa đen. Không đụng
         * `PIERCE_ATTACK` (thứ chỉ LINE/DASH sinh đường đi mới dùng được).
         *
         * Trúng gì thì trúng, kể cả người nhà: lưỡi gai không biết ai đứng sau lưng con nó đâm.
         */
        const split = hasFusionEffect(caster, 'SPLIT_SHOT');
        const pierce = hasFusionEffect(caster, 'PIERCING_NEEDLE')
            && skill.rangeType === 'MELEE'
            && skill.effects.some(e => e.type === 'DAMAGE');
        if (split || pierce) {
            const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
            const d = { x: sign(pos.x - caster.position.x), y: sign(pos.y - caster.position.y) };
            if (d.x !== 0 || d.y !== 0) {
                const t = { x: pos.x + d.x, y: pos.y + d.y };
                if (t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8
                    && !targets.some(p => p.x === t.x && p.y === t.y)) {
                    targets.push(t);
                    secondaryTiles.add(`${t.x},${t.y}`);
                }
            }
        }
    }

    // ADJACENT_STRIKE: the free melee swing lands on everything beside the hero, not only the
    // body it was aimed at. Built on SKILL_SPLASH above, with both of its lessons inverted:
    //
    //  - SPLASH is gated on the skill COSTING Sol, because free splash every turn is a much
    //    stronger game than the one it is priced for. This one is gated the other way, on the
    //    attack being FREE, because a swing that fires every turn IS the fusion — putting it
    //    on the paid skill as well would just be splash a second time.
    //  - SPLASH accepts friendly fire: one big deliberate shot, aim it properly. A swing that
    //    happens every single turn cannot, or it would quietly grind down whichever ally is
    //    standing beside the hero — so this only ever adds tiles that hold something hostile.
    if (!skill.sunCost && skill.rangeType === 'MELEE' && hasFusionEffect(caster, 'ADJACENT_STRIKE')) {
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(o => {
            const t = { x: caster.position.x + o.x, y: caster.position.y + o.y };
            if (t.x < 0 || t.x >= 8 || t.y < 0 || t.y >= 8) return;
            if (targets.some(p => p.x === t.x && p.y === t.y)) return;
            const occupant = units.find(u => u.hp > 0 && u.position.x === t.x && u.position.y === t.y);
            if (occupant && (occupant.isEnemy || occupant.type === UnitType.OBSTACLE)) targets.push(t);
        });
    }

    // --- CRITICAL FIX: CREATE TEMP UNIT MAP TO SIMULATE HP LOSS WITHOUT MUTATING STATE ---
    // This prevents the "Double Damage" bug where modifying targetUnit.hp directly caused
    // the state reducer to subtract damage from an already reduced value.
    const tempUnits = new Map<string, Unit>(units.map(u => [u.id, { ...u }]));
    // Slingshot Chard đã bay sang ô khác ở đầu hàm. `units` là mảng của caller, chụp TRƯỚC cú
    // lao, nên thân anh trong mô phỏng phải được dời theo — nếu không, mọi cú đẩy sẽ né một
    // bức tường vô hình ở ô anh vừa rời đi, và không cú nào tính được va chạm vào chính anh.
    if (slingshot && tempUnits.has(caster.id)) {
        tempUnits.set(caster.id, { ...tempUnits.get(caster.id)!, position: { ...caster.position } });
    }
    // Only living units occupy a tile in the simulation. Units killed earlier in this
    // same resolution must stop blocking pushes and stop being valid targets.
    // ...and anything under the sand. This ONE predicate is why the burrow rule did not become
    // five: the pierced lane, the splash ring, the lightning arc, the Repeater's second shot
    // and Storm Fan's sweep all route through here and NONE of them go anywhere near
    // getValidSkillTargets. Filtering only at the door would have missed every one.
    const getTempUnit = (p: Position) => Array.from(tempUnits.values())
        .find(u => u.hp > 0 && !u.isBurrowed && u.position.x === p.x && u.position.y === p.y);

    /**
     * How far the ally-buff spills (Solar Corona). 0 = the aimed body and nobody else.
     *
     * Paid-skill only and no-DAMAGE only, both for the SKILL_SPLASH reasons: an aura on a free
     * action is a different game, and an aura on an attack is area damage bought through the
     * wrong door.
     */
    const auraRadius = (skill.sunCost ?? 0) > 0
        && !skill.effects.some(e => e.type === 'DAMAGE')
        && hasFusionEffect(caster, 'SKILL_AURA') ? 2 : 0;

    /**
     * Everything a skill does TO AN ALLY, on one body. Lifted out of the per-tile loop so
     * Solar Corona can hand the identical treatment to a dozen of them without a second copy
     * of the layer, the blessing and the loan drifting away from the first.
     */
    const applyAllyEffects = (ally: Unit, at: Position) => {
        skill.effects.forEach(e => {
            /**
             * Rind Pellet có thể đưa thân này tới đây với `isEnemy === true`. Khi đó CHỈ lớp
             * chắn được phép đậu: hồi máu, ban phước, cho thêm hành động cho zombie thì không
             * phải hình phạt nữa, đó là một ô hỏng. Hình phạt đúng liều là "bạn vừa bọc giáp
             * cho nó" — không hơn.
             */
            if (ally.isEnemy && e.type !== 'SHIELD') return;
            if (e.type === 'HEAL') actions.push({ type: 'APPLY_DAMAGE', targetId: ally.id, amount: e.value || 0, eventType: 'HEAL', pos: at });
            if (e.type === 'SHIELD') {
                /**
                 * A shield is a LAYER (PLAN-hero-zephyr §6.0): granting one to a body that
                 * already has one is a no-op, never a stack — which is also why every cap
                 * that used to police shield totals is gone. The authored `value` only
                 * answers "does this effect grant at all" (splash ring included: half of any
                 * positive shell still rounds to a real layer).
                 *
                 * `shieldBarbed` is written WITH the layer, always, true or false: Glass Rind
                 * belongs to the shell rather than to whoever is standing nearby, so a body
                 * re-shelled later by somebody without the gear must come back unbarbed.
                 *
                 * SHIELD_SPREAD (the old SHIELD_BONUS's replacement — "+2 size" cannot exist
                 * when shields have no size): the caster's layers spill over, covering
                 * whoever stands beside the recipient too.
                 */
                const barbed = hasFusionEffect(caster, 'BARBED_SHIELD');
                // Payback Shell: chi lop do KY NANG TRA PHI phat ra moi ghim duoc - cung cong ma
                // SKILL_SPLASH dung. Reinforce la don thuong mien phi, cho no ghim la pha STUN RULE.
                const stunning = hasFusionEffect(caster, 'SHIELD_BREAK_STUN') && (skill.sunCost ?? 0) > 0;
                const refund = getFusionEffectValue(caster, 'SHIELD_REFUND');
                const spined = hasFusionEffect(caster, 'SHIELD_RETALIATE');
                if ((e.value || 0) > 0 && (ally.shield || 0) === 0) {
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: ally.id, updates: { shield: 1, shieldBarbed: barbed, shieldStuns: stunning, shieldRefund: refund, shieldSpined: spined } });
                    // Keep the simulation in step, so a second pass sees the layer.
                    ally.shield = 1;
                    ally.shieldBarbed = barbed;
                    ally.shieldStuns = stunning;
                    ally.shieldRefund = refund;
                    ally.shieldSpined = spined;
                    actions.push({ type: 'APPLY_DAMAGE', targetId: ally.id, amount: 0, eventType: 'BLOCK', pos: at });
                }
                /**
                 * GREATRIND (`SHIELD_BEHIND`) — lớp vỏ XUYÊN QUA người nhận, bọc thêm đúng MỘT
                 * thân: ô kế tiếp trên đường kẻ từ Gourdward tới người nhận.
                 *
                 * Cùng phép hình học với Split Shell và Piercing Needles — `sign` của hiệu toạ
                 * độ, tám hướng, hoàn toàn xác định. Ba ô khác hàng khác cột dùng chung một
                 * luật "ô kế tiếp trên đường kéo dài", nên người chơi học một lần dùng ba chỗ.
                 *
                 * Bản cũ (`SHIELD_SPREAD`) tràn sang MỌI ai kề người nhận: một con số không đọc
                 * được trước khi bấm, đổi theo đội hình, và ở gần chùm thì phát 5 lớp một lượt.
                 * "Thêm đúng 1, ở phía sau" đọc được thẳng trên thẻ.
                 *
                 * Chỉ bọc người nhà, và chỉ khi thân đó chưa có lớp — cùng luật với người nhận
                 * đứng trước (§6.0: có lớp rồi thì cấp thêm không được gì).
                 */
                if ((e.value || 0) > 0 && hasFusionEffect(caster, 'SHIELD_BEHIND')) {
                    const sign = (n: number) => (n > 0 ? 1 : n < 0 ? -1 : 0);
                    const d = { x: sign(at.x - caster.position.x), y: sign(at.y - caster.position.y) };
                    if (d.x !== 0 || d.y !== 0) {
                        const n = getTempUnit({ x: at.x + d.x, y: at.y + d.y });
                        if (n && !n.isEnemy && (n.shield || 0) === 0) {
                            n.shield = 1;
                            n.shieldBarbed = barbed;
                            n.shieldStuns = stunning;
                            n.shieldRefund = refund;
                            n.shieldSpined = spined;
                            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: n.id, updates: { shield: 1, shieldBarbed: barbed, shieldStuns: stunning, shieldRefund: refund, shieldSpined: spined } });
                            actions.push({ type: 'APPLY_DAMAGE', targetId: n.id, amount: 0, eventType: 'BLOCK', pos: n.position });
                        }
                    }
                }
            }
            if (e.type === 'REFRESH_ACTION') {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: ally.id, updates: { hasMoved: false, hasAttacked: false } });
                actions.push({ type: 'APPLY_DAMAGE', targetId: ally.id, amount: 0, eventType: 'BUFF', pos: at });
            }
            if (e.type === 'BLESS') {
                /**
                 * Solar Blessing (PLAN-hero-zephyr §6.1): +1 damage until the END OF THIS
                 * PLAYER TURN — bless first, then swing; the decay in turnManager makes a
                 * blessing after the ally has acted a wasted cast. The element LOAN rides
                 * the same status: only into an empty hand (own element wins), spent by
                 * the same decay.
                 *
                 * `blessPower` is stamped alongside, and for the same reason the loan is:
                 * when the blessed hero finally swings, the blesser and her gear are long out
                 * of scope, so the WORTH of the gift has to travel on the body that got it.
                 */
                const updates: Partial<Unit> = {};
                // Đúng 1, và không ô nào nâng nó nữa: Fanged Blessing từng cộng vào đây, mà
                // con số đó được `applyFusionToSkill` áp lên MỌI effect DAMAGE — trên một skill
                // 5 ô thì +1 thành +10. Ô đó giờ là `BLESS_RUPTURE`, không mang số damage nào.
                const gift = 1;
                if (!ally.statusEffects.includes('BLESSED')) {
                    const blessed: StatusEffectType[] = [...ally.statusEffects, 'BLESSED'];
                    updates.statusEffects = blessed;
                    ally.statusEffects = blessed;
                }
                if ((ally.blessPower ?? 0) !== gift) {
                    updates.blessPower = gift;
                    ally.blessPower = gift;
                }
                if (caster.element && !ally.element && !ally.blessedElement) {
                    updates.blessedElement = caster.element;
                    ally.blessedElement = caster.element;
                }
                /**
                 * THORNED BLOOM (`BLESS_RETALIATE`) — lời ban phước mọc gai.
                 *
                 * CỘNG DỒN, không phải "trao gai cho ai chưa có": đang phản 1 mà được ban thì
                 * phản 2. Nên nó đắt nhất trên đúng người đã có gai — Thornshell, Ironhusk
                 * Jamming Plate, ally đang đeo lớp Spined Rind — và vẫn có nghĩa trên một thân
                 * trơn (0 → 1). Ô hỗ trợ đọc được cả hai chiều.
                 *
                 * Đóng dấu ở đây vì lúc con zombie cắn thì Sunbloom và đồ của cô đã ngoài tầm,
                 * y hệt `blessPower`. Đồng hồ của nó dài hơn `BLESSED` một pha — lý do viết
                 * trong types.ts.
                 */
                if (hasFusionEffect(caster, 'BLESS_RETALIATE') && !ally.blessThorns) {
                    updates.blessThorns = true;
                    ally.blessThorns = true;
                }
                /**
                 * FANGED BLESSING (`BLESS_RUPTURE`) — lời ban phước mọc răng nanh.
                 *
                 * Cũng đóng dấu lên thân được ban, cùng lý do. Nó biến Sunbloom thành người
                 * BÓP CÒ cho công của cả đội: Rending Husk, Glass Rind, Rending Chard đặt vết,
                 * cô chọn ai là người rút hết một lượt. Đó là ô hỗ trợ đúng nghĩa — không tự
                 * sinh ra sát thương nào, chỉ quyết định lúc nào sổ nợ được đòi.
                 */
                if (hasFusionEffect(caster, 'BLESS_RUPTURE') && !ally.blessRupture) {
                    updates.blessRupture = true;
                    ally.blessRupture = true;
                }
                if (Object.keys(updates).length > 0) {
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: ally.id, updates });
                }
                actions.push({ type: 'APPLY_DAMAGE', targetId: ally.id, amount: 0, eventType: 'BUFF', pos: at });
            }
            if (e.type === 'BUFF_STAT') {
                const amount = e.value || 0;
                const updates = e.stat === 'HP'
                    ? { maxHp: ally.maxHp + amount, hp: ally.hp + amount }
                    : { damage: ally.damage + amount };
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: ally.id, updates });
                actions.push({ type: 'APPLY_DAMAGE', targetId: ally.id, amount: 0, eventType: 'BUFF', pos: at });
            }
        });
    };

    /**
     * COLLISION_BONUS đã RỜI khỏi đây.
     *
     * Bản cũ là một cú đánh THỨ HAI, tính riêng, chỉ cho những thân do chính caster dúi: cộng
     * thêm `collisionBonus` sau khi `applyPushPlan` đã thu điểm va chạm nền. Grand Chard bây
     * giờ là luật của BÀN CỜ (`collisionAura`, utils/fusion) nên nó phải nằm trong chính con
     * số va chạm nền, ở `applyCollisionDamage` — chỗ mà hazard, vật phẩm và cú đẩy của địch
     * cũng đi qua.
     *
     * Ghi lại chỗ này thay vì im lặng xoá, vì cái bẫy vẫn còn nguyên đó: hễ ai định "cộng
     * thêm damage va chạm" lần nữa thì bản chép tay thứ hai sẽ lại xuất hiện, và lần trước nó
     * đã trôi khỏi bản gốc đúng ba chỗ (đọc `applyCollisionDamage`).
     */

    /**
     * COLLISION_SPLASH — Blast Chard. Cú đẩy của anh biến thân địch thành quả lựu đạn.
     *
     * Tâm nổ là ĐIỂM GIỮA hai thân va chạm, nên vùng nổ là các ô kề trực giao của cả hai, trừ
     * chính hai thân (chúng đã trả tiền va chạm rồi). Hai ô kề trực giao không có hàng xóm
     * chung nào, nên con số luôn là 3 + 3 = 6 ô:
     *
     *      [  ][oo][oo][  ]
     *      [oo][xx][xx][oo]        xx = hai thân va chạm
     *      [  ][oo][oo][  ]        oo = 6 ô dính nổ
     *
     * BOM ĐẠN KHÔNG CÓ MẮT: đồng minh đứng trong vùng cũng dính. Cố ý — cùng tinh thần với
     * `BLESS_SHOCKWAVE`, ô cũng đẩy cả người nhà và điều đó là tính năng, không phải rò rỉ.
     *
     * Đi qua `applyCollisionDamage` chứ không phải một đường damage riêng, vì mảnh văng ra TỪ
     * cú va chạm: nó bỏ qua giáp mũ như mọi cú slam (nếu không thì ô này chết trước ba loại
     * zombie giáp, mà đây là sát thương DUY NHẤT của một hero 0-damage), nó vỡ lớp chắn, và ba
     * tanker ghép Tấm Giáp miễn nó — đúng một luật, không phải luật thứ hai.
     *
     * Chỉ đẩy/kéo mới nổ. Cú ném (TOSS) không đi qua `planPush` nên không sinh `impacts` — và
     * đúng về nghĩa: ném chỉ va với mặt đất, một thân thì không có điểm giữa.
     */
    const applyCollisionSplash = (plan: { impacts: Array<{ a: Position; b: Position }> }) => {
        if (!hasFusionEffect(caster, 'COLLISION_SPLASH')) return;
        // Một thân đứng cạnh HAI vụ nổ trong cùng cú đẩy vẫn chỉ ăn một mảnh — cùng luật với
        // `bumped`, nơi một thân bị slam hai lần vẫn chỉ chảy máu một lần.
        const hit = new Set<string>();
        plan.impacts.forEach(({ a, b }) => {
            const bodies = [a, b];
            for (const origin of bodies) {
                for (const o of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]) {
                    const t = { x: origin.x + o.x, y: origin.y + o.y };
                    if (t.x < 0 || t.x > 7 || t.y < 0 || t.y > 7) continue;
                    // Trừ chính hai thân va chạm.
                    if (bodies.some(p => p.x === t.x && p.y === t.y)) continue;
                    const victim = [...tempUnits.values()].find(
                        u => u.hp > 0 && !u.isBurrowed && u.position.x === t.x && u.position.y === t.y);
                    if (!victim || hit.has(victim.id)) continue;
                    hit.add(victim.id);
                    const r = applyCollisionDamage(victim, 1, actions, tempUnits.values());
                    if (r?.isFatal) pushKill(actions, victim, caster);
                }
            }
        });
    };

    /**
     * BLEED_ON_SHOVE — Rending Chard. Đập vào mới toác.
     *
     * Một cửa duy nhất để đánh dấu, dùng cho cả hai đường thân này có thể ăn va chạm: cú
     * đẩy/kéo (qua `plan.collided`) và cú ném tiếp đất (THE FALL, trong nhánh TOSS).
     *
     * Thân được STEADFAST che thì không chảy máu: nó không NHẬN sát thương va chạm nào, mà luật
     * của ô này đọc theo sát thương chứ không theo cú đẩy.
     */
    const markShoveBleed = (unit: Unit) => {
        if (!hasFusionEffect(caster, 'BLEED_ON_SHOVE')) return;
        if (unit.hp <= 0 || !unit.isEnemy) return;
        if (hasFusionEffect(unit, 'STEADFAST')) return;
        const upd = addBleedStack(unit);
        if (upd) actions.push({ type: 'UPDATE_UNIT_STATE', unitId: unit.id, updates: upd });
    };
    const applyShoveBleed = (plan: { collided: string[] }) => {
        if (!hasFusionEffect(caster, 'BLEED_ON_SHOVE')) return;
        plan.collided.forEach(id => {
            const u = tempUnits.get(id);
            if (u) markShoveBleed(u);
        });
    };

    /**
     * PROVOKE CHARD (`PROVOKE_ON_SHOVE`) — thân bị anh quăng đi thì GHI HẬN.
     *
     * Lượt sau nó bỏ mầm, quay lại tìm anh. Trigger là **cú ném**, không phải cú bị đánh — đó
     * là chỗ nó khác hẳn `RETALIATE_PUSH` mà nó thay thế, và hợp hero hơn hẳn: Chardslam là
     * người chủ động đi tìm chuyện, không phải bức tường đứng chờ bị đấm.
     *
     * Đánh dấu MỌI thân anh làm xê dịch, không chỉ những thân va vào cái gì đó — `plan.moves`
     * chứ không phải `plan.collided`. Ném hụt vào bãi đất trống thì con zombie vẫn tức.
     *
     * Vì sao ô này có giá trị chiến thuật thật: cú ném của anh vốn đã đưa một thân RA XA mầm;
     * ghi hận biến quãng đường nó vừa bị đẩy thành quãng đường nó tự nguyện đi ngược lại. Một
     * cú ném mua hai lượt của con zombie thay vì một.
     */
    const markShoveGrudge = (unit: Unit) => {
        if (!hasFusionEffect(caster, 'PROVOKE_ON_SHOVE')) return;
        if (unit.hp <= 0 || !unit.isEnemy || unit.type === UnitType.OBSTACLE) return;
        if (unit.immunities.includes('STATUS')) {
            actions.push({ type: 'APPLY_DAMAGE', targetId: unit.id, amount: 0, eventType: 'IMMUNE', pos: unit.position });
            return;
        }
        const next: StatusEffectType[] = unit.statusEffects.includes('PROVOKED')
            ? unit.statusEffects
            : [...unit.statusEffects, 'PROVOKED'];
        unit.statusEffects = next;
        unit.provokedBy = caster.id;
        actions.push({
            type: 'UPDATE_UNIT_STATE', unitId: unit.id,
            updates: { statusEffects: next, provokedBy: caster.id },
        });
    };
    const applyShoveGrudge = (plan: { moves: Array<{ unitId: string }> }) => {
        if (!hasFusionEffect(caster, 'PROVOKE_ON_SHOVE')) return;
        new Set(plan.moves.map(m => m.unitId)).forEach(id => {
            const u = tempUnits.get(id);
            if (u) markShoveGrudge(u);
        });
    };

    // `damageOverride` is how the Repeater's second pass lands for less than the
    // first. Passing it here rather than mutating the skill keeps the first pass
    // reading the authored number. `targetList` lets that second pass re-aim (the
    // roll-over below) without disturbing the first pass's target set.
    const resolveTargets = (damageOverride?: number, targetList: Position[] = targets) => targetList.forEach(targetPos => {
        const targetUnit = getTempUnit(targetPos);
        const isSelf = targetPos.x === caster.position.x && targetPos.y === caster.position.y;
        // Half-strength ring — see the SKILL_SPLASH note above. Read once per tile so the
        // damage, the shield and the stun-softening below cannot disagree about membership.
        const isSplash = splashRing.has(`${targetPos.x},${targetPos.y}`);

        if (skill.effects.some(e => e.type === 'TERRAIN_MOD')) {
            if (skill.id === 'ignite') {
                actions.push({ type: 'MODIFY_TERRAIN', pos: targetPos, environment: 'FIRE' });
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos: targetPos });
            }
        }

        // Reinforce on a HOUSE (PLAN-hero-zephyr §6.3): no unit stands there — the layer
        // lives on the tile (TileData.shielded) and the sprout bite consumes it in
        // turnManager. Idempotent like every layer: a shielded Greenspire gains nothing more.
        if (!getTempUnit(targetPos) && skill.effects.some(e => e.type === 'SHIELD')) {
            const houseTile = getTileAt(targetPos, board);
            if (houseTile?.isHouse && houseTile.hasBrain && !houseTile.shielded) {
                actions.push({ type: 'MODIFY_TERRAIN', pos: { ...targetPos }, shielded: true });
                actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BLOCK', pos: targetPos });
            }
        }

        // Cổng phe thứ hai của Rind Pellet. `applyAllyEffects` tự lọc để chỉ lớp chắn đậu được
        // lên thân địch, nên mở cổng ở đây là an toàn.
        const shieldShotHere = !!targetUnit && targetUnit.isEnemy
            && hasFusionEffect(caster, 'SHIELD_SHOT')
            && skill.effects.some(e => e.type === 'SHIELD');
        if (targetUnit && (!targetUnit.isEnemy || shieldShotHere)) {
            applyAllyEffects(targetUnit, targetPos);
            /**
             * SKILL_AURA (Solar Corona) — the same gift, to everyone standing within 2 tiles
             * of where it landed.
             *
             * Applied as a SPILL off the primary recipient rather than by widening `targets`,
             * for the reason SHIELD_SPREAD above is written the same way: the target list also
             * decides what the attack STRIKES, what the dust covers and where a Greenspire may be
             * shelled, and none of those should move because a support skill grew a radius.
             * Manhattan 2 is the "move range 2" diamond — 12 tiles, the shape the rest of the
             * game already measures range in.
             */
            if (auraRadius > 0) {
                Array.from(tempUnits.values()).forEach(u => {
                    if (u.hp <= 0 || u.isEnemy || u.isBurrowed || u.id === targetUnit.id) return;
                    const dist = Math.abs(u.position.x - targetPos.x) + Math.abs(u.position.y - targetPos.y);
                    if (dist > auraRadius) return;
                    applyAllyEffects(u, u.position);
                });
            }
        }

        const resEffect = skill.effects.find(e => e.type === 'RESOURCE_GAIN');
        if (resEffect && isSelf) {
            /**
             * DAWN HARVEST (`HARVEST_SHIELD`) — Harvest đổi sản lượng lấy một lớp chắn.
             *
             * Trừ đúng `value` Sol rồi phát layer. Con số nằm trên recipe chứ không hardcode ở
             * đây, để bảng cân bằng đọc được nó.
             *
             * Bốn trạng thái của Sunbloom, cố ý đọc thành bảng — vì Twin Sol Battery nhân đôi
             * PHẦN CÒN LẠI chứ không nhân sản lượng gốc:
             *   không gì        50 Sol
             *   Twin Sol       100 Sol
             *   Dawn Harvest    15 Sol + 1 lớp
             *   cả hai          30 Sol + 1 lớp
             */
            const toll = getFusionEffectValue(caster, 'HARVEST_SHIELD');
            if (toll > 0) {
                const sim = tempUnits.get(caster.id);
                const upd = sim ? grantLayer(sim) : null;
                if (upd) {
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: upd });
                    actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: 0, eventType: 'BLOCK', pos: caster.position });
                }
            }
            // TWIN SOL BATTERY: nhân PHẦN CÒN LẠI, sau khi Dawn Harvest đã trừ. Thứ tự này là
            // toàn bộ bảng bốn trạng thái ở trên — đảo lại thì cắm cả hai ra 65 chứ không phải 30.
            const doubler = hasFusionEffect(caster, 'HARVEST_DOUBLE') ? 2 : 1;
            const yielded = Math.max(0, (resEffect.value ?? 0) - toll) * doubler;
            actions.push({ type: 'RESOURCE_GAIN', amount: yielded, resource: 'SUN' });
            // Con số bay lên phải là số Sol THẬT nhận được, không phải số in trên thẻ: với Dawn
            // Harvest hai con số đó khác nhau, và một cái +50 bay lên khi ví chỉ tăng 15 là thẻ
            // bài nói dối ngay trước mắt người chơi.
            actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: yielded, eventType: 'SUN', pos: caster.position });
        }

        const chargeEffect = skill.effects.find(e => e.type === 'CHARGE_SUN');
        if (chargeEffect && isSelf) {
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: { sunCharge: 1 } });
            actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: 0, eventType: 'BUFF', pos: caster.position });
        }

        // FRIENDLY FIRE: an ally standing where a damaging skill lands is a combat target
        // like any other — same damage, same status, same shove. Allied bodies always
        // STOPPED the shot; taking the hit too is what makes lane discipline real. Only
        // the caster is exempt (reachable solely through their own splash ring).
        const friendlyFire = !!targetUnit
            && !targetUnit.isEnemy
            && targetUnit.id !== caster.id
            && skill.effects.some(e => e.type === 'DAMAGE');
        if (targetUnit && (targetUnit.isEnemy || targetUnit.type === UnitType.OBSTACLE || friendlyFire)) {
            const dmgEffect = skill.effects.find(e => e.type === 'DAMAGE');
            let isDead = false;
            // Stun Fang reads the bar BEFORE the bite. A body still at full health is the
            // only thing that pin ever lands on, which is what makes it once per zombie ever
            // rather than once per turn — the distinction the STUN RULE turns on.
            const wasFullHp = targetUnit.hp >= targetUnit.maxHp;

            if (dmgEffect) {
                // The override replaces the authored damage outright; terrain and
                // buff boosts still apply on top, same as the first shot.
                let rawDmg = (damageOverride ?? (dmgEffect.value || 0)) + damageBoost;
                /**
                 * Steel Jaws's swallow is an instant kill, but some things cannot be eaten.
                 *
                 * `isMassive` alone was enough while the Gravehulk was the only boss in the
                 * game — it is massive, so the check covered it by accident rather than on
                 * purpose. It stopped covering anything the moment bosses started shipping
                 * that are deliberately NOT massive (data/bosses.ts: only three of the nine
                 * resist a shove, because two shove heroes need work in the other six). The
                 * Headliner, the Colossus and every boss after them were one 75-Sol button
                 * away from being deleted on the turn they appeared.
                 *
                 * So the rule is named rather than inferred: a NAMED BOSS is not food. Snapmaw's
                 * reward for beating the Gravehulk is an executioner for thick regular
                 * units — it was never meant to be a key that skips the next eight fights.
                 *
                 * The bite itself is 7 now rather than 999 (data/heroes.ts), so this line is
                 * no longer holding back an instant kill — it is holding back a large hit.
                 * That is a much smaller thing to get wrong, which is the point of having
                 * changed the number: the exception stopped being load-bearing.
                 */
                if (skill.id === 'burrow_strike' && (targetUnit.isMassive || targetUnit.bossId)) rawDmg = 1;
                // The splash ring lands at half strength, floored — Needle Bloom's 4 bursts
                // for 2, and Nova Shell's ring (1 damage) grazes for 0 and only chills.
                if (isSplash) rawDmg = Math.floor(rawDmg / 2);
                // Ô PHỤ (Split Shell / Piercing Needles) luôn đúng 1 — lý do ở chỗ khai báo
                // `secondaryTiles` phía trên.
                if (secondaryTiles.has(`${targetPos.x},${targetPos.y}`)) rawDmg = 1;
                const totalDmg = rawDmg;
                // Use tempUnit for calculation (safe)
                const result = calculateDamage(targetUnit, totalDmg, hasPierce, false, caster);

                if (result.shieldDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: targetPos });
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: shieldUpdatesFor(result) });
                }

                // A hit the helmet zeroed out must CLANG. Silence here reads as a bug — the
                // player clicked, the animation played, and nothing happened — when what
                // actually happened is a rule they need to learn: bring a bigger answer.
                if (result.absorbedByArmor) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCKED', pos: targetPos });
                }

                if (result.finalDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: result.finalDamage, eventType: 'DAMAGE', pos: targetPos });

                    // UPDATE TEMP UNIT ONLY - Do not touch real State 'units'
                    targetUnit.hp = result.remainingHp;
                    targetUnit.shield = result.remainingShield;
                }
                // The wound was spent (+1 already inside finalDamage) — clear the icon too.
                if (result.bleedConsumed) {
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: [...targetUnit.statusEffects] } });
                }

                // The battle ledger. Shield damage counts — chewing armour is work the squad
                // did — but friendly fire does not: hurting your own wall is a cost, and a
                // ledger that prints costs as output teaches the player to farm their tank.
                const ledgered = result.shieldDamage + result.finalDamage;
                if (caster.heroId && targetUnit.isEnemy && targetUnit.type !== UnitType.OBSTACLE && ledgered > 0) {
                    actions.push({ type: 'TRACK_STAT', heroId: caster.heroId, stat: 'damageDealt', amount: ledgered });
                }

                if (result.isFatal) {
                    isDead = true;
                    pushKill(actions, targetUnit, caster);
                    targetUnit.hp = 0; // Mark dead in temp

                    // SHIELD_ON_KILL: a finish raises a fresh LAYER (PLAN-hero-zephyr §6.0) —
                    // already shielded means nothing more to gain, which is the layer model's
                    // own cap, so the per-recipe `cap` field is no longer consulted. Obstacles
                    // are excluded for the same reason SUN_ON_KILL excludes them — a rock is
                    // scenery, and a board with three of them would hand out free armour.
                    const casterSim = tempUnits.get(caster.id);
                    /**
                     * PRECISION SHIELD (`SHIELD_ON_SKILL_KILL`) — hẹp hơn hẳn `SHIELD_ON_KILL`
                     * ngay dưới: chỉ cú kết liễu bằng KỸ NĂNG TRẢ PHÍ mới dựng lớp.
                     *
                     * Cùng cổng `sunCost > 0` mọi ô skill-only dùng, và ở đây nó là cả cái giá:
                     * Peaburst bắn mỗi lượt, nên nếu đòn thường cũng tính thì đây là giáp tự
                     * mọc lại liên tục — đúng thứ mà chú thích của `LAST_STAND_SHIELD` đã cảnh
                     * báo ("giáp đội lốt lớp chắn").
                     */
                    if (casterSim && targetUnit.isEnemy && targetUnit.type !== UnitType.OBSTACLE
                        && (skill.sunCost ?? 0) > 0
                        && hasFusionEffect(caster, 'SHIELD_ON_SKILL_KILL')) {
                        const upd = grantLayer(casterSim);
                        if (upd) {
                            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: upd });
                            actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: 0, eventType: 'BLOCK', pos: caster.position });
                        }
                    }
                    if (casterSim && targetUnit.isEnemy && targetUnit.type !== UnitType.OBSTACLE
                        && (casterSim.shield || 0) === 0
                        && hasFusionEffect(caster, 'SHIELD_ON_KILL')) {
                        const barbed = hasFusionEffect(caster, 'BARBED_SHIELD');
                        // Payback Shell: chi lop do KY NANG TRA PHI phat ra moi ghim duoc - cung cong ma
                        // SKILL_SPLASH dung. Reinforce la don thuong mien phi, cho no ghim la pha STUN RULE.
                        const stunning = hasFusionEffect(caster, 'SHIELD_BREAK_STUN') && (skill.sunCost ?? 0) > 0;
                        const refund = getFusionEffectValue(caster, 'SHIELD_REFUND');
                        const spined = hasFusionEffect(caster, 'SHIELD_RETALIATE');
                        casterSim.shield = 1;
                        casterSim.shieldBarbed = barbed;
                        casterSim.shieldStuns = stunning;
                        casterSim.shieldRefund = refund;
                        casterSim.shieldSpined = spined;
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: { shield: 1, shieldBarbed: barbed, shieldStuns: stunning, shieldRefund: refund, shieldSpined: spined } });
                        actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: 0, eventType: 'BLOCK', pos: casterSim.position });
                    }
                }
            }

            const stunImmune = targetUnit.immunities.includes('STATUS') || targetUnit.immunities.includes('FREEZE');
            // Blizzard turns every one of Frostpod's slows into a freeze — which, on a
            // FREEZE-immune target, used to turn her capstone fusion into a straight
            // DOWNGRADE: the slow she would have landed was upgraded into a status the
            // target ignores. The chill still lands, it just fails to set.
            const chillFallback = hasFusionEffect(caster, 'UPGRADE_SLOW_TO_FREEZE')
                && !targetUnit.immunities.includes('STATUS');
            if (!isDead && skill.effects.some(e => e.type === 'STUN')) {
                if (isSplash) {
                    // Cob Howitzer: the RING is chilled, never pinned. A stun on five tiles for
                    // one cast is the mass lost-turn the STUN RULE bans; the card says "slows
                    // surrounding tiles" and this branch is that sentence. STATUS immunity
                    // still refuses it — that is the Doorbearer's whole job.
                    if (targetUnit.immunities.includes('STATUS')) {
                        actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                    } else if (!targetUnit.statusEffects.includes('SLOW')) {
                        const chilled: StatusEffectType[] = [...targetUnit.statusEffects, 'SLOW'];
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: chilled } });
                        targetUnit.statusEffects = chilled;
                    }
                } else if (stunImmune && !chillFallback) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else if (stunImmune && chillFallback) {
                    if (!targetUnit.statusEffects.includes('SLOW')) {
                        const slowed: StatusEffectType[] = [...targetUnit.statusEffects, 'SLOW'];
                        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: slowed } });
                        targetUnit.statusEffects = slowed;
                    }
                } else if (!targetUnit.statusEffects.includes('STUN')) {
                    const stunned: StatusEffectType[] = [...targetUnit.statusEffects, 'STUN'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: stunned } });
                    targetUnit.statusEffects = stunned;
                }
            }

            /**
             * STUN FANG (STUN_ON_FULL_HP) — the STUN RULE's priced exception.
             *
             * Fires only on a body that was at FULL health when the blow landed, so it can
             * never be spent on the same zombie twice, and only where the hero could reach
             * one. Immunity is read exactly as every other pin in the file reads it: STATUS
             * refuses everything, FREEZE refuses the pin itself.
             */
            if (!isDead && dmgEffect && wasFullHp
                && targetUnit.isEnemy && targetUnit.type !== UnitType.OBSTACLE
                && hasFusionEffect(caster, 'STUN_ON_FULL_HP')) {
                if (targetUnit.immunities.includes('STATUS') || targetUnit.immunities.includes('FREEZE')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else if (!targetUnit.statusEffects.includes('STUN')) {
                    const pinned: StatusEffectType[] = [...targetUnit.statusEffects, 'STUN'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: pinned } });
                    targetUnit.statusEffects = pinned;
                }
            }

            /**
             * BARBED PEA (PROVOKE_ON_HIT) — whatever she hurts turns on her.
             *
             * The same PROVOKED + `provokedBy` pair Provoke sets, so aiLogic needs no new case
             * and the enemy telegraphs "Provoked!" from the shot rather than from a shout. It
             * lasts exactly one enemy turn like every taunt, and STATUS immunity refuses it —
             * which is the honest limit: a Doorbearer still walks past her to the Greenspire.
             */
            if (!isDead && dmgEffect
                && targetUnit.isEnemy && targetUnit.type !== UnitType.OBSTACLE
                && hasFusionEffect(caster, 'PROVOKE_ON_HIT')) {
                if (targetUnit.immunities.includes('STATUS')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else {
                    const taunted: StatusEffectType[] = targetUnit.statusEffects.includes('PROVOKED')
                        ? targetUnit.statusEffects
                        : [...targetUnit.statusEffects, 'PROVOKED'];
                    // `provokedBy` is rewritten even when the status is already set — same rule
                    // as Provoke: whoever touched it last owns it.
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: taunted, provokedBy: caster.id } });
                    targetUnit.statusEffects = taunted;
                    targetUnit.provokedBy = caster.id;
                }
            }

            // Frostpod's baseline: costs the target ground rather than its whole turn.
            //
            // SLOW deliberately does NOT check FREEZE immunity. It used to, and the
            // knock-on effect landed squarely on the fight that decides a run: the
            // Gravehulk is PUSH- and FREEZE-immune and Massive, so the push, the
            // freeze, the stun AND the slow were all blanked at once — Ironhusk,
            // Frostpod, Cornova and Snapmaw were each reduced to 1-2 chip damage a turn, and
            // squad select quietly became "bring damage or lose the boss". Something
            // too heavy to freeze solid can still be chilled into moving slower.
            // STATUS immunity (Doorbearer) still stops everything: that is its job.
            //
            // ICE RESONANCE — a slow landing on something ALREADY slowed sets instead of chills.
            //
            // The condition is what makes this a rule and not a stat: a lone ICE hero can never
            // trigger it, because SLOW is wiped by NEW_TURN_RESET at the end of every turn, so
            // the first slow and the second have to land inside the SAME player turn. That means
            // two heroes, or one hero attacking twice — a play the squad has to set up, which is
            // exactly what an all-in commitment should be buying.
            //
            // FREEZE immunity IS checked here, and only here, which looks like a contradiction
            // of the long note below until you read what is being applied: the fallback branch
            // lands a SLOW (never checked against FREEZE, deliberately), this branch lands a
            // STUN. A Gravehulk that cannot be frozen still gets chilled by the plain slow it
            // was always going to get; it just never escalates.
            //
            // BLIZZARD does not interact with this at all, and that is by construction rather
            // than by luck. applyFusionToSkill maps every APPLY_SLOW to STUN *before* the skill
            // reaches this function, so a Blizzard carrier never enters this block — its slows
            // are already stuns, on the first hit, with no set-up and against a fresh target.
            // Blizzard therefore stays strictly the stronger effect and loses none of its value,
            // and the two can never compound into "stun, then stun harder": there is only ever
            // one STUN on a unit, and this branch refuses to add a second.
            if (!isDead && skill.effects.some(e => e.type === 'APPLY_SLOW')) {
                if (targetUnit.immunities.includes('STATUS')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else if (resonance === 'ICE'
                    && targetUnit.statusEffects.includes('SLOW')
                    && !targetUnit.statusEffects.includes('STUN')
                    && !targetUnit.immunities.includes('FREEZE')) {
                    // The chill it already carries is left in place: STUN is what stops the turn,
                    // and dropping the SLOW would quietly make the escalation a downgrade once
                    // the stun wears off in the same NEW_TURN_RESET that would have cleared both.
                    const frozen: StatusEffectType[] = [...targetUnit.statusEffects, 'STUN'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: frozen } });
                    targetUnit.statusEffects = frozen;
                } else if (!targetUnit.statusEffects.includes('SLOW')) {
                    const slowed: StatusEffectType[] = [...targetUnit.statusEffects, 'SLOW'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: slowed } });
                    targetUnit.statusEffects = slowed;
                }
            }

            // Fire Pea / Flame Thrower: a fusion that sets whatever it hits alight.
            // BURN then ticks in turnManager's environment phase and expires after a turn.
            if (!isDead && skill.effects.some(e => e.type === 'APPLY_BURN')) {
                if (targetUnit.immunities.includes('BURN')) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else if (!targetUnit.statusEffects.includes('BURN')) {
                    const burning: StatusEffectType[] = [...targetUnit.statusEffects, 'BURN'];
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: burning } });
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BURN', pos: targetPos });
                    targetUnit.statusEffects = burning;
                }
            }

            /**
             * BLEEDING — deliberately OUTSIDE the STATUS immunity gate every other status
             * respects (PLAN-hero-zephyr §8, decision 13): it is a physical wound, not mind
             * control, and bosses bleed too. A gear that goes cold in exactly the nine
             * fights that matter most would not be worth its slot. No stacking — bitten
             * twice is still one wound.
             */
            if (!isDead && skill.effects.some(e => e.type === 'APPLY_BLEED')) {
                const upd = addBleedStack(targetUnit);
                if (upd) actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: upd });
            }

            if (!isDead && skill.effects.some(e => e.type === 'HYPNOTIZE')) {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { isEnemy: false, statusEffects: [...targetUnit.statusEffects, 'HYPNOTIZED'] } });
                actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BUFF', pos: targetPos });
            }

            const pushEffect = skill.effects.find(e => e.type === 'PUSH' || e.type === 'PULL' || e.type === 'GLOBAL_PUSH');
            if (!isDead && pushEffect && targetUnit.immunities.includes('PUSH')) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
            } else if (!isDead && pushEffect) {
                let dx = 0, dy = 0;

                if (pushEffect.type === 'GLOBAL_PUSH') {
                    /**
                     * Two readings of one effect, told apart by where the skill was cast.
                     *
                     * Storm Fan's gust is aimed: ONE heading, off `pos`, and every body on the
                     * board goes that way. Shockrind is cast on the caster's own tile, so
                     * `pos` is his own square and that reading yields (0,0) — nothing moves.
                     * A SELF cast is radial by construction: each tile is shoved away from
                     * HIM, read per target, and his own square is skipped by the zero check.
                     */
                    const from = skill.rangeType === 'SELF' ? targetPos : pos;
                    dx = Math.sign(from.x - caster.position.x);
                    dy = Math.sign(from.y - caster.position.y);
                } else {
                    dx = targetPos.x - caster.position.x;
                    dy = targetPos.y - caster.position.y;

                    if (Math.abs(dx) > Math.abs(dy)) { dx = Math.sign(dx); dy = 0; }
                    else { dy = Math.sign(dy); dx = 0; }

                    if (pushEffect.type === 'PULL') {
                        dx = -dx; dy = -dy;
                    }
                }

                // Read from the simulation, not live state: a unit killed earlier in
                // this same resolution no longer blocks the push.
                const livingSim = Array.from(tempUnits.values()).filter(u => u.hp > 0);
                // A PUSH's `value` is a DISTANCE in tiles. Chardslam throws 2, and the
                // PUSH_DISTANCE fusions add to that number in applyFusionToSkill, so this is
                // the single place the whole game reads it. Every shove authored before
                // Chardslam carries value 1 and GLOBAL_PUSH carries none, which is what the
                // fallback preserves — nothing existing changes reach.
                const pushTiles = pushEffect.type === 'GLOBAL_PUSH' ? 1 : (pushEffect.value ?? 1);
                // A radial GLOBAL_PUSH read off the caster's own square has nowhere to go.
                if (dx !== 0 || dy !== 0) {
                    const plan = planPush(targetUnit, dx, dy, livingSim, board, terrainDefs, 3, new Set(), pushTiles);
                    applyPushPlan(plan, actions, tempUnits, caster);
                    applyCollisionSplash(plan);
                    applyShoveBleed(plan);
                    applyShoveGrudge(plan);
                }
            }

            /**
             * VAULT TOSS (PLAN-hero-zephyr §6.2) — the judo throw. Not a push: the body does
             * not slide through tiles, it goes OVER the caster's head to the mirrored tile
             * (2·C − T). Targeting already refused any aim whose landing tile is not free
             * (getValidSkillTargets), so by the time we are here the destination holds
             * nobody; it is re-checked against the simulation anyway, because an earlier
             * effect this same cast may have moved someone.
             */
            const tossEffect = skill.effects.find(e => e.type === 'TOSS');
            if (!isDead && tossEffect && targetUnit.isEnemy) {
                if (targetUnit.immunities.includes('PUSH')) {
                    // Massive: the grip has nothing it can lift. Same door the shove uses.
                    actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'IMMUNE', pos: targetPos });
                } else {
                    const dest = {
                        x: 2 * caster.position.x - targetUnit.position.x,
                        y: 2 * caster.position.y - targetUnit.position.y,
                    };
                    const destTile = getTileAt(dest, board);
                    const occupied = Array.from(tempUnits.values())
                        .some(u => u.hp > 0 && !u.isBurrowed && u.position.x === dest.x && u.position.y === dest.y);
                    if (destTile && !occupied
                        && destTile.terrain !== 'WALL' && destTile.terrain !== 'MOUNTAIN'
                        && !destTile.isHouse) {
                        // UNIT_MOVE, so mines, spikes and dust greet the landing exactly as
                        // they greet every other way a body arrives on a tile.
                        actions.push({ type: 'UNIT_MOVE', unitId: targetUnit.id, path: [dest] });
                        targetUnit.position = { ...dest };

                        if (destTile.terrain === 'WATER' && !survivesWater(targetUnit)) {
                            // The sea finishes what the throw started — planPush's own rule.
                            actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'DROWN', pos: dest });
                            pushKill(actions, targetUnit, caster);
                            targetUnit.hp = 0;
                            isDead = true;
                        } else {
                            // THE FALL: collision damage, not a DAMAGE effect — armour is
                            // bypassed like every slam, and a layer eats it whole. Grand Chard
                            // scales it qua `collisionAura` (BÀN CỜ, không phải người ném):
                            // một cú tiếp đất là va chạm, nên nó đọc đúng luật va chạm.
                            const fall = 1 + collisionAura(tempUnits.values());
                            const r = calculateDamage(targetUnit, fall, false, true);
                            if (r.shieldDamage > 0) {
                                actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: 0, eventType: 'BLOCK', pos: dest });
                                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: shieldUpdatesFor(r) });
                            }
                            if (r.finalDamage > 0) {
                                actions.push({ type: 'APPLY_DAMAGE', targetId: targetUnit.id, amount: r.finalDamage, eventType: 'DAMAGE', pos: dest });
                            }
                            if (r.bleedConsumed) {
                                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: targetUnit.id, updates: { statusEffects: [...targetUnit.statusEffects] } });
                            }
                            targetUnit.hp = r.remainingHp;
                            targetUnit.shield = r.remainingShield;
                            if (caster.heroId && r.finalDamage > 0) {
                                actions.push({ type: 'TRACK_STAT', heroId: caster.heroId, stat: 'damageDealt', amount: r.finalDamage });
                            }
                            if (r.isFatal) {
                                pushKill(actions, targetUnit, caster);
                                targetUnit.hp = 0;
                                isDead = true;
                            }
                            // Rending Chard: mặt đất cũng là một mặt va chạm, nên cú ném cũng
                            // để lại vết. Sau khối damage ở trên, vì thân chết rồi thì thôi.
                            markShoveBleed(targetUnit);
                            markShoveGrudge(targetUnit);
                        }
                    }
                }
            }
        }
    });

    /**
     * PROVOKE — resolved OUTSIDE the per-tile loop, on purpose.
     *
     * Provoke's rangeType is SELF, so `targets` holds nothing but the caster's own tile and
     * resolveTargets would never once look at the enemies this is aimed at. The reach is the
     * effect's `value`, measured from the caster in Manhattan distance like every other range
     * in the game — the geometry is a ring around the shouter, not a shape aimed at a tile.
     */
    const provokeEffect = skill.effects.find(e => e.type === 'PROVOKE');
    if (provokeEffect) {
        const radius = provokeEffect.value ?? 1;
        /** Số thân THỰC SỰ dính tiếng gọi — không tính con miễn nhiễm STATUS. Xem PROVOKE_REFUND. */
        let provoked = 0;
        units.forEach(u => {
            // Obstacles are excluded even though they are hostile: a rock does not walk, so
            // redirecting it is a wasted 50 Sol and a confusing status icon.
            if (!u.isEnemy || u.hp <= 0 || u.type === UnitType.OBSTACLE) return;
            const dist = Math.abs(u.position.x - caster.position.x) + Math.abs(u.position.y - caster.position.y);
            if (dist > radius) return;

            if (u.immunities.includes('STATUS')) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: 0, eventType: 'IMMUNE', pos: u.position });
                return;
            }

            // Never fall back to `u` itself: that array belongs to the caller, and this
            // function is only allowed to write to its own simulation.
            const sim = tempUnits.get(u.id);
            if (!sim) return;

            /**
             * TIẾNG HÉT CÓ HAI TẦM, và khoảng cách quyết định nó là loại nào.
             *
             *     kề anh (Manhattan ≤ 1)  →  TAUNTED   khoá vào Ô anh đang đứng
             *     xa hơn, trong bán kính  →  PROVOKED  đi về phía anh, đánh anh
             *
             * Đúng cả nghĩa lẫn flavor: hét vào mặt kẻ đứng sát thì nó vung theo tiếng hét;
             * hét với kẻ ở xa thì nó chỉ biết lao tới. Và nó mở ra một câu đố thật —
             *
             *   Provoke → ba con kề anh khoá vào ô anh đứng → Chardslam đẩy con thứ tư vào
             *   đúng ô đó rồi hất anh ra → ba con đấm nhau.
             *
             * Ô được chốt là ô người hét đứng LÚC HÉT (`caster.position`), và không bao giờ
             * cập nhật lại. Anh đi chỗ khác thì cả ba đấm vào đất.
             */
            const inMelee = Math.abs(u.position.x - caster.position.x)
                + Math.abs(u.position.y - caster.position.y) <= 1;
            if (inMelee) {
                const locked: StatusEffectType[] = sim.statusEffects.includes('TAUNTED')
                    ? sim.statusEffects
                    : [...sim.statusEffects, 'TAUNTED'];
                const tile = { ...caster.position };
                actions.push({
                    type: 'UPDATE_UNIT_STATE',
                    unitId: u.id,
                    updates: { statusEffects: locked, tauntedTile: tile },
                });
                actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: 0, eventType: 'BUFF', pos: u.position });
                sim.statusEffects = locked;
                sim.tauntedTile = tile;
                provoked += 1;
                return;
            }

            const taunted: StatusEffectType[] = sim.statusEffects.includes('PROVOKED')
                ? sim.statusEffects
                : [...sim.statusEffects, 'PROVOKED'];
            // `provokedBy` is rewritten even when the status is already set. Whoever shouted
            // last owns the enemy — otherwise a second Provoke would land as a silent no-op
            // on anything still pointed at a provoker that has since died.
            actions.push({
                type: 'UPDATE_UNIT_STATE',
                unitId: u.id,
                updates: { statusEffects: taunted, provokedBy: caster.id },
            });
            actions.push({ type: 'APPLY_DAMAGE', targetId: u.id, amount: 0, eventType: 'BUFF', pos: u.position });
            sim.statusEffects = taunted;
            sim.provokedBy = caster.id;
            provoked += 1;
        });
        /**
         * SUNLIT THORN (PROVOKE_REFUND) — hoàn `value` Sol cho MỖI thân thực sự dính tiếng gọi.
         *
         * Đếm ở đây chứ không đếm số ô trong bán kính: thân miễn nhiễm STATUS đã `return` phía
         * trên và không được tính, nên hét vào một con trùm miễn nhiễm là hét không công.
         *
         * Vẫn bán đúng thứ cả cột Sol Battery bán — "hồi này bấm được bao nhiêu lần" — nhưng
         * giá theo CHẤT LƯỢNG cú cast thay vì giảm giá phẳng: cast trúng 3 con hoàn bằng đúng
         * mức discount cũ, cast trượt thì trả đủ giá.
         */
        const refundEach = getFusionEffectValue(caster, 'PROVOKE_REFUND');
        if (refundEach > 0 && provoked > 0) {
            actions.push({ type: 'GAIN_SUN', amount: refundEach * provoked, pos: caster.position });
        }
        /**
         * WARDED PROVOKE (`PROVOKE_SHIELD`) — hét xong thì tự bọc một lớp.
         *
         * Không gate theo số con dính: anh vừa tự biến mình thành mục tiêu của cả vùng, và cái
         * lớp này là thứ trả tiền cho đúng hành động đó. Hét trượt vẫn được lớp — vì cái giá
         * (50 Sol + trọn một lượt) đã trả rồi.
         */
        if (hasFusionEffect(caster, 'PROVOKE_SHIELD')) {
            const sim = tempUnits.get(caster.id);
            const upd = sim ? grantLayer(sim) : null;
            if (upd) {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: upd });
                actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: 0, eventType: 'BLOCK', pos: caster.position });
            }
        }
    }

    /**
     * NƠI BỤI SẼ ĐỌNG — chụp lại TRƯỚC khi mọi thứ phân giải.
     *
     * Luật hiện hành (Smoke Bullet, chốt vòng 3): **bụi bốc lên ở nơi VIÊN ĐẠN VA CHẠM**, tức
     * chính ô bị đánh, không phải ô thân thể rơi xuống sau đó. Cần chụp ở đây vì sau khi
     * `resolveTargets()` chạy thì thân có thể đã bị đẩy, bị kéo, hoặc đã chết.
     *
     * `unitId` vẫn được ghi kèm, và đó KHÔNG phải để đọc vị trí cuối nữa — nó là cái lọc "có
     * thân mới có khói": một viên đạn không trúng gì thì không nổ, nên ô trống không bốc bụi.
     *
     * Đây là bản đọc lại L6 chứ không phải phá L6. L6 sinh ra để chặn Smokeline phủ CẢ LÀN
     * ĐẠN BAY QUA — và bản này vẫn chỉ phủ đúng những ô có va chạm. Câu chữ đúng của luật bây
     * giờ là: *"bụi ở nơi va chạm, không phải dọc đường bay"*.
     */
    const dustAnchors = skill.effects.some(e => e.type === 'DUST_TILE')
        ? targets.map(t => ({ tile: { ...t }, unitId: getTempUnit(t)?.id }))
        : [];

    resolveTargets();

    /**
     * BLESS_SHOCKWAVE (Kinetic Bloom) — the blessing lands and the ground beside it clears.
     *
     * Everything in the ring around the BLESSED body is shoved a tile away from it: enemy,
     * ally, and the blesser herself when she is standing next to the body she just blessed.
     * That last one is the feature rather than a leak — a lightning arc hops between ADJACENT
     * bodies, so this is the cell that makes a squad stop standing in a line, and it works on
     * the squad because the squad is what forms the line.
     *
     * Centred on `pos`, and only on `pos`: with Solar Corona also fused the blessing can reach
     * a dozen allies, and a shockwave from each of them would be a board-wide scatter nobody
     * could read. One cast, one wave, where the player aimed it.
     *
     * Routed through planPush/applyPushPlan like every other shove in the game, so it drowns,
     * chains and collides by identical rules — including the honest downside: a hero standing
     * between the blessing and open water goes in.
     */
    if (hasFusionEffect(caster, 'BLESS_SHOCKWAVE') && skill.effects.some(e => e.type === 'BLESS')) {
        [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }].forEach(d => {
            const at = { x: pos.x + d.x, y: pos.y + d.y };
            if (at.x < 0 || at.x >= 8 || at.y < 0 || at.y >= 8) return;
            const body = getTempUnit(at);
            if (!body) return;
            if (body.immunities.includes('PUSH')) {
                actions.push({ type: 'APPLY_DAMAGE', targetId: body.id, amount: 0, eventType: 'IMMUNE', pos: at });
                return;
            }
            const living = Array.from(tempUnits.values()).filter(u => u.hp > 0);
            const plan = planPush(body, d.x, d.y, living, board, terrainDefs, 3, new Set(), 1);
            applyPushPlan(plan, actions, tempUnits, caster);
            applyCollisionSplash(plan);
            applyShoveBleed(plan);
            applyShoveGrudge(plan);
        });
    }

    /**
     * RULE L3 — the LIGHTNING arc (PLAN-progression.md section 3).
     *
     * One extra resolution, against ONE tile beside the tile the player aimed at. Everything
     * that makes this correct is in the three words "once, from `pos`, `damageOverride`":
     *
     *  - ONCE, and from the PRIMARY target only. A multi-tile attack (a PIERCE_ATTACK lane
     *    once, Reedwing's WING_PAIR today) resolves against several tiles, so arcing from every
     *    tile in `targets` would double the hit count for nothing. `targetList` is a single
     *    tile, chosen off `pos`, and the other struck tiles never arc.
     *  - THROUGH `damageOverride`, which is why this reuses resolveTargets instead of copying
     *    the effect list the way SKILL_SPLASH does. Snapmaw's Devour is `DAMAGE 999`; a naive copy
     *    would carry 499 into the next tile — the Melon-splash bug again. The override replaces
     *    the authored number outright with the HERO's stat, so Snapmaw (damage 2) arcs for 1.
     *  - WITH THE WHOLE ATTACK, not just its damage. chainDamageFor has no minimum, so
     *    Chardslam arcs for 0 — and that cell would be a dead no-op if the arc were damage.
     *    Routed through resolveTargets it carries the SHOVE as well, so his one arc is a single
     *    swing that throws two bodies. That is the best cell he has, and it falls out for free.
     *
     * Target choice is CHAIN_OFFSETS order, first match wins: right, left, down, up. Fixed, not
     * random — a game that promises perfect information cannot roll dice inside a resolution,
     * and a player who learns the order can aim the arc. Read off the simulation AFTER the main
     * pass, so a body the attack just killed or shoved is not arced at where it used to be.
     *
     * LIGHTNING RESONANCE adds exactly one more hop, jumping on from the tile the arc just
     * struck. Everything above holds unchanged for it — same offsets in the same order, same
     * chainDamageFor (no falloff: halving a half is 0 for most of the roster, which would make
     * the reward for committing three heroes an animation), and the same "never a tile this
     * resolution already touched" rule, now extended to cover the first arc as well. `struck`
     * is what carries that across the hops.
     */
    if (caster.element === 'LIGHTNING' && skillCarriesElement(skill, caster)) {
        /**
         * Every tile this chain is forbidden to strike: the attack's own footprint (pierced
         * lane, splash ring, the primary target) plus each tile already arced to. The arc is
         * always a NEW body, never a second hit on one the swing has already paid for.
         */
        // Seeded with the attack's own footprint and the caster's square: an arc that came
        // back to either is not a chain. `chainStep` reads this and adds to it (utils/elements.ts).
        const struck = new Set(targets.map(t => `${t.x},${t.y}`));
        struck.add(`${caster.position.x},${caster.position.y}`);

        let from = pos;
        for (let hop = 0; hop < (resonance === 'LIGHTNING' ? 2 : 1); hop++) {
            // One hop per iteration, not the whole chain in one call: hop two has to see the
            // board hop one left behind (`getTempUnit` carries the damage already dealt).
            const [next] = chainStep(from, getTempUnit,
                // Obstacles are skipped for the same reason Provoke skips them: an arc spent
                // on scenery is an arc the player cannot use.
                u => u.isEnemy && u.type !== UnitType.OBSTACLE, struck);
            // A chain that runs out of bodies simply stops. No searching further afield: the
            // arc is adjacency, and a hop that skipped a gap would be a second attack.
            if (!next) break;
            const arcPos = { ...next.position };
            // Animated as a shot regardless of what the parent skill was — the arc leaves the
            // hero, not the tile it jumped from, and a melee lunge at a tile two steps away
            // reads as a bug.
            actions.push({ type: 'UNIT_ATTACK', unitId: caster.id, targetPos: arcPos, attackRange: 'LINE', isArc: true });
            resolveTargets(chainDamageFor(caster), [arcPos]);
            from = arcPos;
        }
    }

    // A fused Repeater sends a second, WEAKER shot after the free basic attack. The
    // second pass reads the HP left by the first (tempUnits carries it).
    //
    // The second shot is not allowed to FIZZLE. It used to resolve against the same
    // tile and skip corpses, so whenever the first pea killed, the second one simply
    // vanished — the same click dealt 2+1 into a tank and plain 2 into a kill, and
    // players filed the mismatch as a bug. On a LINE skill an overkill second shot now
    // rolls over: it flies past the corpse to the next body in the lane, exactly as a
    // real pea would. Any body still stops it (an ally blocker takes no damage — the
    // resolver only hurts enemies and obstacles), and mountains still end the lane.
    /**
     * Where the NEXT shot goes: the tile clicked, unless whatever stood there is dead, in
     * which case the pea carries on down the lane to the first body still standing.
     *
     * Lifted out of the Repeater's second shot because the volley needs exactly the same walk,
     * twice more. Any body stops it (an ally blocker simply takes nothing — the resolver only
     * hurts enemies and obstacles) and a mountain ends the lane.
     */
    const rollOverFrom = (from: Position): Position => {
        if (skill.rangeType !== 'LINE' || getTempUnit(from)) return from;
        const dx = Math.sign(from.x - caster.position.x);
        const dy = Math.sign(from.y - caster.position.y);
        for (let i = 1; i <= skill.rangeValue; i++) {
            const p = { x: caster.position.x + dx * i, y: caster.position.y + dy * i };
            if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) break;
            const tile = getTileAt(p, board);
            if (tile && terrainDefs[tile.terrain]?.type === 'MOUNTAIN') break;
            if (getTempUnit(p)) return p;
        }
        return from;
    };

    if (!skill.sunCost && hasFusionEffect(caster, 'DOUBLE_ATTACK')) {
        const secondPos = rollOverFrom(pos);
        actions.push({
            type: 'UNIT_ATTACK',
            unitId: caster.id,
            targetPos: secondPos,
            attackRange: skill.rangeType,
        });
        resolveTargets(
            getFusionEffectValue(caster, 'DOUBLE_ATTACK'),
            secondPos === pos ? targets : [secondPos],
        );
    }

    /**
     * A VOLLEY — shots two and three of Precision Blast.
     *
     * The first shot is the ordinary resolution above; these are the rest, each aimed by the
     * same roll-over the Repeater uses, so a pea is never spent on a corpse. No damageOverride:
     * every shot is worth what the skill is worth, which is what makes the hero's BONUS_DAMAGE
     * lift the whole volley rather than a third of it.
     */
    const volley = skill.effects.find(e => e.type === 'VOLLEY');
    if (volley) {
        const shots = Math.max(1, volley.value ?? 1);
        for (let shot = 2; shot <= shots; shot++) {
            const nextPos = rollOverFrom(pos);
            actions.push({
                type: 'UNIT_ATTACK',
                unitId: caster.id,
                targetPos: nextPos,
                attackRange: skill.rangeType,
            });
            resolveTargets(undefined, nextPos === pos ? targets : [nextPos]);
        }
    }

    /**
     * OVERWATCH_SHOT (Overwatch Pea) — the one fusion in the matrix that fires on somebody
     * ELSE'S action.
     *
     * Any enemy this cast MOVED — swept, bashed, thrown, slammed down a chain — is a body that
     * just stumbled through open ground. A hero carrying the gear puts one pea into it if she
     * has a clear row to where it stopped. Her own turn is untouched: the shove is what paid.
     *
     * Three limits, all deliberate:
     *  - it reads the finished action list, the same trick FIRE RESONANCE uses, so it catches
     *    every door a body can be moved through without any of them knowing about it;
     *  - ONE pea per body per cast, from the first shooter with the angle — the sweep that
     *    throws four zombies is four peas, not four peas each;
     *  - it fires only during the SQUAD'S OWN resolution. Shoves that happen on the enemy turn
     *    (a retaliation, a boss's slam) are outside this function and are not covered, which
     *    is exactly what the card promises: "any enemy the squad shoves".
     */
    const snipers = units.filter(u => !u.isEnemy && u.hp > 0 && u.type !== UnitType.OBSTACLE
        && hasFusionEffect(u, 'OVERWATCH_SHOT'));
    if (snipers.length > 0) {
        /**
         * The support shot is fired with THE GUN SHE IS HOLDING — same shape, same reach,
         * fusions included. It can never promise more than her own basic attack does, and the
         * difference between the two carriers falls out for free rather than being authored
         * twice: Peaburst's is a LINE and needs a clear row, Cornova's is a LOB and arcs over
         * whatever is in the way at her (short) 2 tiles.
         */
        const gunOf = (u: Unit) => {
            const basic = u.heroId ? HERO_DEFINITIONS[u.heroId]?.basicAttack : undefined;
            const lobbed = basic?.rangeType === 'LOB';
            const base = (basic?.rangeType === 'LINE' || lobbed) ? basic!.rangeValue : 4;
            return { lobbed, reach: base + getFusionEffectValue(u, 'ATTACK_RANGE_BONUS') };
        };
        const clearShot = (shooter: Unit, to: Position): boolean => {
            const { lobbed, reach } = gunOf(shooter);
            const dx = to.x - shooter.position.x;
            const dy = to.y - shooter.position.y;
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist === 0 || dist > reach) return false;
            if (lobbed) return true;                           // the arc ignores what is between
            if (dx !== 0 && dy !== 0) return false;             // a pea travels one row
            const sx = Math.sign(dx), sy = Math.sign(dy);
            for (let i = 1; i < dist; i++) {
                const p = { x: shooter.position.x + sx * i, y: shooter.position.y + sy * i };
                const tile = getTileAt(p, board);
                if (tile && terrainDefs[tile.terrain]?.type === 'MOUNTAIN') return false;
                if (getTempUnit(p)) return false;              // any body stops it, ally included
            }
            return true;
        };

        const moved = Array.from(new Set(
            actions.filter(a => a.type === 'UNIT_MOVE' && a.unitId).map(a => a.unitId!)));
        moved.forEach(id => {
            const victim = tempUnits.get(id);
            if (!victim || victim.hp <= 0 || !victim.isEnemy || victim.type === UnitType.OBSTACLE) return;
            for (const s of snipers) {
                const shooter = tempUnits.get(s.id) ?? s;
                if (shooter.hp <= 0) continue;
                // The symmetric dust rule: a shooter standing in smoke cannot line anything up,
                // support shot or otherwise (gameLogic's getValidSkillTargets, same sentence).
                const standing = getTileAt(shooter.position, board);
                if (standing?.smoke && standing.smoke.turns > 0) continue;
                if (!clearShot(shooter, victim.position)) continue;

                actions.push({ type: 'UNIT_ATTACK', unitId: shooter.id, targetPos: { ...victim.position }, attackRange: 'LINE' });
                const r = calculateDamage(victim, 1);
                if (r.shieldDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: 0, eventType: 'BLOCK', pos: victim.position });
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: victim.id, updates: { shield: r.remainingShield } });
                }
                if (r.absorbedByArmor) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: 0, eventType: 'BLOCKED', pos: victim.position });
                }
                if (r.finalDamage > 0) {
                    actions.push({ type: 'APPLY_DAMAGE', targetId: victim.id, amount: r.finalDamage, eventType: 'DAMAGE', pos: victim.position });
                }
                if (r.bleedConsumed) {
                    actions.push({ type: 'UPDATE_UNIT_STATE', unitId: victim.id, updates: { statusEffects: [...victim.statusEffects] } });
                }
                const ledgered = r.shieldDamage + r.finalDamage;
                if (shooter.heroId && ledgered > 0) {
                    actions.push({ type: 'TRACK_STAT', heroId: shooter.heroId, stat: 'damageDealt', amount: ledgered });
                }
                victim.hp = r.remainingHp;
                victim.shield = r.remainingShield;
                if (r.isFatal) {
                    pushKill(actions, victim, shooter);
                    victim.hp = 0;
                }
                break;   // one pea per body
            }
        });
    }

    /**
     * `SMOKE_ON_HIT` đã RỜI khỏi đây — Ash Carriage giờ là `SKILL_DUST_RING`.
     *
     * Bản cũ quét danh sách action đã xong để tìm mọi thân bị làm đau rồi phủ một ô bụi dưới
     * chân từng thân. Nó đúng về mặt kỹ thuật (một lượt quét bắt được cả đòn thường, phát thứ
     * hai của Repeater, viên volley và tia lan điện) nhưng sai về mặt luật: bụi đi kèm ĐÒN
     * MIỄN PHÍ nghĩa là một cái disarm không mất gì, lặp lại mỗi lượt.
     *
     * Hình mới nằm trong khối `DUST_TILE` phía dưới, và cổng trả-phí nằm ở `applyFusionToSkill`
     * — cùng một cửa với Smoke Bullet, nên hai ô bụi của game không thể trôi khỏi nhau.
     */

    /**
     * SPIKE_TILE — the row stays dangerous after the volley has landed.
     *
     * Every tile the attack COVERED is spiked, not just the one the player clicked. On a
     * piercing LINE that is the whole lane (getSkillTargetPath already walks it for the damage
     * pass), and the lane is the point of the skill: the shot taxes what is standing there
     * now, the spikes tax whatever walks in next turn. Emitted after both damage passes so the
     * ground appears once the shot is over.
     */
    const spikeEffect = skill.effects.find(e => e.type === 'SPIKE_TILE');
    if (spikeEffect) {
        const covered = (skill.rangeType === 'LINE' || skill.rangeType === 'DASH')
            ? getSkillTargetPath(caster, skill, pos, board)
            : targets;
        const spiked = new Set<string>();
        covered.forEach(p => {
            if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) return;
            // Never under the caster's own feet: a hero standing in his own spines is a bug
            // report, not a trade-off.
            if (p.x === caster.position.x && p.y === caster.position.y) return;
            const key = `${p.x},${p.y}`;
            if (spiked.has(key)) return;
            spiked.add(key);
            const tile = getTileAt(p, board);
            // Nothing can ever stand on a WALL, so nothing can ever be hurt by spiking one.
            if (!tile || tile.terrain === 'WALL') return;

            // Spines ride MODIFY_TERRAIN on their own `spikes` field, with `terrain` and
            // `environment` both left undefined so the reducer copies the ground through
            // untouched — grass that was grass stays grass, and the spines sit on top of it.
            //
            // Two turns, not one: the field is laid during the PLAYER's turn, and turnManager
            // ages it in the very next environment phase. At one turn it would expire before
            // the horde that it was aimed at had finished walking into it.
            actions.push({
                type: 'MODIFY_TERRAIN',
                pos: { ...p },
                spikes: { damage: spikeEffect.value ?? 1, turns: 2 },
            });
        });
    }

    /**
     * VÀNH QUANH ĐIỂM NỔ — hai ô Cornova, cả hai chỉ cưỡi KỸ NĂNG TRẢ PHÍ.
     *
     * Cùng cổng `sunCost > 0` mà `SKILL_SPLASH` dùng, và vì đúng một lý do: thứ gì rải ra cả
     * một vành mỗi lượt mà không tốn gì là một trò chơi khác hẳn trò chơi nó được định giá cho.
     *
     *  - `SKILL_BLEED_SPLASH` (Shrapnel Kernel): mảnh văng ra làm 4 ô quanh mục tiêu CHẢY MÁU,
     *    không phải mất máu. Khác `SKILL_SPLASH` (ô SIG của chính cô, gây damage + làm chậm)
     *    nên hai ô không giẫm chân nhau; và nó mở combo đội — ai đó khác tới kết liễu chỗ đã toác.
     *  - `SKILL_SPIKE_SCATTER` (Caltrop Cob): rải gai lên các ô TRỐNG kề mục tiêu.
     *
     * GHI CHÚ LỆCH SPEC, cố ý và cần biết: bản thiết kế nói "mảnh tan sau MỘT LẦN dẫm". Máy
     * gai trong engine (`TileData.spikes`) đếm theo LƯỢT chứ không theo lần kích, và sửa nó
     * thành một-lần-dùng sẽ đổi luôn hành vi của item Cây Gai vốn đang dùng chung máy đó. Nên
     * ở đây dùng `turns: 1` — bãi gai sống đúng lượt địch kế tiếp rồi tan. Gần đúng tinh thần
     * ("rải xong ai bước vào ngay thì dính"), khác ở chỗ hai con cùng bước vào một ô thì cả hai
     * đều dính. Muốn đúng từng chữ thì phải cho `spikes` một cờ one-shot riêng.
     */
    const ringOf = (p: Position) => [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
        .map(o => ({ x: p.x + o.x, y: p.y + o.y }))
        .filter(t => t.x >= 0 && t.x < 8 && t.y >= 0 && t.y < 8);

    if ((skill.sunCost ?? 0) > 0 && hasFusionEffect(caster, 'SKILL_BLEED_SPLASH')) {
        ringOf(pos).forEach(t => {
            const victim = [...tempUnits.values()].find(
                u => u.hp > 0 && u.isEnemy && !u.isBurrowed && u.position.x === t.x && u.position.y === t.y);
            if (!victim) return;
            // Vết bleed xuyên miễn nhiễm STATUS như mọi chỗ khác — trùm vẫn chảy máu.
            const upd = addBleedStack(victim);
            if (upd) actions.push({ type: 'UPDATE_UNIT_STATE', unitId: victim.id, updates: upd });
        });
    }

    if ((skill.sunCost ?? 0) > 0 && hasFusionEffect(caster, 'SKILL_SPIKE_SCATTER')) {
        const scatter = getFusionEffectValue(caster, 'SKILL_SPIKE_SCATTER') || 2;
        ringOf(pos).forEach(t => {
            // CHỈ ô TRỐNG: mảnh gai nằm trên ĐẤT, không nằm dưới chân ai đang đứng sẵn.
            const occupied = [...tempUnits.values()].some(
                u => u.hp > 0 && !u.isBurrowed && u.position.x === t.x && u.position.y === t.y);
            if (occupied) return;
            if (t.x === caster.position.x && t.y === caster.position.y) return;
            const tile = getTileAt(t, board);
            if (!tile || tile.terrain === 'WALL' || tile.isHouse) return;
            actions.push({ type: 'MODIFY_TERRAIN', pos: { ...t }, spikes: { damage: scatter, turns: 1 } });
        });
    }

    /**
     * DUST_TILE — the veil the DUST_VEIL hazard writes, cast by hand (PLAN-hero-zephyr §5.3).
     *
     * Same field, same reader: `TileData.smoke` plus `environment: 'SMOKE'`, aged by
     * turnManager's one ageing block, read by its one `blinded()` — whatever ends its turn
     * inside cannot line up a swing. Two shapes:
     *  - Smoke Pod itself drops the hazard's own PLUS (centre + 4 neighbours) — one mechanic,
     *    one shape, so a player who has met the weather already knows the skill.
     *  - A SKILL_DISARM fusion dusts the tiles the carrying skill actually covered, exactly
     *    like the spike trail above.
     * Unlike spikes, the caster's own tile is NOT skipped: standing in your own smoke is a
     * real trade (the symmetric rule in getValidSkillTargets), not a bug.
     */
    const dustEffect = skill.effects.find(e => e.type === 'DUST_TILE');
    if (dustEffect) {
        /**
         * Where the dust settles. Three shapes, one rule each:
         *  - an ALLY-targeted carrier dusts the RING around the recipient and never their own
         *    tile — the veil protects the blessed body, it must not disarm it (the symmetric
         *    can't-aim-from-dust rule would hit the ally too);
         *  - a pure ground pod (Smoke Pod) drops the hazard's own plus, centre included;
         *  - a STRIKE carrier dusts where the bodies it touched ENDED UP.
         *
         * That third rule replaced two older ones at once, and both were wrong in the same
         * direction — they dusted GROUND rather than bodies. Smokeline used to hang the whole
         * lane the pea crossed, which walled off her own squad's firing lines as often as the
         * horde's; Veilsweep used to dust the ring Chardslam swept, i.e. the tiles the zombies
         * had just been thrown OFF, so the veil reliably missed everything it was aimed at.
         * One sentence — "the cloud goes up where the body comes down" — fixes both, and the
         * lane shot narrows to the single tile the first pea found.
         */
        const centreOccupant = getTempUnit(pos);
        // "Aimed at an ally" means SOMEBODY ELSE. A SELF-ranged skill is aimed at the caster's
        // own tile, so without the second clause Sweep read as an ally-centred cast and dusted
        // the ring around Chardslam — the tiles the zombies had just been thrown off, which is
        // precisely the bug the landing rule exists to fix.
        const allyCentred = !!centreOccupant && !centreOccupant.isEnemy
            && centreOccupant.id !== caster.id;
        const ring: Position[] = [
            { x: pos.x + 1, y: pos.y }, { x: pos.x - 1, y: pos.y },
            { x: pos.x, y: pos.y + 1 }, { x: pos.x, y: pos.y - 1 }];
        /**
         * A pure ground pod is TWO tiles, not the hazard's five.
         *
         * DUST_VEIL is weather — a plus dropped on the board by the sector, and nobody chose
         * where. A pod is a hero spending a turn, and the same footprint made that turn far
         * too wide: five tiles is a third of a corridor, and because the blind rule is
         * SYMMETRIC (gameLogic's `getValidSkillTargets` stops the squad's own damage skills
         * inside dust) the wide version walled off its own line as often as the horde's.
         *
         * The second tile is the neighbour on the CASTER'S side, which is not an arbitrary
         * pick: the cloud always ends up between Reedwing and what she just blinded, so the
         * pod covers her way out — the exact thing the skill exists to buy ("it buys the TURN
         * she needs to leave the pocket she just flew into"). Deterministic tie-break in
         * reading order, like every other aim in this file: a telegraph decided by a coin
         * flip is not a telegraph.
         */
        const podTrail = ring
            .filter(p => p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8)
            .sort((a, b) =>
                (Math.abs(a.x - caster.position.x) + Math.abs(a.y - caster.position.y))
                - (Math.abs(b.x - caster.position.x) + Math.abs(b.y - caster.position.y))
                || a.x - b.x || a.y - b.y)
            .slice(0, 1);
        // SMOKE BULLET: ô viên đạn VA CHẠM, chụp trước khi phân giải. Ô không có thân thì rơi
        // ra khỏi danh sách — không trúng ai thì không có khói.
        const impacts: Position[] = dustAnchors
            .filter(a => !!a.unitId)
            .map(a => ({ ...a.tile }));
        /**
         * ASH CARRIAGE (`SKILL_DUST_RING`) — hình thứ tư, và là hình của một khẩu pháo: bụi
         * KHÔNG đọng ở điểm nổ mà ở BỐN Ô QUANH nó. Tro bắn ra ngoài.
         *
         * Cố ý chừa ô tâm: đó là ô Cornova vừa dội trúng và ghim (Nova Shell mang STUN), nên
         * phủ bụi lên đó là phủ lên thứ đằng nào lượt này cũng không đánh được. Bốn ô quanh
         * mới là chỗ đàn zombie kế tiếp bước vào.
         */
        const ashRing = hasFusionEffect(caster, 'SKILL_DUST_RING');
        const covered: Position[] = ashRing
            ? ring
            : allyCentred
                ? ring
                : !skill.effects.some(e => e.type === 'DAMAGE' || e.type === 'PUSH')
                    ? [pos, ...podTrail]
                    : impacts;
        const dusted = new Set<string>();
        covered.forEach(p => {
            if (p.x < 0 || p.x >= 8 || p.y < 0 || p.y >= 8) return;
            const key = `${p.x},${p.y}`;
            if (dusted.has(key)) return;
            dusted.add(key);
            const tile = getTileAt(p, board);
            if (!tile || tile.terrain === 'WALL' || tile.terrain === 'MOUNTAIN') return;
            actions.push({
                type: 'MODIFY_TERRAIN',
                pos: { ...p },
                environment: 'SMOKE',
                smoke: { turns: dustEffect.value ?? 2 },
            });
        });
    }

    /**
     * FIRE RESONANCE — a body that dies burning leaves its ground alight.
     *
     * Read off the finished action list rather than bolted onto each death site, and that is
     * the only version of this that is actually correct. A hero attack can kill through five
     * different doors — the damage pass, the Repeater's second pass, the lightning arc, the
     * collision bonus, a shove into a wall inside applyPushPlan — and four of them are reached
     * through code that knows nothing about elements. One pass over `UNIT_DIE` catches all of
     * them, cannot drift when a sixth is added, and reads the simulation's LAST word on where
     * the body was standing and what it was carrying (a corpse that was shoved before it died
     * burns where it landed, not where it was hit).
     *
     * It reuses `ignite`'s exact pair of actions — MODIFY_TERRAIN + the BURN tile event — so
     * there is one kind of fire tile in this game and PHASE 2 of turnManager needs no new case.
     *
     * A target killed OUTRIGHT by a fire hero does not qualify, and should not: the status
     * blocks above are all gated on `!isDead`, so nothing that dies to the blow was ever
     * burning. The rule pays for damage over time that finished its job, not for a kill.
     */
    if (resonance === 'FIRE') {
        const ignited = new Set<string>();
        // Snapshotted before the loop appends to `actions` — the fire tiles must not be
        // rescanned as if they were deaths of their own.
        const dead = actions.filter(a => a.type === 'UNIT_DIE' && a.unitId).map(a => a.unitId!);
        dead.forEach(id => {
            const victim = tempUnits.get(id);
            if (!victim || !victim.isEnemy || victim.type === UnitType.OBSTACLE) return;
            if (!victim.statusEffects.includes('BURN')) return;
            const key = `${victim.position.x},${victim.position.y}`;
            if (ignited.has(key)) return;
            const tile = getTileAt(victim.position, board);
            // Ground a body could have stood on, and not already burning. Water is the reason
            // this check exists: a burning zombie shoved into the lake drowns, and a lake that
            // catches fire is a bug report rather than a reward.
            if (!tile || !terrainDefs[tile.terrain]?.isWalkable) return;
            if (tile.environment === 'FIRE') return;
            ignited.add(key);
            actions.push({ type: 'MODIFY_TERRAIN', pos: { ...victim.position }, environment: 'FIRE' });
            actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BURN', pos: { ...victim.position } });
        });
    }

    // Steel Jaws is helpless while it digests. Without this the swallow had no downside.
    if (skill.id === 'burrow_strike' && actions.some(a => a.type === 'UNIT_DIE')) {
        // Double Jaw shortens the helpless window that is Snapmaw's whole drawback.
        const digest = Math.max(1, 2 - getFusionEffectValue(caster, 'DIGEST_REDUCTION'));
        // Armored Jaws used to raise a LAYER here. It is a flat reduction now, read inside
        // calculateDamage off `digestingTurns` — so there is nothing to grant at this site and
        // it softens EVERY blow of the window instead of the first one.
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: { digestingTurns: digest } });
        /**
         * WARDED GUT (`SHIELD_ON_DIGEST`) — nuốt xong thì tự bọc một lớp.
         *
         * Đúng luật của cả hàng Snapmaw: mọi ô của anh phải đánh vào CỬA SỔ TIÊU HOÁ, thứ vừa
         * là sức mạnh vừa là chỗ chết của anh. Lớp này che đúng cú đầu tiên của quãng bất lực.
         *
         * Khác `ARMOR_WHILE_DIGESTING` (giảm 1 cho MỌI đòn trong cửa sổ) ở chỗ nó chặn TRỌN một
         * đòn rồi vỡ — cắm cả hai thì cú đầu bị nuốt sạch, các cú sau nhẹ đi. Hai ô hợp tác chứ
         * không giẫm chân.
         */
        const gut = tempUnits.get(caster.id);
        if (gut && hasFusionEffect(caster, 'SHIELD_ON_DIGEST')) {
            const upd = grantLayer(gut);
            if (upd) {
                actions.push({ type: 'UPDATE_UNIT_STATE', unitId: caster.id, updates: upd });
                actions.push({ type: 'APPLY_DAMAGE', targetId: caster.id, amount: 0, eventType: 'BLOCK', pos: caster.position });
            }
        }
    } else if (skill.id === 'burrow_strike' && hasFusionEffect(caster, 'DIGEST_STEADFAST')) {
        /**
         * ANCHORED GULLET — nửa THỨ HAI, nửa "nuốt trượt". Hai võ sĩ nắm áo nhau.
         *
         * Nuốt trúng thì anh bất động (nửa kia, trong `planPush`). Nuốt TRƯỢT — nghĩa là con
         * kia là trùm hoặc Massive, hai loại `burrow_strike` chỉ gãi được 1 damage — thì
         * ĐỊCH bất động: `ROOTED` cấm đi, cho đánh. Hàm răng đã ngoạm vào rồi, chỉ là không
         * nuốt nổi.
         *
         * Vì sao đây là ô đáng một slot: cú Devour vào trùm trước giờ là một lượt vứt đi (1
         * damage, không nuốt, không tiêu hoá). Ô này biến nó thành đòn KHOÁ CHÂN trùm một
         * lượt — thứ duy nhất trong ma trận ghim được một thân thể không ai đẩy nổi.
         *
         * STUN RULE ✓: không lượt nào bị xoá. Con trùm vẫn đánh, chỉ là đánh tại chỗ — và
         * chỗ đó có Snapmaw đang đứng, nên anh trả giá bằng máu mình cho một lượt bàn cờ
         * đứng yên. `immunities STATUS` vẫn từ chối được, đúng tiền lệ RETALIATE_ROOT.
         */
        const held = getTempUnit(pos);
        if (held && held.isEnemy && held.hp > 0 && !held.immunities.includes('STATUS')
            && !held.statusEffects.includes('ROOTED')) {
            const next: typeof held.statusEffects = [...held.statusEffects, 'ROOTED'];
            held.statusEffects = next;
            actions.push({ type: 'UPDATE_UNIT_STATE', unitId: held.id, updates: { statusEffects: next } });
        }
    }

    // `!slingshot`: cú lao của anh đã được phát ở ĐẦU hàm, vì vòng quét phải nổ sau khi anh
    // tới nơi. Không chặn ở đây thì anh đi hai lần trong một lượt.
    if (skill.rangeType === 'DASH' && !slingshot) {
        const targetUnit = getTempUnit(pos);
        if (!targetUnit) {
            actions.push({ type: 'UNIT_MOVE', unitId: caster.id, path: [pos] });
        } else {
            const path = getSkillTargetPath(caster, skill, pos, board);
            if (path.length > 1) {
                actions.push({ type: 'UNIT_MOVE', unitId: caster.id, path: [path[path.length - 2]] });
            }
        }
    }

    return actions;
};
