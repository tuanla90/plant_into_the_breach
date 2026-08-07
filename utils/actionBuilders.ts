import { ElementId, Position, TerrainDefinition, TileData, TurnAction, Unit, UnitType } from '../types';
import { calculateDamage, planPush, shieldUpdatesFor } from './gameLogic';
import { getFusionEffectValue, hasFusionEffect } from './fusion';

/**
 * The two builders every attack, item and shove funnels through.
 *
 * They lived as closures inside App.tsx, which meant the only way to reach the rules they
 * encode — what a kill pays, what a collision costs, what drowning looks like — was to be
 * rendering the game. Everything here is pure: it appends to the `actions` array it is given
 * and mutates only the caller's own simulation map.
 */

/** What a resolution needs to know about the world. Passed instead of closing over App state. */
export interface ResolveContext {
    units: Unit[];
    board: TileData[];
    terrainDefs: Record<string, TerrainDefinition>;
    /**
     * The squad's resonance, when every hero picked for this run carries the same element
     * (utils/elements.ts, `resonanceOf`). A property of the RUN, not of the caster — which is
     * why it arrives through the context rather than off the unit: a resonance read off the
     * hero would have to be recomputed and written onto nine bodies every time one of them
     * died, and the whole point of anchoring it to the chosen squad is that it never moves.
     *
     * OPTIONAL because most resolutions have no squad behind them: items, the tutorial replay
     * and every future headless caller build this context out of a board and nothing else, and
     * `undefined` has to mean "no resonance" for them without a single call site changing.
     */
    resonance?: ElementId;
}

/**
 * Kills no longer pay Sol by default — the free 25/50 per kill let a shooter refund
 * her own ultimate and spam it. Kill income now exists ONLY through the Sol Battery
 * fusions (SUN_ON_KILL: Sunbeam Pea / Glacial Bloom), and only on the finishing blow.
 */
export const pushKill = (actions: TurnAction[], victim: Unit, killer?: Unit | null) => {
    actions.push({ type: 'UNIT_DIE', unitId: victim.id });
    if (victim.isEnemy && victim.type !== UnitType.OBSTACLE) {
        const bonus = killer ? getFusionEffectValue(killer, 'SUN_ON_KILL') : 0;
        if (bonus > 0) {
            actions.push({ type: 'GAIN_SUN', amount: bonus, pos: victim.position });
        }
        /**
         * SOLAR ROTOR (SUN_ON_DOUBLE_KILL) — trả cho cú kết liễu THỨ HAI của lượt, và chỉ nó.
         *
         * Đếm ngay tại đây vì `pushKill` là cửa duy nhất mọi cái chết đi qua — đếm ở chỗ khác
         * là lại đi đếm hai lần. Điều kiện `=== 2` chính là luật "một lần mỗi lượt": cú thứ ba
         * trở đi vẫn tăng biến đếm nhưng không mở cổng lần nữa.
         */
        if (killer) {
            killer.killsThisTurn = (killer.killsThisTurn ?? 0) + 1;
            const doubleBonus = getFusionEffectValue(killer, 'SUN_ON_DOUBLE_KILL');
            if (doubleBonus > 0 && killer.killsThisTurn === 2) {
                actions.push({ type: 'GAIN_SUN', amount: doubleBonus, pos: victim.position });
            }
        }
        // The battle ledger: every kill credit in the game already flows through this
        // function's `killer` — the same identity SUN_ON_KILL is paid to — so the ledger
        // line rides here rather than being re-derived at each call site.
        if (killer?.heroId) {
            actions.push({ type: 'TRACK_STAT', heroId: killer.heroId, stat: 'kills', amount: 1 });
        }
    }
};

/**
 * Turns a PushPlan into actions. Kept beside pushKill so collision damage, drowning and
 * Sol-on-kill all funnel through the same place no matter which shove produced them.
 */
/**
 * MỘT CỬA DUY NHẤT CHO SÁT THƯƠNG VA CHẠM.
 *
 * Trước đây luật này được gõ tay ở ba chỗ (`applyPushPlan` dưới đây, đường hazard trong
 * `turnManager`, và bộ mô phỏng `scriptedReplay`) và chúng ĐÃ trôi khỏi nhau — đúng thứ mà chú
 * thích trong `scriptedReplay` tự cảnh báo: *"MUST stay in step with it — the armour change
 * proved the drift is real, not theoretical."* Ba chỗ lệch tìm được lúc gộp:
 *
 *  1. `turnManager` KHÔNG truyền `ignoresArmor` → va chạm trong lượt địch bị giáp mũ nuốt, còn
 *     va chạm trong lượt người chơi thì không. Cùng một luật, hai kết quả.
 *  2. `applyPushPlan` KHÔNG ghi lại `shield` → lớp chắn ăn cú va chạm mà không vỡ, nên một thân
 *     có layer chặn được vô hạn cú slam. Trái thẳng mô hình §6.0 ("một lớp chặn trọn một nguồn
 *     rồi vỡ").
 *  3. `turnManager` bỏ luôn `lastStandSpent` → lời hứa MỘT-LẦN-MỖI-TRẬN âm thầm reset.
 *
 * Trả về `DamageResult` thay vì tự kết liễu, vì mỗi nơi gọi có sổ tử riêng (`pushKill` ở đây,
 * `killUnit` trong turnManager). Trả `null` khi thân đã chết hoặc được miễn.
 */
export const applyCollisionDamage = (
    unit: Unit,
    amount: number,
    actions: TurnAction[],
): ReturnType<typeof calculateDamage> | null => {
    if (unit.hp <= 0) return null;

    // Iron Bulwark và họ hàng: thân đã chống thì cú slam không làm gì. Vẫn phát BLOCK để người
    // chơi thấy nó đã chặn, chứ không phải đòn bị nuốt mất.
    if (hasFusionEffect(unit, 'STEADFAST')) {
        actions.push({ type: 'APPLY_DAMAGE', targetId: unit.id, amount: 0, eventType: 'BLOCK', pos: unit.position });
        return null;
    }

    // Đối số thứ 4: một cú slam BỎ QUA giáp mũ. Cái xô giữ được viên đậu, không giữ được bức
    // tường đang lao tới. Đây cũng là thứ giữ hai hero đẩy còn việc làm trước một hàng giáp —
    // thiếu nó, giáp âm thầm xoá đúng điểm va chạm vốn là sát thương DUY NHẤT của Chardslam.
    const r = calculateDamage(unit, amount, false, true);

    if (r.shieldDamage > 0) {
        actions.push({ type: 'APPLY_DAMAGE', targetId: unit.id, amount: 0, eventType: 'BLOCK', pos: unit.position });
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: unit.id, updates: shieldUpdatesFor(r) });
    } else {
        actions.push({ type: 'APPLY_DAMAGE', targetId: unit.id, amount: r.finalDamage, eventType: 'DAMAGE', pos: unit.position });
    }
    if (r.bleedConsumed) {
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: unit.id, updates: { statusEffects: [...unit.statusEffects] } });
    }
    // Đường này không ghi action lớp chắn khi CHỈ có last stand nổ, nên cờ một-lần-mỗi-trận
    // phải có action riêng của nó.
    if (r.lastStandSpent && r.shieldDamage <= 0) {
        actions.push({ type: 'UPDATE_UNIT_STATE', unitId: unit.id, updates: { lastStandUsed: true } });
    }

    unit.hp = r.remainingHp;
    unit.shield = r.remainingShield;
    return r;
};

export const applyPushPlan = (
    plan: ReturnType<typeof planPush>,
    actions: TurnAction[],
    sim: Map<string, Unit>,
    killer?: Unit | null,
) => {
    plan.moves.forEach(m => {
        const u = sim.get(m.unitId);
        if (!u) return;
        actions.push({ type: 'UNIT_MOVE', unitId: m.unitId, path: [m.to], isForced: true });
        u.position = m.to;
    });

    /**
     * The battle ledger — the only place a 0-damage hero's turns become numbers.
     *
     * `killer` doubles as the shove's author (it is the same unit; the parameter predates the
     * ledger). One line per BODY, not per tile: `plan.moves` holds one entry per step, and a
     * Chardslam throw across two tiles is one shove — counting it twice would make the column
     * a distance meter. Enemy bodies only, for the friendly-fire reason the damage ledger
     * gives: repositioning your own hero is a cost of the play, not its output.
     */
    if (killer?.heroId) {
        const shoved = new Set(plan.moves.map(m => m.unitId));
        let bodies = 0;
        shoved.forEach(id => { if (sim.get(id)?.isEnemy) bodies += 1; });
        if (bodies > 0) {
            actions.push({ type: 'TRACK_STAT', heroId: killer.heroId, stat: 'pushes', amount: bodies });
        }
        if (plan.doused.length > 0) {
            actions.push({ type: 'TRACK_STAT', heroId: killer.heroId, stat: 'intentsCancelled', amount: plan.doused.length });
        }
    }

    // A warded Greenspire ate the shove (gameLogic, PushPlan.wardedHouses): the layer breaks, the
    // sprout stays. Cleared here because the plan is pure and someone has to own the write.
    plan.wardedHouses.forEach(p => {
        actions.push({ type: 'MODIFY_TERRAIN', pos: { ...p }, shielded: false });
        actions.push({ type: 'APPLY_DAMAGE', targetId: 'tile', amount: 0, eventType: 'BLOCK', pos: p });
    });

    plan.drowned.forEach(id => {
        const u = sim.get(id);
        if (!u) return;
        actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: 0, eventType: 'DROWN', pos: u.position });
        u.hp = 0;
        pushKill(actions, u, killer ?? undefined);
    });

    /**
     * A boss that went in the water and lived. It keeps its health and its tile — and loses the
     * turn it had already promised.
     *
     * That trade is the whole point of letting bosses be shoved at all. Instant death from one
     * tile of leverage would have made Chardslam a delete button on eight of the ten bosses;
     * nothing at all would have made a shove into the sea look like a bug. Costing the boss its
     * telegraphed action is the reading that keeps both the push and the boss meaningful.
     *
     * A WAIT intent rather than clearing the field: the telegraph layer reads `intent` to draw
     * what is coming, and an absent one would simply show nothing — the player would have to
     * infer that the shove worked. WAIT says it.
     */
    plan.doused.forEach(id => {
        const u = sim.get(id);
        if (!u) return;
        actions.push({ type: 'APPLY_DAMAGE', targetId: id, amount: 0, eventType: 'DROWN', pos: u.position });
        actions.push({ type: 'UPDATE_INTENT', unitId: id, intent: { type: 'WAIT', description: 'Dragged out of the water...' } });
        u.intent = { type: 'WAIT', description: 'Dragged out of the water...' };
    });

    // Shoved into a live Greenspire: the sprout is gone and the zombie walks off with it. Not a
    // kill — no death animation, no Sol. BRAIN_LOST is the same action a zombie that walked
    // in on its own turn produces, so the reducer's counter cannot drift between the two.
    plan.tookBrain.forEach(({ unitId, Greenspire }: { unitId: string; Greenspire: Position }) => {
        const u = sim.get(unitId);
        if (!u) return;
        actions.push({ type: 'BRAIN_LOST', pos: Greenspire, unitId });
        u.hp = 0;
    });

    plan.collided.forEach(id => {
        const u = sim.get(id);
        if (!u) return;
        const r = applyCollisionDamage(u, 1, actions);
        if (r?.isFatal) pushKill(actions, u, killer ?? undefined);
    });
};
