/**
 * Con trỏ "thô" = thiết bị cảm ứng (điện thoại/tablet). Hằng số module chứ không phải
 * hook: một thiết bị không đổi loại con trỏ giữa phiên chơi, và các chỗ dùng nó nằm
 * trong vòng render nóng (sprite từng card/ô) — đọc matchMedia một lần là đủ.
 *
 * Dùng để CẮT hiệu ứng thuần trang trí đắt tiền trên GPU di động (filter drop-shadow
 * trên ảnh lớn, v.v.). Hiệu ứng mang NGHĨA (silhouette hero khoá, trạng thái đóng băng)
 * thì giữ — xem từng chỗ gọi.
 */
export const IS_COARSE_POINTER =
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(pointer: coarse)').matches;
