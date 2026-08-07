import { HERO_SPRITES, ICONS } from '../utils/icons';

/**
 * PRE-NODE DIALOGUE for the tutorial chain (data/tutorial.ts).
 *
 * One short scene before each node, so the seven boards read as a story instead of seven
 * disconnected exercises: Sunbloom down → she recovers → Peaburst falls → the
 * merchant → Ironhusk takes point → Penny appears → the reunion at the campfire → the
 * unwinnable boss and the timeline jump.
 *
 * Written in Vietnamese directly, like every other tutorial string (briefs, notes) —
 * the tutorial is authored content, not translated content. Lines still pass through
 * t(), so an English dictionary could be added later without touching this file.
 *
 * Rules:
 *   - 4–8 lines per scene. It plays BEFORE the node, so it must never spoil the outcome
 *     of the board itself (board 2 does not announce the death it is about to script).
 *     Length follows the job: a scene that only sets a mood stays at four, while the shop
 *     and campfire run longer because those nodes teach a mechanic — the extra lines are
 *     the rule the overlay is about to make the player perform, said once in a character's
 *     voice first. Board 4 is the longest at eight, and it earns them: it is where Ironhusk
 *     walks on. He is in no squad before it, so without an introduction the player met a
 *     stranger already giving orders.
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
    /**
     * A painted backdrop for this line and every line after it, until another line names a
     * different one. Set it on the FIRST line of a scene and the whole scene inherits it.
     *
     * Per-line rather than per-scene because a scene can move: board 4 is a stranger walking
     * out of a rock face, and the shot that introduces him is not the shot the squad talks
     * over afterwards. Most lines leave it unset and simply inherit.
     *
     * Optional in the strongest sense — the paintings are commissioned separately
     * (art-src/ART-PROMPTS-CUTSCENES.md) and TutorialDialogue drops the backdrop on error, so
     * a scene with no art looks exactly like it did before any of these existed.
     */
    scene?: string;
}

// Hero names, not plant-class names: these are the characters talking, so they use the
// same names the rest of the game shows (data/heroes.ts).
const GS = { name: 'Peaburst', img: HERO_SPRITES.PEABURST, color: '#4ade80' };
const SF = { name: 'Sunbloom', img: HERO_SPRITES.SUNBLOOM, color: '#fb923c' };
const WK = { name: 'Ironhusk', img: HERO_SPRITES.IRONHUSK, color: '#f59e0b' };
const DAVE = { name: 'Old Mulch', img: './img/portrait-mulch.jpg', color: '#facc15' };
const PENNY = { name: 'Chrona', img: './img/portrait-chrona.jpg', color: '#38bdf8' };
const ZOMBIE = { name: 'Walker', img: ICONS.WALKER, color: '#f87171' };
const GARG = { name: 'Gravehulk', img: ICONS.GRAVEHULK, color: '#ef4444' };

/**
 * The backdrop each scene opens on. Named here rather than inline so the eight are visible as
 * a set — they are one commission and one style, and a missing one is easier to spot in a list
 * than buried in the middle of a paragraph of dialogue.
 */
const SCENE = {
    MAP: './img/comic/cutscene-tut-map-rooftop.jpg',
    SUNSPOT: './img/comic/cutscene-hero-meet-sunspot.jpg',
    GRAVES: './img/comic/cutscene-tut-graves.jpg',
    MULCH: './img/comic/cutscene-hero-meet-mulch.jpg',
    IRONHUSK: './img/comic/cutscene-hero-meet-ironhusk.jpg',
    CHRONA: './img/comic/cutscene-hero-meet-chrona.jpg',
    CAMPFIRE: './img/comic/cutscene-hero-reunion-campfire.jpg',
    GRAVEHULK: './img/comic/cutscene-tut-gargantuar.jpg',
};

export const TUTORIAL_DIALOGUES: Record<string, DialogueLine[]> = {
    // Shown once when the tutorial MAP first opens (not tied to a node): picks up from the
    // intro comic's final rooftop panel, explains the map symbols, and states the run's
    // goal — follow the path, find the lost squadmates, take the world back.
    tut_map: [
        { ...GS, side: 'left', scene: SCENE.MAP, text: '(Trỏ tay về phía dải tàn tích) Nhìn xem... Đây là tất cả những gì còn lại. Những chấm sáng tàn úa nối liền thành con đường độc đạo. Đã bước lên đây, chỉ có tiến, không có lùi.' },
        { ...GS, side: 'left', text: 'Hãy nhìn kỹ từng dấu vết trên bản đồ: KIẾM THÉP là nơi máu rơi. TÚI VÀNG là trạm tiếp tế của lão già Old Mulch. MÁI LỀU là chút bình yên hiếm hoi để dưỡng thương. Còn DẤU HỎI... là định mệnh chưa báo trước.', highlight: ['BATTLE','SHOP','CAMPFIRE','EVENT'] },
        { ...GS, side: 'left', text: 'Và VƯƠNG MIỆN ĐỎ rực ở cuối chân trời... chính là ác mộng đã xé nát Quảng trường Neon đêm đó.', highlight: ['BOSS'] },
        { ...GS, side: 'left', text: 'Đêm tháo chạy... tôi đã để lạc mất họ. Nhưng tôi tin, ở đâu đó trong bóng tối này, đồng đội của chúng ta vẫn đang chiến đấu.' },
        { ...GS, side: 'left', text: 'Dấn bước thôi. Tìm lại từng người một, gom góp chút tàn lực cuối cùng để giành lại thế giới này!' },
    ],

    tut_1: [
        { ...GS, side: 'left', scene: SCENE.SUNSPOT, text: '(Phủi lớp tro tàn, giật mình) Sunbloom?! Cậu còn sống sao?! Cố lên, mở mắt ra nhìn tôi này!' },
        { ...SF, side: 'right', text: '(Mở mắt tiều tụy, thốt lên) ...Peaburst...? Là cậu thật sao... Đầu óc tôi quay cuồng quá... không còn chút sức lực nào để đứng dậy...' },
        { ...GS, side: 'left', text: '(Nắm chặt tay Sunbloom, giơ súng che chắn) Nằm yên đó! Đã có tôi ở đây. Không kẻ nào được chạm vào cậu!' },
        { ...ZOMBIE, side: 'right', text: '(Tiếng gầm rú khàn đục trồi lên từ màn sương) Naõooo... thịt tươi...' },
        { ...GS, side: 'left', text: 'Chúng ngửi thấy mùi sống rồi. Chỉ cần trụ vững ba lượt đấu — tôi sẽ dọn sạch lũ quái vật này!' },
    ],

    tut_2: [
        { ...SF, side: 'left', scene: SCENE.GRAVES, text: '(Gia tăng hào quang, gật đầu) Năng lượng đã hồi phục rồi! Lần này tôi sẽ không làm gánh nặng nữa!' },
        { ...GS, side: 'right', text: 'Ghi nhớ này: Zombie không lang thang vô định. Chúng lao thẳng theo mùi hương của các CĂN NHÀ.' },
        { ...SF, side: 'left', text: '(Chỉ xuống đất) Nhìn kìa... mấy cái hố đen ngòm nứt nẻ kia là sao?' },
        { ...GS, side: 'right', text: 'Nơi lòng đất thối rữa đẻ ra quái vật. Đứng đè lên miệng hố là khóa chặt đường sống của chúng. Đi thôi!' },
    ],

    tut_3: [
        { ...DAVE, side: 'left', scene: SCENE.MULCH, text: '(Rít một hơi thuốc rập rờn khói, nhìn quanh) HÀNG NÓNG ĐÂY! Hè hè... ơ kìa, sao đám nhóc lại thiếu mất một bóng người rồi?' },
        { ...SF, side: 'right', text: '(Gục đầu, nghẹn ngào) ...Peaburst... cô ấy đã ngã xuống để bảo vệ cháu...' },
        { ...DAVE, side: 'left', text: '(Thở dài, nét mặt trầm xuống) Nghe chú dặn này nhóc. Cây dự bị không bao giờ thay thế được MỘT LINH HỒN — nhưng nó gánh được VỊ TRÍ. Trận chiến không chờ ai đau thương cả.' },
        { ...DAVE, side: 'left', text: 'Kệ trên là CÂY: thay người ra trận, sống sót thì lui về dưỡng sức. Nhưng chúng non lắm, mỗi đợt hít bụi độc là rụi một nấc máu. Kệ dưới là VẬT PHẨM: nổ một phát là tan thành mây khói.' },
        { ...SF, side: 'right', text: 'Cháu... cháu tiêu hết chỗ Xu này để mua sạch đồ được không?' },
        { ...DAVE, side: 'left', text: 'ĐỪNG ngốc thế! Chặng đường phía trước còn dài lắm. Có những thứ sinh tử chỉ mua được bằng Xu tích trữ. Nhớ lấy lời lão già này!' },
    ],

    tut_4: [
        { ...SF, side: 'left', text: '(Bước đi trên tàn tích, ôm chậu cây dự bị vừa mua, nghẹn ngào) Peaburst mất rồi... một mình tôi làm sao tiếp tục hành trình này đây...' },
        // The backdrop lands on HIS line, not on hers: the scene opens on Sunbloom alone in the
        // dark, and the painting is the thing that walks into it.
        { ...WK, side: 'right', scene: SCENE.IRONHUSK, text: '(Bước ra từ hốc đá nứt, cắm phập tấm khiên thép xuống đất) Cô không đi một mình đâu, nhóc ạ.' },
        { ...SF, side: 'left', text: '(Giật mình ngước nhìn) Anh... anh là Ironhusk! Anh cũng thoát khỏi đợt tấn công ở Quảng trường sao?!' },
        { ...WK, side: 'right', text: '(Gật đầu trầm lắng) Tôi đuổi theo tiếng súng từ Cái Hố, nhưng tiếc là... đến không kịp để cứu cô ấy. Từ giờ, tôi sẽ đi đầu — không một ai được phép ngã xuống nữa!' },
        { ...SF, side: 'left', text: '(Lau nước mắt, ánh mắt kiên định hơn) Cảm ơn anh... Nhưng nhìn kìa! Ba tên quái vật đang dồn vào hai Tháp Xanh ở hai hướng... mình không thể cứu cả hai!' },
        { ...WK, side: 'right', text: 'Đúng vậy. Chiến trường đòi hỏi sự đánh đổi. Mỗi Căn Nhà mất đi là mất vĩnh viễn. Mất sạch 5 Căn Nhà — toàn bộ chiến dịch sụp đổ!' },
        { ...WK, side: 'right', text: 'Tấm khiên của tôi không hạ sát ai được, nhưng đòn ĐẨY lùi có thể chuyển hướng chúng. Hướng đẩy tính từ vị trí TÔI đứng — đứng sai góc là tự tay hất quái vào nhà!' },
        { ...SF, side: 'left', text: 'Còn quả Mìn Hạt mua từ xe hàng lão Mulch — gài xuống đất, kẻ nào giẫm lên sẽ nổ tung. Phải dành riêng cho con trâu nhất!' },
    ],

    tut_5: [
        { ...PENNY, side: 'left', scene: SCENE.CHRONA, text: '(Tiếng bánh răng vang lên tích tắc, bóng dáng bí ẩn bước ra từ sương mù) TÍCH... TÍCH... Xin chào những kẻ sống sót. Ta là Chrona — kẻ nắm giữ những mảnh vỡ thời gian.' },
        { ...SF, side: 'right', text: '(Kinh ngạc) Thời gian...? Cô có thể đảo ngược quá khứ sao?' },
        { ...PENNY, side: 'left', text: 'Dòng thời gian này đang tan rữa. Nhưng trong lòng bàn tay ta, linh hồn đã mất của các người vẫn chưa hoàn toàn tan biến. Lại gần đây...' },
        { ...SF, side: 'right', text: 'Đây là... một sự lựa chọn? Nếu chúng cháu chọn sai thì sao?' },
        { ...PENNY, side: 'left', text: 'Mỗi sự kiện đều hiện rõ cái giá phải trả và điều nhận lại. Hãy nhìn cho kỹ rồi quyết định. Thời gian không có nút quay lại đâu.' },
    ],

    tut_6: [
        { ...WK, side: 'left', scene: SCENE.CAMPFIRE, text: '(Đặt tảng đá lớn chặn gió, đốt lên đống lửa) Tạm nghỉ tại đây. Đống lửa này sẽ giữ ấm và xua đuổi bóng tối.' },
        { ...GS, side: 'right', text: '(Từ trong bước ra, xoa cổ tay) ...Tôi... tôi đã bỏ lỡ điều gì sao?' },
        { ...SF, side: 'left', text: '(Oà khóc chạy đến) PEABURST!! Cậu... cậu thực sự đã trở về từ cõi chết!' },
        { ...PENNY, side: 'right', text: 'Ghi chú kỹ thuật: Các chiến sĩ dự bị chỉ có thể HỢP NHẤT năng lượng tại những điểm nghỉ an toàn như thế này. Không ai có thể ghép tế bào giữa mưa đạn.' },
        { ...GS, side: 'left', text: 'Hợp nhất... nghĩa là linh hồn cây dự bị sẽ hòa làm một với tôi?' },
        { ...PENNY, side: 'right', text: 'Chính xác. Nhưng ghép cần một cơ thể LÀNH LẶN. Cây bị thương phải ngủ một đêm bên lửa hồng mới đủ sức tiếp nhận sức mạnh mới.' },
    ],

    tut_7: [
        { ...WK, side: 'left', scene: SCENE.GRAVEHULK, text: '(Cắm chặt khiên xuống đất) ...Mặt đất rên siết. Cả ngọn núi đang rung chuyển... Cảm nhận thấy không?' },
        { ...GARG, side: 'right', text: '(Tiếng gầm văng vẳng xé rách màng nhĩ) GRAAAAAAAAAAAAHHH!' },
        { ...GS, side: 'left', text: '(Giơ súng, tay run nhẹ) Hai mươi lăm đơn vị sinh lực... Một quái vật khổng lồ... Chúng ta không thể hạ gục nó!' },
        { ...WK, side: 'right', text: 'Tấm khiên của tôi đẩy lùi được muôn loài... nhưng thân hình nó quá đồ sộ. Nó sẽ không lùi dẫu chỉ một bước!' },
        { ...PENNY, side: 'left', text: '(Tiếng tích tắc dồn dập) Khi cái chết cận kề, ta sẽ KÍCH HOẠT VÒNG LẶP — tua ngược dòng thời gian về điểm khởi đầu. Thua cuộc không phải kết thúc. Thua cuộc là dữ liệu để sinh tồn!' },
        // The rewind BUTTON she is about to hand over mid-battle (turn 2 teaches it):
        // promised here first, so the cyan control appearing beside End Turn reads as
        // her gift, not as a random new widget.
        { ...PENNY, side: 'left', text: 'Và một món quà nhỏ: ta luôn lưu giữ KHOẢNH KHẮC ĐẦU MỖI LƯỢT. Lỡ tay đi sai một nước — cứ gọi ta TUA LẠI. Mỗi trận, đúng một lần.' },
        { ...WK, side: 'right', text: '(Nghiến răng, giơ cao khiên) Vậy thì trước khi thời gian quay ngược... hãy cho gã khổng lồ này biết thế nào là sự kiên cường của chúng ta!' },
    ],
};
