import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Edit, Trash2, Megaphone, Zap, RefreshCw, Wrench } from "lucide-react";

const CAT_META = {
  공지:     { icon: <Megaphone className="w-3.5 h-3.5" />, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  이벤트:   { icon: <Zap       className="w-3.5 h-3.5" />, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  업데이트: { icon: <RefreshCw className="w-3.5 h-3.5" />, color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  점검:     { icon: <Wrench    className="w-3.5 h-3.5" />, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
};

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice]   = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://48.211.169.52:8000";

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/announcements/${id}`)
      .then(res => setNotice(res.data))
      .catch(() => { alert("공지사항을 불러올 수 없습니다."); navigate("/announcements"); });

    const userId = localStorage.getItem("userId");
    if (userId) {
      axios.get(`${BACKEND_URL}/api/user/${userId}`)
        .then(res => { if (["ADMIN", "admin"].includes(res.data.role)) setIsAdmin(true); })
        .catch(() => {});
    }
  }, [id, BACKEND_URL, navigate]);

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      await axios.delete(`${BACKEND_URL}/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/announcements");
    } catch {
      alert("삭제 권한이 없거나 오류가 발생했습니다.");
    }
  };

  /* 제목에서 카테고리 파싱 */
  const parseNotice = (n) => {
    let category = "공지", cleanTitle = n.title;
    const match = n.title.match(/^\[(.*?)\]\s*(.*)$/);
    if (match && CAT_META[match[1]]) { category = match[1]; cleanTitle = match[2]; }
    return { category, cleanTitle };
  };

  if (!notice) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 14 }}>
        불러오는 중…
      </div>
    );
  }

  const { category, cleanTitle } = parseNotice(notice);
  const meta = CAT_META[category] ?? CAT_META["공지"];
  const dateStr = new Date(notice.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', 'Pretendard', sans-serif" }}>

      {/* ── 헤더 바 ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate("/announcements")}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#475569", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            목록으로
          </button>

          {isAdmin && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => navigate(`/announcement/edit/${id}`)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 700, border: "1.5px solid #bfdbfe", background: "#eff6ff", color: "#2563eb", cursor: "pointer" }}
              >
                <Edit style={{ width: 13, height: 13 }} /> 수정
              </button>
              <button
                onClick={handleDelete}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 700, border: "1.5px solid #fecaca", background: "#fff5f5", color: "#dc2626", cursor: "pointer" }}
              >
                <Trash2 style={{ width: 13, height: 13 }} /> 삭제
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── 본문 ── */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 32px 80px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden" }}>

          {/* 카테고리 컬러 바 */}
          <div style={{ height: 4, background: meta.color }} />

          {/* 헤더 영역 */}
          <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #f1f5f9" }}>
            {/* 배지 */}
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 10px", borderRadius: 5, fontSize: 12, fontWeight: 700,
                color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
                marginBottom: 14,
              }}
            >
              {meta.icon} {category}
            </span>

            {/* 제목 */}
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", lineHeight: 1.4, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
              {cleanTitle}
            </h1>

            {/* 메타 */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#94a3b8" }}>
              <span>관리자</span>
              <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#cbd5e1", display: "inline-block" }} />
              <span>{dateStr}</span>
            </div>
          </div>

          {/* 본문 내용 */}
          <div style={{ padding: "32px 40px 40px" }}>
            <div style={{ fontSize: 15, lineHeight: 1.9, color: "#334155", whiteSpace: "pre-wrap" }}>
              {notice.content}
            </div>
          </div>
        </div>

        {/* 목록으로 하단 버튼 */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button
            onClick={() => navigate("/announcements")}
            style={{ padding: "10px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700, border: "1.5px solid #e2e8f0", background: "#fff", color: "#475569", cursor: "pointer" }}
          >
            목록으로
          </button>
        </div>
      </div>
    </div>
  );
}