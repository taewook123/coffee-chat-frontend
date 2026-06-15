import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Bell, Pin, Plus, Search, Megaphone, Zap, RefreshCw, Wrench,
  Edit, Trash2, ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight,
} from "lucide-react";

/* ─── 카테고리 메타 ─────────────────────────────────────────────────────── */
const CAT_META = {
  공지:     { icon: <Megaphone className="w-3 h-3" />, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  이벤트:   { icon: <Zap       className="w-3 h-3" />, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  업데이트: { icon: <RefreshCw className="w-3 h-3" />, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  점검:     { icon: <Wrench    className="w-3 h-3" />, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};
const DEFAULT_META = CAT_META["공지"];

function CategoryBadge({ category, size = "sm" }) {
  const m = CAT_META[category] ?? DEFAULT_META;
  return (
    <span
      className="inline-flex items-center gap-1 font-bold rounded"
      style={{
        fontSize: size === "sm" ? 11 : 12,
        padding: size === "sm" ? "2px 8px" : "3px 10px",
        color: m.color,
        background: m.bg,
        border: `1px solid ${m.border}`,
        letterSpacing: "0.02em",
      }}
    >
      {m.icon}
      {category}
    </span>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function Announcements() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("전체");
  const [query, setQuery] = useState("");
  const [rawNotices, setRawNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const limit = 15;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://48.211.169.52:8000";

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      axios.get(`${BACKEND_URL}/api/user/${userId}`)
        .then(res => { if (["ADMIN", "admin"].includes(res.data.role)) setIsAdmin(true); })
        .catch(() => {});
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/api/announcements?skip=${(page - 1) * limit}&limit=${limit}`)
      .then(res => {
        if (res.data.items) {
          setRawNotices(res.data.items);
          setTotalPages(res.data.total_pages || 1);
        } else {
          setRawNotices(res.data);
          setTotalPages(1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, BACKEND_URL, limit]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      await axios.delete(`${BACKEND_URL}/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRawNotices(prev => prev.filter(n => n.id !== id));
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  /* DB 데이터 파싱 */
  const parsedNotices = rawNotices.map((n, idx) => {
    let category = "공지";
    let cleanTitle = n.title;
    const match = n.title.match(/^\[(.*?)\]\s*(.*)$/);
    if (match && CAT_META[match[1]]) { category = match[1]; cleanTitle = match[2]; }
    return {
      id: n.id,
      no: (page - 1) * limit + idx + 1,  // 게시판 번호
      category,
      title: cleanTitle,
      preview: n.content,
      date: new Date(n.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }),
      isPinned: false,
      isNew: (Date.now() - new Date(n.created_at)) < 86400000 * 3,
    };
  });

  const filtered = parsedNotices.filter(a => {
    const matchCat = activeCategory === "전체" || a.category === activeCategory;
    const matchQ   = !query.trim() || a.title.includes(query) || a.preview.includes(query);
    return matchCat && matchQ;
  });

  const pinned = filtered.filter(a => a.isPinned);
  const normal = filtered.filter(a => !a.isPinned);

  const pageNums = (() => {
    let s = Math.max(1, page - 2), e = Math.min(totalPages, page + 2);
    if (e - s < 4) { if (s === 1) e = Math.min(totalPages, 5); else s = Math.max(1, totalPages - 4); }
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", fontFamily: "'Inter', 'Pretendard', sans-serif" }}>

      {/* ══ 상단 헤더 바 ═══════════════════════════════════════════════ */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Bell style={{ width: 18, height: 18, color: "#2563eb" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>공지사항</span>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/announcement/write")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: "#2563eb", color: "#fff", border: "none", cursor: "pointer",
              }}
            >
              <Plus style={{ width: 14, height: 14 }} /> 공지 작성
            </button>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px 80px" }}>

        {/* ══ 페이지 타이틀 ════════════════════════════════════════════ */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
            공지사항
          </h1>
          <p style={{ marginTop: 6, fontSize: 14, color: "#64748b" }}>
            플랫폼 업데이트, 이벤트, 점검 일정을 확인하세요.
          </p>
        </div>

        {/* ══ 필터 + 검색 ══════════════════════════════════════════════ */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          {/* 카테고리 탭 */}
          <div style={{ display: "flex", gap: 4 }}>
            {["전체", "공지", "이벤트", "업데이트", "점검"].map(cat => {
              const active = activeCategory === cat;
              const m = CAT_META[cat];
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setPage(1); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "6px 13px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                    border: active ? `1.5px solid ${m?.color ?? "#2563eb"}` : "1.5px solid #e2e8f0",
                    background: active ? (m?.bg ?? "#eff6ff") : "#fff",
                    color: active ? (m?.color ?? "#2563eb") : "#64748b",
                    cursor: "pointer", transition: "all 0.12s",
                  }}
                >
                  {m && <span style={{ color: active ? m.color : "#94a3b8" }}>{m.icon}</span>}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 검색 */}
          <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8 }}>
            <Search style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="제목, 내용 검색"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "#0f172a", background: "transparent" }}
            />
          </div>
        </div>

        {/* ══ 게시판 테이블 ════════════════════════════════════════════ */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>

          {/* 컬럼 헤더 */}
          <div style={{
            display: "grid", gridTemplateColumns: "60px 1fr 90px 100px",
            padding: "10px 24px", background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0", fontSize: 11, fontWeight: 700,
            color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            <span>번호</span>
            <span>제목</span>
            <span style={{ textAlign: "center" }}>분류</span>
            <span style={{ textAlign: "right" }}>날짜</span>
          </div>

          {/* 고정 공지 */}
          {pinned.map(item => (
            <NoticeRow key={`pin-${item.id}`} item={item} pinned isAdmin={isAdmin} onDelete={handleDelete} />
          ))}

          {/* 일반 목록 */}
          {!loading && normal.map(item => (
            <NoticeRow key={item.id} item={item} pinned={false} isAdmin={isAdmin} onDelete={handleDelete} />
          ))}

          {/* 로딩 */}
          {loading && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              불러오는 중…
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: "64px 0", textAlign: "center" }}>
              <Bell style={{ width: 32, height: 32, color: "#e2e8f0", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "#94a3b8" }}>공지사항이 없습니다.</p>
            </div>
          )}
        </div>

        {/* ══ 페이지네이션 ═════════════════════════════════════════════ */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 28 }}>
            {[
              { onClick: () => setPage(1),        disabled: page === 1,          icon: <ChevronsLeft  style={{ width: 14, height: 14 }} /> },
              { onClick: () => setPage(p => p-1), disabled: page === 1,          icon: <ChevronLeft   style={{ width: 14, height: 14 }} /> },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: btn.disabled ? "#cbd5e1" : "#475569", cursor: btn.disabled ? "default" : "pointer" }}>
                {btn.icon}
              </button>
            ))}

            {pageNums.map(num => (
              <button key={num} onClick={() => setPage(num)}
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 13, fontWeight: 700, border: page === num ? "none" : "1px solid #e2e8f0", background: page === num ? "#2563eb" : "#fff", color: page === num ? "#fff" : "#475569", cursor: "pointer" }}>
                {num}
              </button>
            ))}

            {[
              { onClick: () => setPage(p => p+1),      disabled: page === totalPages, icon: <ChevronRight  style={{ width: 14, height: 14 }} /> },
              { onClick: () => setPage(totalPages),     disabled: page === totalPages, icon: <ChevronsRight style={{ width: 14, height: 14 }} /> },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", color: btn.disabled ? "#cbd5e1" : "#475569", cursor: btn.disabled ? "default" : "pointer" }}>
                {btn.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 게시판 행 ─────────────────────────────────────────────────────────── */
function NoticeRow({ item, pinned, isAdmin, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/announcements/${item.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group"
      style={{
        display: "grid", gridTemplateColumns: "60px 1fr 90px 100px",
        alignItems: "center", padding: "0 24px",
        borderBottom: "1px solid #f1f5f9",
        background: pinned ? "#fffbeb" : hovered ? "#f8fafc" : "#fff",
        cursor: "pointer", transition: "background 0.1s",
        minHeight: 52,
      }}
    >
      {/* 번호 */}
      <span style={{ fontSize: 13, color: pinned ? "#d97706" : "#94a3b8", fontWeight: pinned ? 700 : 400 }}>
        {pinned ? <Pin style={{ width: 13, height: 13, display: "inline" }} /> : item.no}
      </span>

      {/* 제목 영역 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, padding: "12px 0" }}>
        <CategoryBadge category={item.category} />
        <span style={{
          fontSize: 14, fontWeight: 600, color: "#0f172a",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          textDecoration: hovered ? "underline" : "none",
          textDecorationColor: "#94a3b8",
        }}>
          {item.title}
        </span>
        {item.isNew && (
          <span style={{ fontSize: 10, fontWeight: 800, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 4, padding: "1px 6px", flexShrink: 0 }}>
            NEW
          </span>
        )}

        {/* 관리자 버튼 - 호버 시 노출 */}
        {isAdmin && hovered && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <button
              onClick={e => { e.stopPropagation(); navigate(`/announcement/edit/${item.id}`); }}
              style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
            >
              <Edit style={{ width: 11, height: 11 }} /> 수정
            </button>
            <button
              onClick={e => onDelete(e, item.id)}
              style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "1px solid #fecaca", background: "#fff5f5", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
            >
              <Trash2 style={{ width: 11, height: 11 }} /> 삭제
            </button>
          </div>
        )}
      </div>

      {/* 분류 (모바일 숨김용 영역) */}
      <span style={{ textAlign: "center", fontSize: 12, color: "#94a3b8" }} />

      {/* 날짜 */}
      <span style={{ textAlign: "right", fontSize: 12, color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
        {item.date}
      </span>
    </div>
  );
}