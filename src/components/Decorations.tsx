export function FloralCorner({ className = '' }: { className?: string }) {
  return <svg className={`floral-corner ${className}`} viewBox="0 0 260 300" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.1">
      <path d="M-5 282C26 238 30 187 42 141S86 67 108-10M5 258C77 241 84 183 141 144S210 97 256 6M38 168C59 145 79 151 99 124M71 234C133 230 159 204 185 167" />
      <path d="M41 142C10 124 8 102 15 84c28 8 35 29 26 58Zm17-40c-3-28 13-50 34-51 8 25-8 46-34 51ZM81 192c-4-29 9-52 35-57 7 29-7 49-35 57Zm47-37c-2-24 14-44 37-45 4 24-12 42-37 45ZM20 219c-26-13-26-40-14-52 24 10 27 31 14 52Zm140-22c-3-25 12-39 32-42 6 25-12 36-32 42Z" />
      <path d="M136 89c-15-27-5-41 6-43 15 3 20 20-6 43Zm0 0c-29 4-40-7-37-18 8-10 25-9 37 18Zm0 0c24-12 42-4 43 10-9 14-25 9-43-10Zm0 0c4 29-6 43-19 39-13-12-4-29 19-39Z" />
      <path d="M50 257c-17-24-8-37 2-40 14 1 21 17-2 40Zm0 0c-26 7-39-2-38-13 6-11 22-12 38 13Zm0 0c23-14 40-7 43 4-7 15-23 13-43-4Zm0 0c8 25 0 40-12 39-13-9-7-27 12-39Z" />
      <circle cx="136" cy="89" r="3" /><circle cx="50" cy="257" r="3" />
      <path d="M208 65c-7-14-1-23 7-24 7 9 4 17-7 24Zm-111 154c20-4 31 3 31 14-15 4-24-2-31-14" />
    </g>
  </svg>;
}
export function Divider() { return <div className="ornament-divider" aria-hidden="true"><span />✧<span /></div>; }
export function WeddingLogo({ className = '' }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}logo-cover.svg`} alt="ตราสัญลักษณ์บ่าวสาว" className={`wedding-logo ${className}`} />;
}
