import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Bell, Pin, Plus, Search, ChevronRight, Edit, Trash2,
  ChevronLeft, ChevronsLeft, ChevronsRight
} from "lucide-react";

/* ─── Types & Data ──────────────────────────────────────────────────────── */
// 💡 아이콘 관련 코드는 사용하지 않으므로 제거되었습니다.

// 💡 밝은 배경에 어울리도록 색상 미세 조정
const CAT_COLOR = {
  공지:     { color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  이벤트:   { color: "#9333ea", bg: "rgba(147,51,234,0.1)" },
  업데이트: { color: "#059669", bg: "rgba(5,150,105,0.1)" },
  점검:     { color: "#ea580c", bg: "rgba(234,88,12,0.1)" },
};

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

  const parsedNotices = rawNotices.map((notice) => {
    let category = "공지";
    let cleanTitle = n.title;
    const match = n.title.match(/^\[(.*?)\]\s*(.*)$/);
    if (match && CAT_META[match[1]]) { category = match[1]; cleanTitle = match[2]; }
    return {
      id: n.id,
      no: (page - 1) * limit + idx + 1,  // 게시판 번호
      category,
      title: cleanTitle,
      preview: notice.content,
      date: new Date(notice.created_at).toLocaleDateString(),
      author: "관리자",
      isPinned: false,
      isNew: (new Date() - new Date(notice.created_at)) < 86400000 * 3
    };
  });

  const filtered = parsedNotices.filter((a) => {
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
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#f9fafb",
        color: "#111827",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Top bar: 로고 영역만 유지 ── */}
      <header
        className="flex items-center justify-between px-10 py-5 flex-shrink-0 bg-white"
        style={{ borderBottom: "1px solid #e5e7eb" }}
      >
        <div className="flex items-center gap-3">
          {/* 로고나 앱 아이콘 영역 */}
        </div>
        {/* 사용자 정보나 메뉴 등 필요한 요소 */}
      </header>

      <div className="flex-1 px-10 py-8 max-w-5xl w-full mx-auto">
        {/* ── Hero ── */}
        <div className="mb-10 flex justify-between items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: "#2563eb" }}>
              Notice Board
            </p>
            <h1 className="leading-none tracking-tight mb-3" style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
              공지사항
            </h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>
              플랫폼 업데이트, 이벤트, 점검 일정을 확인하세요.
            </p>
          </div>
          
          {/* ── 공지 작성 버튼을 여기에 배치 ── */}
          {isAdmin && (
            <button
              onClick={() => navigate("/announcement/write")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg,#4a90e2,#6c63ff)",
                boxShadow: "0 4px 16px rgba(74,144,226,0.3)",
              }}
            >
              <Plus className="w-4 h-4" />
              공지 작성
            </button>
          )}
        </div>

        {/* ── Search + Filter row ── */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 bg-white shadow-sm"
            style={{ border: "1px solid #e5e7eb", minWidth: 200 }}
          >
            <Search className="w-4 h-4 flex-shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="공지사항 검색…"
              className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 text-gray-900"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["전체", "공지", "이벤트", "업데이트", "점검"].map((cat) => {
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
        {/* ── 여기서부터 리스트가 렌더링됩니다 ── */}
        
        {/* ── Pinned ── */}
        {pinned.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Pin className="w-3.5 h-3.5" style={{ color: "#ea580c" }} />
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-gray-500">고정된 공지</span>
            </div>
            <div className="flex flex-col gap-2">
              {pinned.map((a) => (
                <AnnouncementRow key={a.id} item={a} pinned isAdmin={isAdmin} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        {pinned.length > 0 && normal.length > 0 && <div className="mb-6" style={{ height: 1, background: "#e5e7eb" }} />}

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

        {/* ── Empty ── */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-28 gap-4 bg-white rounded-3xl border border-gray-100 mt-4">
            <p className="text-sm text-gray-400 font-medium">검색 결과가 없습니다</p>
          </div>
        )}

        {/* ── Pagination ── */}
        {/* ... 페이징 부분 동일 ... */}
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
        border: pinned ? "1px solid rgba(234,88,12,0.3)" : hovered ? "1px solid #d1d5db" : "1px solid #e5e7eb",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
      }}
    >
      <div
        className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full transition-all duration-200"
        style={{ background: hovered || pinned ? meta.color : "transparent" }}
      />

      {/* 💡 아이콘 bubble 영역 삭제 */}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: meta.bg, color: meta.color }}
          >
            {item.category}
          </span>
          {pinned && (
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: "rgba(234,88,12,0.1)", color: "#ea580c" }}
            >
              <Pin className="w-3 h-3" />
              고정
            </span>
          )}
          {item.isNew && (
            <span
              className="text-xs font-extrabold px-2.5 py-0.5 rounded-full"
              style={{ background: "rgba(37,99,235,0.1)", color: "#2563eb" }}
            >
              NEW
            </span>
          )}
        </div>
        <p className="font-extrabold text-base text-gray-900 truncate">{item.title}</p>
        <p
          className="text-sm mt-1 truncate font-medium text-gray-500"
          style={{ maxWidth: 560 }}
        >
          {item.preview}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {isAdmin && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); navigate(`/announcement/edit/${item.id}`); }}
              style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
            >
              <Edit style={{ width: 11, height: 11 }} /> 수정
            </button>
            <button
              onClick={(e) => onDelete(e, item.id)}
              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition bg-gray-100 border border-gray-100"
              title="삭제"
            >
              <Trash2 style={{ width: 11, height: 11 }} /> 삭제
            </button>
          </div>
        )}

        <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs font-semibold text-gray-400">
          <span>{item.date}</span>
          <span>{item.author}</span>
        </div>

        <ChevronRight
          className="w-5 h-5 flex-shrink-0 transition-transform duration-200 text-gray-300"
          style={{ transform: hovered ? "translateX(4px)" : "translateX(0)" }}
        />
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