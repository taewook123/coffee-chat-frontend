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

  const limit = 10;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      axios.get(`${BACKEND_URL}/api/user/${userId}`)
        .then(res => {
          if (res.data.role === 'ADMIN' || res.data.role === 'admin') setIsAdmin(true);
        }).catch(err => console.error(err));
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/announcements?skip=${(page - 1) * limit}&limit=${limit}`)
      .then(res => {
        if (res.data.items) {
          setRawNotices(res.data.items);
          setTotalPages(res.data.total_pages || 1);
        } else {
          setRawNotices(res.data);
          setTotalPages(10);
        }
      })
      .catch(err => console.error("공지사항 로드 실패", err));
  }, [page, BACKEND_URL, limit]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("정말 이 공지사항을 삭제하시겠습니까?")) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      await axios.delete(`${BACKEND_URL}/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("삭제되었습니다.");
      setRawNotices(rawNotices.filter(notice => notice.id !== id));
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const parsedNotices = rawNotices.map((notice) => {
    let category = "공지";
    let cleanTitle = notice.title;
    const match = notice.title.match(/^\[(.*?)\]\s*(.*)$/);
    if (match && CAT_COLOR[match[1]]) {
      category = match[1];
      cleanTitle = match[2];
    }
    return {
      id: notice.id,
      category: category,
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
    const matchQ = query.trim() === "" || a.title.includes(query) || a.preview.includes(query);
    return matchCat && matchQ;
  });

  const pinned = filtered.filter((a) => a.isPinned);
  const normal = filtered.filter((a) => !a.isPinned);

  const getPageNumbers = () => {
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    if (endPage - startPage < 4) {
      if (startPage === 1) endPage = Math.min(totalPages, 5);
      else if (endPage === totalPages) startPage = Math.max(1, totalPages - 4);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

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
              const meta = cat !== "전체" ? CAT_COLOR[cat] : null;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-150"
                  style={
                    active
                      ? {
                          background: meta ? meta.bg : "#f3f4f6",
                          color: meta ? meta.color : "#111827",
                          border: `1px solid ${meta ? meta.color + "40" : "#d1d5db"}`,
                        }
                      : {
                          background: "#ffffff",
                          color: "#6b7280",
                          border: "1px solid #e5e7eb",
                        }
                  }
                >
                  {cat}
                </button>
              );
            })}
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

        {/* ── Normal list ── */}
        {normal.length > 0 && (
          <div className="flex flex-col gap-3">
            {normal.map((a) => (
              <AnnouncementRow key={a.id} item={a} pinned={false} isAdmin={isAdmin} onDelete={handleDelete} />
            ))}
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

/* ─── Row ───────────────────────────────────────────────────────────────── */
function AnnouncementRow({ item, pinned, isAdmin, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const meta = CAT_COLOR[item.category] || CAT_COLOR["공지"];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/announcements/${item.id}`)}
      className="relative w-full text-left flex items-center gap-5 px-6 py-5 rounded-2xl transition-all duration-200 cursor-pointer group bg-white shadow-sm"
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
              onClick={(e) => { e.stopPropagation(); navigate(`/announcement/edit/${item.id}`); }}
              className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition bg-gray-50 border border-gray-100"
              title="수정"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => onDelete(e, item.id)}
              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition bg-gray-100 border border-gray-100"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
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
    </div>
  );
}