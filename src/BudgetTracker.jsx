import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────
const DEFAULT_EXPENSE_CATEGORIES = [
  "식비", "카페/간식", "교통/차량", "주거/관리비", "통신", "구독서비스",
  "의료/건강", "쇼핑/뷰티", "문화/여가", "교육",
  "보험/세금", "경조사/선물", "반려동물", "생활용품", "기타"
];

const DEFAULT_INCOME_CATEGORIES = [
  "월급", "부수입", "용돈", "상여금", "금융소득", "중고거래", "기타수입"
];

const CATEGORY_COLORS = {
  "식비": "#FF6B6B", "카페/간식": "#E59866", "교통/차량": "#4ECDC4", "주거/관리비": "#45B7D1",
  "통신": "#96CEB4", "구독서비스": "#DDA0DD", "의료/건강": "#98D8C8",
  "쇼핑/뷰티": "#F7DC6F", "문화/여가": "#BB8FCE",
  "교육": "#85C1E9", "보험/세금": "#82E0AA", "경조사/선물": "#F1948A",
  "반려동물": "#D2B48C", "생활용품": "#AAB7B8", "기타": "#AEB6BF",
  "월급": "#2ECC71", "부수입": "#27AE60", "용돈": "#1ABC9C",
  "상여금": "#F39C12", "금융소득": "#3498DB", "중고거래": "#9B59B6", "기타수입": "#95A5A6"
};

const STORAGE_KEYS = {
  transactions: "transactions",
  recurring: "recurring",
  expenseCategories: "expense-cats",
  incomeCategories: "income-cats",
  budgets: "budgets",
  categoryColors: "cat-colors"
};

// ─── Helpers ─────────────────────────────────────────────────────────
// [BUG FIX] crypto.randomUUID 사용으로 ID 충돌 방지
const genId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const formatNum = (n) => n.toLocaleString("ko-KR");

// [BUG FIX] today()를 로컬 타임존 기준으로 계산 (UTC 기준 날짜 어긋남 방지)
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getYM = (d) => d.slice(0, 7);

// [BUG FIX] 날짜 파싱을 로컬 타임존 기준으로 처리
const parseLocalDate = (dateStr) => new Date(dateStr + "T00:00:00");

// [BUG FIX] CSV 필드 이스케이프 (쉼표/따옴표 포함된 메모 깨짐 방지)
const csvEscape = (v) => `"${String(v).replace(/"/g, '""')}"`;

// ─── Storage Helper (Supabase) ──────────────────────────────────
import { load, save } from './db.js';

// ─── Icons (inline SVG) ─────────────────────────────────────────────
const Icon = ({ d, size = 20, color = "currentColor", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d={d} />
  </svg>
);
const Icons = {
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  x: "M18 6L6 18M6 6l12 12",
  check: "M20 6L9 17l-5-5",
  chevDown: "M6 9l6 6 6-6",
  chevLeft: "M15 18l-6-6 6-6",
  chevRight: "M9 18l6-6-6-6",
  edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  repeat: "M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  wallet: "M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a1 1 0 100 2 1 1 0 000-2z",
  chart: "M18 20V10M12 20V4M6 20v-6",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  copy: "M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-4-4H8zM14 2v6h4",
};

// ─── Styles ──────────────────────────────────────────────────────────
const S = {
  root: { fontFamily: "'Pretendard Variable', 'Apple SD Gothic Neo', -apple-system, sans-serif", background: "#0A0A0F", color: "#E8E6E3", minHeight: "100vh", maxWidth: 520, margin: "0 auto", padding: "0 0 100px", position: "relative", lineHeight: 1.5 },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 520, background: "rgba(10,10,15,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", zIndex: 100, padding: "6px 0 env(safe-area-inset-bottom, 8px)" },
  navBtn: (active) => ({ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "8px 4px 4px", background: "none", border: "none", color: active ? "#6C9CFF" : "#555", fontSize: 10, fontWeight: 500, cursor: "pointer", transition: "color .2s" }),
  header: { padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 26, fontWeight: 700, letterSpacing: -0.5, background: "linear-gradient(135deg, #6C9CFF, #B47AFF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  card: { background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: "18px 20px", margin: "12px 20px", border: "1px solid rgba(255,255,255,0.06)" },
  cardTitle: { fontSize: 13, color: "#777", fontWeight: 500, marginBottom: 8, letterSpacing: 0.3 },
  btn: (bg = "#6C9CFF") => ({ background: bg, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", transition: "opacity .2s" }),
  btnSm: (bg = "rgba(108,156,255,0.15)", c = "#6C9CFF") => ({ background: bg, color: c, border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .2s" }),
  btnGhost: { background: "none", border: "none", color: "#888", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" },
  input: { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#E8E6E3", fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color .2s" },
  select: { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#E8E6E3", fontSize: 15, outline: "none", boxSizing: "border-box", appearance: "none" },
  label: { fontSize: 13, color: "#999", fontWeight: 500, marginBottom: 6, display: "block" },
  tag: (bg) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: bg || "rgba(108,156,255,0.15)", color: "#fff" }),
  divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" },
  modalContent: { background: "#16161F", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "auto", padding: "24px 20px 40px" },
  empty: { textAlign: "center", padding: "40px 20px", color: "#555", fontSize: 14 },
};

// ─── Components ──────────────────────────────────────────────────────

// ── Month Picker ──
function MonthPicker({ value, onChange }) {
  const [y, m] = value.split("-").map(Number);
  const prev = () => { const d = new Date(y, m - 2, 1); onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };
  const next = () => { const d = new Date(y, m, 1); onChange(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`); };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <button onClick={prev} style={S.btnGhost}><Icon d={Icons.chevLeft} size={18} /></button>
      <span style={{ fontSize: 17, fontWeight: 600, minWidth: 110, textAlign: "center" }}>{y}년 {m}월</span>
      <button onClick={next} style={S.btnGhost}><Icon d={Icons.chevRight} size={18} /></button>
    </div>
  );
}

// ── Category Chip ──
function CatChip({ name, colors }) {
  const bg = (colors && colors[name]) || CATEGORY_COLORS[name] || "#555";
  return <span style={{ ...S.tag(bg + "33"), color: bg }}>{name}</span>;
}

// ── Transaction Row ──
function TxRow({ tx, colors, onEdit, onDelete }) {
  const isIncome = tx.type === "income";
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "12px 0", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <CatChip name={tx.category} colors={colors} />
          {tx.isRecurring && <span style={{ fontSize: 11, color: "#B47AFF" }}>반복</span>}
        </div>
        {tx.memo && <div style={{ fontSize: 13, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.memo}</div>}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: isIncome ? "#2ECC71" : "#FF6B6B", fontVariantNumeric: "tabular-nums" }}>
          {isIncome ? "+" : "-"}{formatNum(tx.amount)}원
        </div>
        <div style={{ fontSize: 11, color: "#666" }}>{tx.date.slice(5)}</div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button onClick={() => onEdit(tx)} style={S.btnGhost}><Icon d={Icons.edit} size={15} color="#666" /></button>
        <button onClick={() => onDelete(tx.id)} style={S.btnGhost}><Icon d={Icons.trash} size={15} color="#666" /></button>
      </div>
    </div>
  );
}

// ── Donut Chart ──
function DonutChart({ data }) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  let cum = 0;
  const size = 140, cx = 70, cy = 70, r = 54, sw = 24;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((d, i) => {
          const pct = d.value / total;
          const dashLen = 2 * Math.PI * r;
          const offset = cum * dashLen;
          cum += pct;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={d.color} strokeWidth={sw}
              strokeDasharray={`${pct * dashLen} ${dashLen}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray .5s" }} />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#999" fontSize={11}>총 지출</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#E8E6E3" fontSize={16} fontWeight="700">{formatNum(total)}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
        {data.slice(0, 6).map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ color: "#aaa" }}>{d.name}</span>
            <span style={{ color: "#ccc", fontWeight: 600, marginLeft: "auto" }}>{Math.round(d.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── [NEW] Trend Chart - 6개월 수입/지출 막대 ──
function TrendChart({ transactions }) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const data = months.map(ym => {
    const txs = transactions.filter(t => getYM(t.date) === ym);
    const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { ym, income, expense, label: ym.slice(5) + "월" };
  });
  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2, width: "100%" }}>
              <div style={{ flex: 1, background: "rgba(46,204,113,0.5)", borderRadius: "3px 3px 0 0", height: `${d.income / maxVal * 100}%`, minHeight: d.income > 0 ? 3 : 0, transition: "height .5s" }} />
              <div style={{ flex: 1, background: "rgba(255,107,107,0.5)", borderRadius: "3px 3px 0 0", height: `${d.expense / maxVal * 100}%`, minHeight: d.expense > 0 ? 3 : 0, transition: "height .5s" }} />
            </div>
            <span style={{ fontSize: 10, color: "#666", marginTop: 4, whiteSpace: "nowrap" }}>{d.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#aaa" }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(46,204,113,0.7)", display: "inline-block" }} />수입
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#aaa" }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(255,107,107,0.7)", display: "inline-block" }} />지출
        </span>
      </div>
    </div>
  );
}

// ── Budget Bar ──
function BudgetBar({ spent, budget }) {
  const pct = budget > 0 ? Math.min(spent / budget * 100, 100) : 0;
  const over = spent > budget && budget > 0;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: over ? "#FF6B6B" : "#999" }}>{formatNum(spent)}원 사용</span>
        <span style={{ color: "#666" }}>{formatNum(budget)}원</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: over ? "linear-gradient(90deg,#FF6B6B,#FF4757)" : "linear-gradient(90deg,#6C9CFF,#B47AFF)", borderRadius: 3, transition: "width .5s" }} />
      </div>
    </div>
  );
}

// ── Calendar ──
function Calendar({ month, transactions, onDateClick, selectedDate }) {
  const [y, m] = month.split("-").map(Number);
  const firstDay = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const todayStr = today();

  const dailyMap = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const day = parseInt(t.date.slice(8, 10));
      if (!map[day]) map[day] = { income: 0, expense: 0 };
      if (t.type === "income") map[day].income += t.amount;
      else map[day].expense += t.amount;
    });
    return map;
  }, [transactions]);

  const weeks = [];
  let week = new Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div style={{ margin: "12px 20px", background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {dayLabels.map((l, i) => (
          <div key={i} style={{ textAlign: "center", padding: "10px 0 8px", fontSize: 11, fontWeight: 600, color: i === 0 ? "#FF6B6B" : i === 6 ? "#6C9CFF" : "#666" }}>{l}</div>
        ))}
      </div>
      {weeks.map((wk, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: wi < weeks.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          {wk.map((d, di) => {
            if (d === null) return <div key={di} />;
            const dateStr = `${month}-${String(d).padStart(2, "0")}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const data = dailyMap[d];
            const dayOfWeek = new Date(y, m - 1, d).getDay();
            return (
              <div key={di} onClick={() => onDateClick && onDateClick(dateStr)}
                style={{
                  padding: "8px 2px 10px", textAlign: "center", cursor: "pointer",
                  background: isSelected ? "rgba(108,156,255,0.18)" : isToday ? "rgba(108,156,255,0.08)" : "transparent",
                  borderRadius: 0, minHeight: 72, transition: "background .15s", position: "relative",
                  borderLeft: isSelected ? "2px solid #6C9CFF" : "2px solid transparent",
                }}>
                <div style={{
                  fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400, marginBottom: 4,
                  color: isSelected ? "#6C9CFF" : isToday ? "#6C9CFF" : dayOfWeek === 0 ? "#FF6B6B" : dayOfWeek === 6 ? "#6C9CFF" : "#ccc",
                }}>
                  {isToday
                    ? <span style={{ background: "#6C9CFF", color: "#0A0A0F", borderRadius: "50%", width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{d}</span>
                    : d}
                </div>
                {data && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                    {data.income > 0 && <span style={{ fontSize: 10, color: "#2ECC71", fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>+{formatNum(data.income)}</span>}
                    {data.expense > 0 && <span style={{ fontSize: 10, color: "#FF6B6B", fontWeight: 600, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>-{formatNum(data.expense)}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Modal ──
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modalContent} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 19, fontWeight: 700 }}>{title}</span>
          <button onClick={onClose} style={S.btnGhost}><Icon d={Icons.x} size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Form Field ──
function Field({ label, children }) {
  return <div style={{ marginBottom: 16 }}><label style={S.label}>{label}</label>{children}</div>;
}

// ── [NEW] Amount Input - 자동 콤마 포맷 ──
const AmountInput = React.forwardRef(function AmountInput({ value, onChange, style }, ref) {
  const display = value ? parseInt(value).toLocaleString("ko-KR") : "";
  return (
    <input
      ref={ref}
      style={style}
      type="text"
      inputMode="numeric"
      placeholder="0"
      value={display}
      onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ""))}
    />
  );
});

// ── [NEW] Toast - 실행취소 알림 ──
function Toast({ toast, onHide }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onHide, 3500);
    return () => clearTimeout(t);
  }, [toast, onHide]);

  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: "#2A2A35", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center",
      gap: 12, zIndex: 300, maxWidth: 320, width: "calc(100% - 40px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <span style={{ flex: 1, fontSize: 14, color: "#ccc" }}>{toast.message}</span>
      {toast.undo && (
        <button onClick={() => { toast.undo(); onHide(); }}
          style={{ ...S.btnSm("rgba(108,156,255,0.2)", "#6C9CFF"), flexShrink: 0 }}>
          실행취소
        </button>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────
export default function BudgetTracker() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("home");
  const [month, setMonth] = useState(getYM(today()));
  const [transactions, setTransactions] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [expCats, setExpCats] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [incCats, setIncCats] = useState(DEFAULT_INCOME_CATEGORIES);
  const [catColors, setCatColors] = useState(CATEGORY_COLORS);
  const [budgets, setBudgets] = useState({});
  const [showTxModal, setShowTxModal] = useState(false);
  const [showRecModal, setShowRecModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [editRec, setEditRec] = useState(null);
  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [minAmt, setMinAmt] = useState("");   // [NEW] 금액 범위 필터
  const [maxAmt, setMaxAmt] = useState("");
  const [toast, setToast] = useState(null);   // [NEW] 토스트
  const hideToast = useCallback(() => setToast(null), []);
  const amountRef = useRef(null);
  const [txSubmitting, setTxSubmitting] = useState(false);

  // Form state
  const [fType, setFType] = useState("expense");
  const [fAmount, setFAmount] = useState("");
  const [fCat, setFCat] = useState("");
  const [fDate, setFDate] = useState(today());
  const [fMemo, setFMemo] = useState("");
  // Recurring form
  const [rType, setRType] = useState("expense");
  const [rAmount, setRAmount] = useState("");
  const [rCat, setRCat] = useState("");
  const [rDay, setRDay] = useState("1");
  const [rMemo, setRMemo] = useState("");
  // Category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState("expense");
  const [newCatColor, setNewCatColor] = useState("#6C9CFF");
  // Budget form
  const [budgetCat, setBudgetCat] = useState("");
  const [budgetAmt, setBudgetAmt] = useState("");
  // Calendar
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Load Data ──
  useEffect(() => {
    (async () => {
      const [txs, recs, ecs, ics, buds, cols] = await Promise.all([
        load(STORAGE_KEYS.transactions, []),
        load(STORAGE_KEYS.recurring, []),
        load(STORAGE_KEYS.expenseCategories, DEFAULT_EXPENSE_CATEGORIES),
        load(STORAGE_KEYS.incomeCategories, DEFAULT_INCOME_CATEGORIES),
        load(STORAGE_KEYS.budgets, {}),
        load(STORAGE_KEYS.categoryColors, CATEGORY_COLORS),
      ]);
      setTransactions(txs);
      setRecurring(recs);

      setExpCats(ecs && ecs.length > 0 ? ecs : DEFAULT_EXPENSE_CATEGORIES);
      setIncCats(ics && ics.length > 0 ? ics : DEFAULT_INCOME_CATEGORIES);
      setBudgets(buds);
      setCatColors(cols);
      setLoaded(true);
    })();
  }, []);

  // ── [BUG FIX] Auto-apply recurring
  // functional setState 사용으로 stale closure 방지 (transactions를 deps에서 제거)
  useEffect(() => {
    if (!loaded || !recurring.length) return;
    const ym = getYM(today());
    setTransactions(prev => {
      const existingRecIds = prev
        .filter(t => t.recurringId && getYM(t.date) === ym)
        .map(t => t.recurringId);
      const missing = recurring.filter(r => !existingRecIds.includes(r.id));
      if (!missing.length) return prev;
      const newTxs = missing.map(r => ({
        id: genId(), type: r.type, amount: r.amount, category: r.category,
        date: `${ym}-${String(r.day).padStart(2, "0")}`,
        memo: r.memo || "", isRecurring: true, recurringId: r.id
      }));
      const updated = [...prev, ...newTxs];
      save(STORAGE_KEYS.transactions, updated);
      return updated;
    });
  }, [loaded, recurring]);

  // ── Save helpers ──
  const saveTx = useCallback((txs) => { setTransactions(txs); save(STORAGE_KEYS.transactions, txs); }, []);
  const saveRec = useCallback((recs) => { setRecurring(recs); save(STORAGE_KEYS.recurring, recs); }, []);
  const saveCats = useCallback((type, cats) => {
    if (type === "expense") { setExpCats(cats); save(STORAGE_KEYS.expenseCategories, cats); }
    else { setIncCats(cats); save(STORAGE_KEYS.incomeCategories, cats); }
  }, []);
  const saveColors = useCallback((cols) => { setCatColors(cols); save(STORAGE_KEYS.categoryColors, cols); }, []);
  const saveBudgets = useCallback((buds) => { setBudgets(buds); save(STORAGE_KEYS.budgets, buds); }, []);

  // ── Computed ──
  const monthTxs = useMemo(() =>
    transactions.filter(t => getYM(t.date) === month).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, month]
  );

  const filteredTxs = useMemo(() => {
    let list = monthTxs;
    if (filterType !== "all") list = list.filter(t => t.type === filterType);
    if (searchQ) list = list.filter(t => t.category.includes(searchQ) || (t.memo && t.memo.includes(searchQ)));
    // [NEW] 금액 범위 필터
    if (minAmt) list = list.filter(t => t.amount >= parseInt(minAmt));
    if (maxAmt) list = list.filter(t => t.amount <= parseInt(maxAmt));
    return list;
  }, [monthTxs, filterType, searchQ, minAmt, maxAmt]);

  const summary = useMemo(() => {
    const income = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [monthTxs]);

  const expByCategory = useMemo(() => {
    const map = {};
    monthTxs.filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value, color: catColors[name] || "#555" })).sort((a, b) => b.value - a.value);
  }, [monthTxs, catColors]);

  const monthBudget = budgets[month] || {};
  const totalBudget = Object.values(monthBudget).reduce((s, v) => s + v, 0);

  // ── Handlers ──
  const openAddTx = (overrideDate) => {
    setEditTx(null);
    setFType("expense"); setFAmount(""); setFCat(""); setFDate(overrideDate || today()); setFMemo("");
    setShowTxModal(true);
  };
  const openEditTx = (tx) => {
    setEditTx(tx);
    setFType(tx.type); setFAmount(String(tx.amount)); setFCat(tx.category); setFDate(tx.date); setFMemo(tx.memo || "");
    setShowTxModal(true);
  };
  const submitTx = () => {
    const amt = parseInt(fAmount);
    // [BUG FIX] amt <= 0 체크 추가 (음수/0 입력 방지)
    if (!amt || amt <= 0 || !fCat) return;
    if (txSubmitting) return;
    setTxSubmitting(true);
    if (editTx) {
      saveTx(transactions.map(t => t.id === editTx.id ? { ...t, type: fType, amount: amt, category: fCat, date: fDate, memo: fMemo } : t));
    } else {
      saveTx([...transactions, { id: genId(), type: fType, amount: amt, category: fCat, date: fDate, memo: fMemo, isRecurring: false }]);
    }
    setShowTxModal(false);
    setTxSubmitting(false);
  };
  const submitTxContinue = () => {
    const amt = parseInt(fAmount);
    if (!amt || amt <= 0 || !fCat) return;
    if (txSubmitting) return;
    setTxSubmitting(true);
    saveTx([...transactions, { id: genId(), type: fType, amount: amt, category: fCat, date: fDate, memo: fMemo, isRecurring: false }]);
    // Keep modal open; preserve date and type; reset other fields
    setFAmount("");
    setFCat("");
    setFMemo("");
    setTxSubmitting(false);
    setTimeout(() => amountRef.current?.focus(), 0);
  };

  // [NEW] 삭제 시 실행취소 토스트
  const deleteTx = (id) => {
    const tx = transactions.find(t => t.id === id);
    const newTxs = transactions.filter(t => t.id !== id);
    saveTx(newTxs);
    setToast({
      message: "내역이 삭제되었어요",
      undo: () => saveTx([...newTxs, tx].sort((a, b) => b.date.localeCompare(a.date))),
    });
  };

  const openAddRec = () => {
    setEditRec(null);
    setRType("expense"); setRAmount(""); setRCat(""); setRDay("1"); setRMemo("");
    setShowRecModal(true);
  };
  const openEditRec = (r) => {
    setEditRec(r);
    setRType(r.type); setRAmount(String(r.amount)); setRCat(r.category); setRDay(String(r.day)); setRMemo(r.memo || "");
    setShowRecModal(true);
  };
  const submitRec = () => {
    const amt = parseInt(rAmount);
    // [BUG FIX] amt <= 0 체크 추가
    if (!amt || amt <= 0 || !rCat) return;
    if (editRec) {
      saveRec(recurring.map(r => r.id === editRec.id
        ? { ...r, type: rType, amount: amt, category: rCat, day: parseInt(rDay), memo: rMemo }
        : r));
      // [NEW] 고정비 수정 시 이번 달 이미 생성된 거래도 함께 업데이트
      const ym = getYM(today());
      saveTx(transactions.map(t =>
        t.recurringId === editRec.id && getYM(t.date) === ym
          ? { ...t, type: rType, amount: amt, category: rCat, memo: rMemo, date: `${ym}-${String(parseInt(rDay)).padStart(2, "0")}` }
          : t
      ));
    } else {
      saveRec([...recurring, { id: genId(), type: rType, amount: amt, category: rCat, day: parseInt(rDay), memo: rMemo }]);
    }
    setShowRecModal(false);
  };
  const deleteRec = (id) => saveRec(recurring.filter(r => r.id !== id));

  const addCategory = () => {
    if (!newCatName.trim()) return;
    const cats = newCatType === "expense" ? expCats : incCats;
    if (cats.includes(newCatName.trim())) return;
    saveCats(newCatType, [...cats, newCatName.trim()]);
    saveColors({ ...catColors, [newCatName.trim()]: newCatColor });
    setNewCatName("");
  };
  const deleteCategory = (type, name) => {
    saveCats(type, (type === "expense" ? expCats : incCats).filter(c => c !== name));
  };

  const setBudgetForCat = () => {
    const amt = parseInt(budgetAmt);
    // [BUG FIX] amt <= 0 체크 추가
    if (!amt || amt <= 0 || !budgetCat) {
      setToast({ message: "카테고리를 선택하고 금액을 입력해주세요." });
      return;
    }
    saveBudgets({ ...budgets, [month]: { ...monthBudget, [budgetCat]: amt } });
    setBudgetAmt("");
    setToast({ message: "예산이 설정되었어요." });
  };

  // [BUG FIX] 예산 삭제 로직 중복 제거 - 단일 함수로 통합
  const deleteBudgetCat = (cat) => {
    saveBudgets({ ...budgets, [month]: Object.fromEntries(Object.entries(monthBudget).filter(([k]) => k !== cat)) });
  };

  // [NEW] 전월 예산 복사
  const copyBudgetFromPrevMonth = () => {
    const [y, m] = month.split("-").map(Number);
    const prev = new Date(y, m - 2, 1);
    const prevYM = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    const prevBudget = budgets[prevYM];
    if (!prevBudget || Object.keys(prevBudget).length === 0) {
      setToast({ message: "전월 예산 데이터가 없어요" });
      return;
    }
    saveBudgets({ ...budgets, [month]: { ...prevBudget } });
    setToast({ message: "전월 예산을 복사했어요" });
  };

  // [NEW] 거래 내역 전체 초기화
  const resetAllData = () => {
    if (!window.confirm("모든 거래 내역을 초기화할까요?\n고정비와 예산 설정은 유지됩니다.")) return;
    saveTx([]);
    setToast({ message: "거래 내역이 초기화되었어요" });
  };

  // [BUG FIX] CSV 메모 필드 쉼표/따옴표 이스케이프
  const exportCSV = () => {
    const rows = [["날짜", "유형", "카테고리", "금액", "메모"]];
    monthTxs.forEach(t => rows.push([
      t.date,
      t.type === "income" ? "수입" : "지출",
      csvEscape(t.category),
      t.amount,
      csvEscape(t.memo || ""),
    ]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `가계부_${month}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Loading ──
  if (!loaded) return (
    <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#666", fontSize: 15 }}>데이터 불러오는 중...</div>
    </div>
  );

  // ── Tab: Home (Dashboard) ──
  const renderHome = () => {
    // [BUG FIX] 날짜 레이블 계산 - parseLocalDate로 타임존 문제 방지
    const dayLabel = (dateStr) => {
      const d = parseLocalDate(dateStr);
      const [, sm] = dateStr.split("-").map(Number);
      return `${sm}월 ${d.getDate()}일 (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]})`;
    };

    const dayTxs = selectedDate ? monthTxs.filter(t => t.date === selectedDate) : [];
    const dayInc = dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const dayExp = dayTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const displayTxs = selectedDate ? dayTxs : monthTxs.slice(0, 5);

    // [NEW] 남은 일수 및 하루 권장 예산 계산
    const [y, m] = month.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    const todayDate = new Date();
    let remainingDays = daysInMonth;
    if (todayDate.getFullYear() === y && todayDate.getMonth() + 1 === m) {
      remainingDays = daysInMonth - todayDate.getDate() + 1; // 오늘 포함
    } else if (todayDate.getFullYear() > y || (todayDate.getFullYear() === y && todayDate.getMonth() + 1 > m)) {
      remainingDays = 0; // 지난 달인 경우 남은 일수 0
    }
    
    // 예산에서 전체 지출(고정비+변동비) 차감
    const remainingBudget = Math.max(0, totalBudget - summary.expense);
    const dailyBudget = remainingDays > 0 ? Math.floor(remainingBudget / remainingDays) : 0;

    return (
      <>
        <div style={S.header}>
          <span style={S.title}>가계부</span>
          <MonthPicker value={month} onChange={(m) => { setMonth(m); setSelectedDate(null); }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "16px 20px 0" }}>
          {[
            { label: "수입", value: summary.income, color: "#2ECC71" },
            { label: "지출", value: summary.expense, color: "#FF6B6B" },
            { label: "잔액", value: summary.balance, color: summary.balance >= 0 ? "#6C9CFF" : "#FF4757" },
          ].map((d, i) => (
            <div key={i} style={{ ...S.card, margin: 0, textAlign: "center", padding: 14 }}>
              <div style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>{d.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: d.color, fontVariantNumeric: "tabular-nums" }}>{formatNum(d.value)}</div>
            </div>
          ))}
        </div>

        <Calendar month={month} transactions={monthTxs} selectedDate={selectedDate} onDateClick={(d) => setSelectedDate(selectedDate === d ? null : d)} />

        {totalBudget > 0 && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={S.cardTitle}>이달 예산</span>
              <button onClick={() => setShowBudgetModal(true)} style={S.btnSm()}>설정</button>
            </div>
            <BudgetBar spent={summary.expense} budget={totalBudget} />
            <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
              잔여 예산: <span style={{ color: remainingBudget >= 0 ? "#2ECC71" : "#FF6B6B", fontWeight: 600 }}>
                {formatNum(remainingBudget)}원
              </span>
              {remainingDays > 0 && remainingBudget > 0 && (
                <span style={{ marginLeft: 8, paddingLeft: 8, borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
                  하루 <span style={{ color: "#6C9CFF", fontWeight: 600 }}>{formatNum(dailyBudget)}원</span> 사용 가능
                </span>
              )}
            </div>
          </div>
        )}

        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={S.cardTitle}>
              {selectedDate ? dayLabel(selectedDate) : "최근 내역"}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {selectedDate && (
                <div style={{ display: "flex", gap: 10, fontSize: 13 }}>
                  {dayInc > 0 && <span style={{ color: "#2ECC71", fontWeight: 600 }}>+{formatNum(dayInc)}</span>}
                  {dayExp > 0 && <span style={{ color: "#FF6B6B", fontWeight: 600 }}>-{formatNum(dayExp)}</span>}
                </div>
              )}
              {selectedDate
                ? <button onClick={() => setSelectedDate(null)} style={{ ...S.btnGhost, fontSize: 12, color: "#888" }}>전체보기</button>
                : <button onClick={() => setTab("list")} style={{ ...S.btnGhost, fontSize: 13, color: "#6C9CFF" }}>전체보기</button>
              }
            </div>
          </div>
          {displayTxs.length === 0
            ? <div style={S.empty}>{selectedDate ? "이 날짜에 내역이 없어요" : "이번 달 내역이 없어요"}</div>
            : displayTxs.map(tx => <TxRow key={tx.id} tx={tx} colors={catColors} onEdit={openEditTx} onDelete={deleteTx} />)
          }
          {selectedDate && (
            <button onClick={() => openAddTx(selectedDate)}
              style={{ ...S.btnSm("rgba(108,156,255,0.12)", "#6C9CFF"), marginTop: 8, width: "100%", padding: "8px 0", textAlign: "center" }}>
              이 날짜에 추가
            </button>
          )}
        </div>

        {/* [NEW] 카테고리 차트를 최근 내역 아래로 이동 */}
        {expByCategory.length > 0 && (
          <div style={S.card}>
            <span style={S.cardTitle}>카테고리별 지출</span>
            <DonutChart data={expByCategory} />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 20px" }}>
          <button onClick={openAddTx} style={S.btn("#6C9CFF")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon d={Icons.plus} size={18} /> 내역 추가
            </span>
          </button>
          <button onClick={openAddRec} style={S.btn("rgba(180,122,255,0.8)")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon d={Icons.repeat} size={18} /> 고정비
            </span>
          </button>
        </div>
      </>
    );
  };

  // ── Tab: List ──
  const renderList = () => (
    <>
      <div style={S.header}>
        <span style={{ fontSize: 20, fontWeight: 700 }}>내역 목록</span>
        <MonthPicker value={month} onChange={setMonth} />
      </div>
      <div style={{ padding: "12px 20px 0", display: "flex", gap: 8 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input style={{ ...S.input, paddingLeft: 36 }} placeholder="검색..." value={searchQ} onChange={e => setSearchQ(e.target.value)} />
          <Icon d={Icons.search} size={16} color="#666" style={{ position: "absolute", left: 12, top: 14 }} />
        </div>
        <select style={{ ...S.select, width: 90 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all" style={{ color: "#000" }}>전체</option>
          <option value="income" style={{ color: "#000" }}>수입</option>
          <option value="expense" style={{ color: "#000" }}>지출</option>
        </select>
      </div>
      {/* [NEW] 금액 범위 필터 */}
      <div style={{ padding: "8px 20px 0", display: "flex", gap: 6, alignItems: "center" }}>
        <AmountInput
          style={{ ...S.input, fontSize: 13, padding: "8px 10px" }}
          value={minAmt} onChange={setMinAmt}
        />
        <span style={{ color: "#555", flexShrink: 0, fontSize: 13 }}>~</span>
        <AmountInput
          style={{ ...S.input, fontSize: 13, padding: "8px 10px" }}
          value={maxAmt} onChange={setMaxAmt}
        />
        <span style={{ color: "#555", flexShrink: 0, fontSize: 13 }}>원</span>
        {(minAmt || maxAmt) && (
          <button onClick={() => { setMinAmt(""); setMaxAmt(""); }} style={{ ...S.btnGhost, flexShrink: 0 }}>
            <Icon d={Icons.x} size={14} color="#888" />
          </button>
        )}
      </div>
      <div style={{ padding: "0 20px" }}>
        {filteredTxs.length === 0
          ? <div style={S.empty}>내역이 없습니다</div>
          : filteredTxs.map(tx => <TxRow key={tx.id} tx={tx} colors={catColors} onEdit={openEditTx} onDelete={deleteTx} />)
        }
      </div>
      <div style={{ padding: "16px 20px" }}>
        <button onClick={openAddTx} style={S.btn()}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon d={Icons.plus} size={18} /> 내역 추가
          </span>
        </button>
      </div>
    </>
  );

  // ── Tab: Chart/Stats ──
  const renderChart = () => {
    const catBudgets = Object.entries(monthBudget);
    return (
      <>
        <div style={S.header}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>통계</span>
          <MonthPicker value={month} onChange={setMonth} />
        </div>
        {/* [NEW] 월별 추세 차트 */}
        <div style={S.card}>
          <span style={S.cardTitle}>월별 수입/지출 추세 (6개월)</span>
          <TrendChart transactions={transactions} />
        </div>
        <div style={S.card}>
          <span style={S.cardTitle}>카테고리별 지출 비율</span>
          {expByCategory.length > 0 ? <DonutChart data={expByCategory} /> : <div style={S.empty}>지출 내역이 없어요</div>}
        </div>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={S.cardTitle}>카테고리별 예산 현황</span>
            <button onClick={() => setShowBudgetModal(true)} style={S.btnSm()}>설정</button>
          </div>
          {catBudgets.length === 0
            ? <div style={S.empty}>예산을 설정해보세요</div>
            : catBudgets.map(([cat, amt]) => {
              const spent = monthTxs.filter(t => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0);
              return (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <CatChip name={cat} colors={catColors} />
                  </div>
                  <BudgetBar spent={spent} budget={amt} />
                </div>
              );
            })
          }
        </div>
        <div style={{ padding: "0 20px" }}>
          <button onClick={exportCSV} style={S.btn("rgba(108,156,255,0.2)")}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#6C9CFF" }}>
              <Icon d={Icons.download} size={18} color="#6C9CFF" /> CSV 내보내기
            </span>
          </button>
        </div>
      </>
    );
  };

  // ── Tab: Settings ──
  const renderSettings = () => (
    <>
      <div style={S.header}>
        <span style={{ fontSize: 20, fontWeight: 700 }}>설정</span>
      </div>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={S.cardTitle}>고정비 관리</span>
          <button onClick={openAddRec} style={S.btnSm()}>추가</button>
        </div>
        {recurring.length === 0
          ? <div style={S.empty}>등록된 고정비가 없어요</div>
          : recurring.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CatChip name={r.category} colors={catColors} />
                  <span style={{ fontSize: 12, color: "#888" }}>매월 {r.day}일</span>
                </div>
                {r.memo && <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{r.memo}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: r.type === "income" ? "#2ECC71" : "#FF6B6B" }}>
                  {r.type === "income" ? "+" : "-"}{formatNum(r.amount)}원
                </span>
                <button onClick={() => openEditRec(r)} style={S.btnGhost}><Icon d={Icons.edit} size={15} color="#666" /></button>
                <button onClick={() => deleteRec(r.id)} style={S.btnGhost}><Icon d={Icons.trash} size={15} color="#666" /></button>
              </div>
            </div>
          ))
        }
      </div>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ ...S.cardTitle, marginBottom: 0 }}>카테고리 관리</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => {
              if (window.confirm("기본 필수 카테고리를 복구/추가할까요?")) {
                saveCats("expense", Array.from(new Set([...expCats, ...DEFAULT_EXPENSE_CATEGORIES])));
                saveCats("income", Array.from(new Set([...incCats, ...DEFAULT_INCOME_CATEGORIES])));
                saveColors({ ...catColors, ...CATEGORY_COLORS });
                setToast({ message: "필수 카테고리가 추가/복구되었어요" });
              }
            }} style={S.btnSm("rgba(255,255,255,0.06)", "#aaa")}>기본 복구</button>
            <button onClick={() => setShowCatModal(true)} style={S.btnSm()}>추가</button>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>지출</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {expCats.map(c => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <CatChip name={c} colors={catColors} />
              {!DEFAULT_EXPENSE_CATEGORIES.includes(c) && (
                <button onClick={() => deleteCategory("expense", c)} style={{ ...S.btnGhost, padding: 2 }}>
                  <Icon d={Icons.x} size={12} color="#666" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>수입</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {incCats.map(c => (
            <div key={c} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <CatChip name={c} colors={catColors} />
              {!DEFAULT_INCOME_CATEGORIES.includes(c) && (
                <button onClick={() => deleteCategory("income", c)} style={{ ...S.btnGhost, padding: 2 }}>
                  <Icon d={Icons.x} size={12} color="#666" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={S.cardTitle}>예산 설정 ({month})</span>
          <button onClick={() => setShowBudgetModal(true)} style={S.btnSm()}>설정</button>
        </div>
        {Object.keys(monthBudget).length === 0
          ? <div style={S.empty}>설정된 예산이 없어요</div>
          : Object.entries(monthBudget).map(([cat, amt]) => (
            <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <CatChip name={cat} colors={catColors} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{formatNum(amt)}원</span>
                {/* [BUG FIX] deleteBudgetCat으로 중복 로직 제거 */}
                <button onClick={() => deleteBudgetCat(cat)} style={S.btnGhost}><Icon d={Icons.x} size={14} color="#666" /></button>
              </div>
            </div>
          ))
        }
      </div>
      {/* [NEW] 데이터 초기화 */}
      <div style={S.card}>
        <span style={{ ...S.cardTitle, color: "#FF6B6B" }}>위험 구역</span>
        <button onClick={resetAllData} style={{ ...S.btn("rgba(255,107,107,0.12)"), color: "#FF6B6B" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Icon d={Icons.trash} size={16} color="#FF6B6B" /> 거래 내역 초기화
          </span>
        </button>
      </div>
    </>
  );

  const cats = fType === "expense" ? expCats : incCats;
  const rCats = rType === "expense" ? expCats : incCats;

  return (
    <div style={S.root}>
      {tab === "home" && renderHome()}
      {tab === "list" && renderList()}
      {tab === "chart" && renderChart()}
      {tab === "settings" && renderSettings()}

      <nav style={S.nav}>
        {[
          { id: "home", icon: Icons.home, label: "홈" },
          { id: "list", icon: Icons.list, label: "내역" },
          { id: "chart", icon: Icons.chart, label: "통계" },
          { id: "settings", icon: Icons.settings, label: "설정" },
        ].map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={S.navBtn(tab === n.id)}>
            <Icon d={n.icon} size={22} color={tab === n.id ? "#6C9CFF" : "#555"} />
            {n.label}
          </button>
        ))}
      </nav>

      {/* [NEW] 위플 가계부 스타일 플로팅 추가 버튼 (FAB) */}
      {(tab === "home" || tab === "list") && (
        <div style={{ position: "fixed", bottom: "calc(90px + env(safe-area-inset-bottom, 0px))", left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 150 }}>
          <div style={{ width: "100%", maxWidth: 520, display: "flex", justifyContent: "flex-end", padding: "0 20px" }}>
            <button
              onClick={() => openAddTx(tab === "home" && selectedDate ? selectedDate : today())}
              style={{
                pointerEvents: "auto", width: 56, height: 56, flexShrink: 0,
                background: "#6C9CFF", borderRadius: 18, border: "none", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 6px 20px rgba(108,156,255,0.4)", cursor: "pointer", transition: "transform 0.2s"
              }}
            >
              <Icon d={Icons.plus} size={28} />
            </button>
          </div>
        </div>
      )}

      {/* [NEW] Toast */}
      <Toast toast={toast} onHide={hideToast} />

      {/* ── Transaction Modal ── */}
      <Modal open={showTxModal} onClose={() => setShowTxModal(false)} title={editTx ? "내역 수정" : "내역 추가"}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["expense", "income"].map(t => (
            <button key={t} onClick={() => { setFType(t); setFCat(""); }}
              style={{ ...S.btnSm(fType === t ? (t === "expense" ? "rgba(255,107,107,0.2)" : "rgba(46,204,113,0.2)") : "rgba(255,255,255,0.06)",
                fType === t ? (t === "expense" ? "#FF6B6B" : "#2ECC71") : "#888"), flex: 1, padding: "10px 0", fontSize: 15 }}>
              {t === "expense" ? "지출" : "수입"}
            </button>
          ))}
        </div>
        <Field label="금액">
          {/* [NEW] 자동 콤마 AmountInput */}
          <AmountInput ref={amountRef} style={S.input} value={fAmount} onChange={setFAmount} />
        </Field>
        <Field label="카테고리">
          <select style={S.select} value={fCat} onChange={e => setFCat(e.target.value)}>
            <option value="" style={{ color: "#000" }}>선택</option>
            {cats.map(c => <option key={c} value={c} style={{ color: "#000" }}>{c}</option>)}
          </select>
        </Field>
        <Field label="날짜">
          <input style={S.input} type="date" value={fDate} onChange={e => setFDate(e.target.value)} />
        </Field>
        <Field label="메모">
          <input style={S.input} placeholder="메모 (선택)" value={fMemo} onChange={e => setFMemo(e.target.value)} />
        </Field>
        {editTx ? (
          <button onClick={submitTx} disabled={txSubmitting} style={{ ...S.btn(), opacity: txSubmitting ? 0.6 : 1 }}>수정</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={submitTx} disabled={txSubmitting} style={{ ...S.btn(), flex: 1, opacity: txSubmitting ? 0.6 : 1 }}>추가</button>
            <button onClick={submitTxContinue} disabled={txSubmitting} style={{ ...S.btn("#B47AFF"), flex: 1, opacity: txSubmitting ? 0.6 : 1 }}>계속입력</button>
          </div>
        )}
      </Modal>

      {/* ── Recurring Modal ── */}
      <Modal open={showRecModal} onClose={() => setShowRecModal(false)} title={editRec ? "고정비 수정" : "고정비 등록"}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["expense", "income"].map(t => (
            <button key={t} onClick={() => { setRType(t); setRCat(""); }}
              style={{ ...S.btnSm(rType === t ? (t === "expense" ? "rgba(255,107,107,0.2)" : "rgba(46,204,113,0.2)") : "rgba(255,255,255,0.06)",
                rType === t ? (t === "expense" ? "#FF6B6B" : "#2ECC71") : "#888"), flex: 1, padding: "10px 0", fontSize: 15 }}>
              {t === "expense" ? "지출" : "수입"}
            </button>
          ))}
        </div>
        <Field label="금액">
          <AmountInput style={S.input} value={rAmount} onChange={setRAmount} />
        </Field>
        <Field label="카테고리">
          <select style={S.select} value={rCat} onChange={e => setRCat(e.target.value)}>
            <option value="" style={{ color: "#000" }}>선택</option>
            {rCats.map(c => <option key={c} value={c} style={{ color: "#000" }}>{c}</option>)}
          </select>
        </Field>
        <Field label="매월 결제일">
          <select style={S.select} value={rDay} onChange={e => setRDay(e.target.value)}>
            {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1} style={{ color: "#000" }}>{i + 1}일</option>)}
          </select>
        </Field>
        <Field label="메모">
          <input style={S.input} placeholder="예: 넷플릭스, 월세 등" value={rMemo} onChange={e => setRMemo(e.target.value)} />
        </Field>
        <button onClick={submitRec} style={S.btn("rgba(180,122,255,0.9)")}>{editRec ? "수정" : "등록"}</button>
      </Modal>

      {/* ── Category Modal ── */}
      <Modal open={showCatModal} onClose={() => setShowCatModal(false)} title="카테고리 추가">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["expense", "income"].map(t => (
            <button key={t} onClick={() => setNewCatType(t)}
              style={{ ...S.btnSm(newCatType === t ? "rgba(108,156,255,0.2)" : "rgba(255,255,255,0.06)",
                newCatType === t ? "#6C9CFF" : "#888"), flex: 1, padding: "10px 0", fontSize: 15 }}>
              {t === "expense" ? "지출" : "수입"}
            </button>
          ))}
        </div>
        <Field label="카테고리 이름">
          <input style={S.input} placeholder="새 카테고리" value={newCatName} onChange={e => setNewCatName(e.target.value)} />
        </Field>
        <Field label="색상">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["#FF6B6B", "#4ECDC4", "#45B7D1", "#F7DC6F", "#BB8FCE", "#E59866", "#82E0AA", "#F1948A", "#6C9CFF", "#B47AFF"].map(c => (
              <button key={c} onClick={() => setNewCatColor(c)}
                style={{ width: 32, height: 32, borderRadius: 8, background: c, border: newCatColor === c ? "3px solid #fff" : "3px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        </Field>
        <button onClick={addCategory} style={S.btn()}>추가</button>
      </Modal>

      {/* ── Budget Modal ── */}
      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} title={`예산 설정 (${month})`}>
        <Field label="카테고리">
          <select style={S.select} value={budgetCat} onChange={e => setBudgetCat(e.target.value)}>
            <option value="" style={{ color: "#000" }}>선택</option>
            {expCats.map(c => <option key={c} value={c} style={{ color: "#000" }}>{c}</option>)}
          </select>
        </Field>
        <Field label="예산 금액">
          <AmountInput style={S.input} value={budgetAmt} onChange={setBudgetAmt} />
        </Field>
        {/* [NEW] 전월 복사 버튼 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={setBudgetForCat} style={{ ...S.btn(), flex: 2 }}>설정</button>
          <button onClick={copyBudgetFromPrevMonth}
            style={{ ...S.btnSm("rgba(255,255,255,0.06)", "#aaa"), flex: 1, padding: "12px 0", fontSize: 13 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Icon d={Icons.copy} size={13} color="#aaa" /> 전월복사
            </span>
          </button>
        </div>
        {Object.keys(monthBudget).length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>설정된 예산</div>
            {Object.entries(monthBudget).map(([cat, amt]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <CatChip name={cat} colors={catColors} />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{formatNum(amt)}원</span>
                  {/* [BUG FIX] deleteBudgetCat으로 통합 */}
                  <button onClick={() => deleteBudgetCat(cat)} style={S.btnGhost}>
                    <Icon d={Icons.x} size={14} color="#666" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
