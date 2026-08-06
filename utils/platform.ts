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

/**
 * Trên cảm ứng, đổi sprite board 512×512 sang bản 128×128 trong img/small/
 * (sinh bởi scripts hạ cỡ — đủ nét vì ô bàn cờ trên điện thoại chỉ ~36-52px,
 * còn GPU thoát cảnh kéo texture to gấp 14 lần mỗi khung hình animation).
 * Chỉ áp cho sprite-/gear-/item-*.png — art trưng bày lớn (hero-*.jpg, cover,
 * event) không có bản nhỏ và giữ nguyên chất lượng.
 */
export const mobileSprite = (url: string): string =>
    IS_COARSE_POINTER
        ? url.replace(/(^|\/)img\/((?:sprite|gear|item)-[^/]+\.png)$/, '$1img/small/$2')
        : url;
