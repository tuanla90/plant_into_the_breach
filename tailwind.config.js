/**
 * Cấu hình này CHÉP NGUYÊN VĂN từ khối `tailwind.config` inline ngày trước ở index.html
 * (thời còn chạy cdn.tailwindcss.com). CDN runtime biên dịch CSS ngay trên máy người
 * chơi — trên điện thoại tốn cả trăm ms main-thread lúc mở game và mỗi lần DOM đổi.
 * Giờ Tailwind chạy lúc build; sửa theme thì sửa Ở ĐÂY, đừng thêm lại script CDN.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './data/**/*.ts',
    './utils/**/*.{ts,tsx}',
    './i18n/**/*.ts',
  ],
  theme: {
    extend: {
      screens: {
        // Màn THẤP (điện thoại cầm ngang) — bất kể rộng bao nhiêu. Dùng cho các
        // nhượng bộ kiểu "ẩn thông tin phụ để giữ art to" mà portrait/desktop không cần.
        'short': { raw: '(max-height: 520px)' },
      },
      fontFamily: {
        'pixel': ['"Be Vietnam Pro"', 'sans-serif'],
        'display': ['"VT323"', 'monospace'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        'itb-bg': '#0b0d12',
        'itb-panel': '#13161f',
        'itb-panel-light': '#1b202c',
        'itb-border': '#293245',
        'itb-accent': '#38bdf8',
        'itb-green': '#10b981',
        'itb-yellow': '#f59e0b',
        'itb-red': '#ef4444',
        'lawn-light': '#81C784',
        'lawn-dark': '#66BB6A',
      },
      backgroundImage: {
        'grass-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2310b981' fill-opacity='0.08' fill-rule='evenodd'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/svg%3E\")",
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 30 0 L 0 0 0 30' fill='none' stroke='rgba(56, 189, 248, 0.07)' stroke-width='1.5'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
