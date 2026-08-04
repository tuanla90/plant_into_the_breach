import { HERO_SPRITES, ICONS } from '../utils/icons';

/**
 * PRE-NODE DIALOGUE for the tutorial chain (data/tutorial.ts).
 *
 * One short scene before each node, so the seven boards read as a story instead of seven
 * disconnected exercises: Sunspot down → she recovers → Shadeleaf falls → the
 * merchant → Ironhusk takes point → Penny appears → the reunion at the campfire → the
 * unwinnable boss and the timeline jump.
 *
 * Written in Vietnamese directly, like every other tutorial string (briefs, notes) —
 * the tutorial is authored content, not translated content. Lines still pass through
 * t(), so an English dictionary could be added later without touching this file.
 *
 * Rules:
 *   - 3–6 lines per scene. It plays BEFORE the node, so it must never spoil the outcome
 *     of the board itself (board 2 does not announce the death it is about to script).
 *     The shop and campfire scenes run to six because those nodes now teach a mechanic
 *     rather than just setting a mood — the extra lines are the rule the overlay is about
 *     to make the player perform, said once in a character's voice first.
 *   - A scene shows once per run. Skippable with one click.
 */

export interface DialogueLine {
    /** Speaker display name. */
    name: string;
    /** Portrait image. */
    img: string;
    /** Portrait side; alternate to read like a conversation. */
    side: 'left' | 'right';
    text: string;
    /** Accent color for the name plate. */
    color?: string;
    /**
     * Map legend entries this line describes, by node type. The legend is pinned open during
     * the opening dialogue and these light up while the line naming them is on screen —
     * five symbols listed in one breath is a paragraph nobody maps back to the icons alone.
     */
    highlight?: string[];
}

// Hero names, not plant-class names: these are the characters talking, so they use the
// same names the rest of the game shows (data/heroes.ts).
const GS = { name: 'Shadeleaf', img: HERO_SPRITES.GREEN_SHADOW, color: '#4ade80' };
const SF = { name: 'Sunspot', img: HERO_SPRITES.SOLAR_FLARE, color: '#fb923c' };
const WK = { name: 'Ironhusk', img: HERO_SPRITES.WALL_KNIGHT, color: '#f59e0b' };
const DAVE = { name: 'Old Mulch', img: '/img/portrait-mulch.jpg', color: '#facc15' };
const PENNY = { name: 'Chrona', img: '/img/portrait-chrona.jpg', color: '#38bdf8' };
const ZOMBIE = { name: 'Zombie', img: ICONS.ZOMBIE, color: '#f87171' };
const GARG = { name: 'Gargantuar', img: ICONS.GARGANTUAR, color: '#ef4444' };

export const TUTORIAL_DIALOGUES: Record<string, DialogueLine[]> = {
    // Shown once when the tutorial MAP first opens (not tied to a node): picks up from the
    // intro comic's final rooftop panel, explains the map symbols, and states the run's
    // goal — follow the path, find the lost squadmates, take the world back.
    tut_map: [
        { ...GS, side: 'left', text: 'Đây là những gì còn lại của thành phố — từng điểm sáng nối nhau thành một con đường. Đường chỉ có tiến, không có lùi.' },
        { ...GS, side: 'left', text: 'Nhìn ký hiệu mà chọn lối: KIẾM là giao tranh. TÚI VÀNG là trạm tiếp tế. LỀU là điểm nghỉ an toàn. DẤU HỎI là tín hiệu chưa rõ — có thể là quà, có thể là bẫy.', highlight: ['BATTLE', 'SHOP', 'CAMPFIRE', 'EVENT'] },
        { ...GS, side: 'left', text: 'Còn VƯƠNG MIỆN đỏ ở cuối đường... là thứ đã xé nát quảng trường đêm đó.', highlight: ['BOSS'] },
        { ...GS, side: 'left', text: 'Đêm tháo chạy, tôi lạc mất các bạn mình. Họ vẫn còn sống ngoài kia — tôi tin vậy.' },
        { ...GS, side: 'left', text: 'Đi theo con đường. Tìm từng người một. Rồi cùng nhau giành lại thế giới này.' },
    ],

    tut_1: [
        { ...SF, side: 'left', text: '...đầu óc quay cuồng... tôi không đứng dậy nổi...' },
        { ...GS, side: 'right', text: 'Nằm yên. Có tôi ở đây.' },
        { ...ZOMBIE, side: 'left', text: 'Nãooo...' },
        { ...GS, side: 'right', text: 'Chúng tới rồi. Chỉ cần sống qua ba lượt — tôi lo phần còn lại.' },
    ],

    tut_2: [
        { ...SF, side: 'left', text: 'Tôi khỏe lại rồi! Lần này để tôi giúp.' },
        { ...GS, side: 'right', text: 'Nghe kỹ. Zombie không đi lung tung — chúng đánh hơi thấy NÃO.' },
        { ...SF, side: 'left', text: 'Vậy... mấy cái hố trên mặt đất kia là gì?' },
        { ...GS, side: 'right', text: 'Nơi chúng chui lên. Đứng chắn lên miệng hố là bịt được. Đi thôi.' },
    ],

    tut_3: [
        { ...DAVE, side: 'right', text: 'HÀNG NÓNG ĐÂYYYY! Ơ kìa... thiếu một người thì phải?' },
        { ...SF, side: 'left', text: '...Shadeleaf đã không qua khỏi.' },
        { ...DAVE, side: 'right', text: 'Nghe chú nói này nhóc. Cây dự bị không thay được NGƯỜI — nhưng thay được VỊ TRÍ. Ai đó phải đứng vào chỗ trống.' },
        { ...DAVE, side: 'right', text: 'Kệ trên là CÂY: ra trận thay người, sống sót thì về ghế đánh tiếp. Nhưng chúng còn non — mỗi chuyến ra ngoài hít bụi độc là rụng một máu, không tự lại được. Kệ dưới là VẬT PHẨM: nổ một phát rồi hết.' },
        { ...SF, side: 'left', text: 'Vậy cháu tiêu hết chỗ Xu này được không?' },
        { ...DAVE, side: 'right', text: 'ĐỪNG. Đường còn dài, và có những thứ chỉ mua được bằng Xu để dành. Chú nói vậy thôi.' },
    ],

    tut_4: [
        { ...WK, side: 'left', text: 'Từ giờ tôi đi đầu. Không ai gục thêm nữa.' },
        { ...SF, side: 'right', text: 'Ba con, hai căn nhà, hai hướng... mình không kịp cứu cả hai đâu.' },
        { ...WK, side: 'left', text: 'Ừ. Đánh trận là phải chọn. Nghe kỹ này: mỗi quả não mất là mất VĨNH VIỄN. Hết cả 5 quả — thua trắng cả hành trình.' },
        { ...WK, side: 'left', text: 'Và nếu để chúng ăn sạch não ngay trong MỘT trận... cũng kết thúc luôn tại đó.' },
        { ...WK, side: 'left', text: 'Khiên của tôi không giết nổi ai, nhưng ĐẨY được tất cả. Cú đẩy văng theo hướng từ TÔI ra — đứng sai phía là tự tay hất nó vào nhà.' },
        { ...SF, side: 'right', text: 'Còn quả Mìn Khoai Tây mua hôm trước — gài xuống đất, con nào giẫm phải thì tự nổ. Để dành cho con trâu nhất ấy.' },
    ],

    tut_5: [
        { ...PENNY, side: 'right', text: 'TÍCH... TÍCH... Xin chào. Tôi là Chrona — cỗ máy thời gian.' },
        { ...SF, side: 'left', text: 'Máy... thời gian?' },
        { ...PENNY, side: 'right', text: 'Dòng thời gian này đang mục rữa. Nhưng tôi còn giữ lại được một thứ mà các bạn tưởng đã mất. Lại gần xem đi.' },
        { ...SF, side: 'left', text: 'Cái này... là một lựa chọn à? Cháu chọn sai thì sao?' },
        { ...PENNY, side: 'right', text: 'Sự kiện luôn nói trước bạn ĐƯỢC gì và MẤT gì. Đọc kỹ, rồi chọn. Không có nút quay lại.' },
    ],

    tut_6: [
        { ...WK, side: 'left', text: 'Nghỉ ở đây. Có lửa, có tường chắn. An toàn.' },
        { ...GS, side: 'right', text: '...Tôi bỏ lỡ gì không?' },
        { ...SF, side: 'left', text: 'SHADELEAF!! Cậu... cậu thật sự trở lại rồi!' },
        { ...PENNY, side: 'right', text: 'Ghi chú kỹ thuật: cây mua được chỉ HỢP NHẤT được ở điểm nghỉ như thế này. Không ai phẫu thuật giữa chiến trường cả.' },
        { ...GS, side: 'right', text: 'Hợp nhất... nghĩa là cái cây đó biến mất khỏi ghế dự bị?' },
        { ...PENNY, side: 'right', text: 'Đúng — và ghép thì cần cây LÀNH LẶN. Cây đã ra trận sứt mẻ phải ngủ một đêm bên lửa cho đầy máu đã. Càng dùng làm dự bị lâu, càng phải trả giá để ghép.' },
    ],

    tut_7: [
        { ...WK, side: 'left', text: '...Mặt đất đang rung. Cảm nhận thấy không?' },
        { ...GARG, side: 'right', text: 'GRAAAAAH.' },
        { ...GS, side: 'left', text: 'Hai mươi máu. Thứ đó... chúng ta không hạ nổi.' },
        // Ironhusk's whole kit is the shove — and the boss is the one thing it cannot move.
        // Said BEFORE the fight so the on-board IMMUNE popup reads as confirmation, not bug.
        { ...WK, side: 'left', text: 'Khiên của tôi đẩy được mọi thứ... nhưng thứ đó quá to. Nó sẽ không lùi một bước nào đâu.' },
        { ...PENNY, side: 'right', text: 'Chính xác. Và khi thua, tôi sẽ NHẢY — quay ngược dòng thời gian, làm lại từ đầu. Thua không phải kết thúc. Thua là dữ liệu.' },
        { ...WK, side: 'left', text: 'Vậy thì trước khi tua lại... cho nó biết mùi đã.' },
    ],
};
