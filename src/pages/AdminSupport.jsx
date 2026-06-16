import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, HelpCircle, Clock, CheckCircle, AlertCircle,
  XCircle, Eye, RefreshCw, ArrowLeft, Inbox, Send, ChevronRight,
  ChevronDown, Plus, Trash2, Edit3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ══════════════════════════════════════════════════════════════════════════
   상수, 헬퍼 & Axios 인스턴스 설정 (최종 정답)
══════════════════════════════════════════════════════════════════════════ */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

const api = axios.create({
  // Swagger 문서의 시작 공통 주소인 /api/support를 베이스로 확실하게 잡습니다.
  baseURL: `${BACKEND_URL}/api/support`, 
  headers: {
    "Content-Type": "application/json",
  }
});

// STATUS_META 상수 정의 (누락 방지)
const STATUS_META = {
  pending:   { label: "대기중",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: <Clock      className="w-3.5 h-3.5" /> },
  in_review: { label: "검토중",   color: "#4a90e2", bg: "rgba(74,144,226,0.12)",  icon: <Eye        className="w-3.5 h-3.5" /> },
  answered:  { label: "답변완료", color: "#34d399", bg: "rgba(52,211,153,0.12)", icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

/* ── 실제 백엔드 API 연동 객체 (Swagger와 1:1 완벽 매칭) ──────────────── */
const mockApi = {
  // --- 문의 관리 (Inquiries) ---
  getInquiries: async (params) => {
    // 최종 주소: http://48.211.169.52:8000/api/support/admin/inquiries
    const response = await api.get("/admin/inquiries", { params });
    return response.data;
  },
  getStats: async () => {
    // 최종 주소: http://48.211.169.52:8000/api/support/admin/inquiries/stats/summary
    const response = await api.get("/admin/inquiries/stats/summary");
    return response.data;
  },
  answerInquiry: async (id, payload) => {
    // 최종 주소: http://48.211.169.52:8000/api/support/admin/inquiries/{id}/answer
    // 💡 백엔드에 맞게 경로 뒤에 /answer 배치 및 admin_user_id는 필요시 쿼리스트링으로 전달
    const response = await api.patch(`/admin/inquiries/${id}/answer?admin_user_id=1`, payload);
    return response.data;
  },
  updateStatus: async (id, status) => {
    // 최종 주소: http://48.211.169.52:8000/api/support/admin/inquiries/{id}/answer
    const response = await api.patch(`/admin/inquiries/${id}/answer?admin_user_id=1`, { status });
    return response.data;
  },

  // --- FAQ 관리 ---
  getFaqs: async () => {
    // 최종 주소: http://48.211.169.52:8000/api/support/faqs
    const response = await api.get("/faqs");
    return response.data;
  },
  createFaq: async (data) => {
    // 최종 주소: http://48.211.169.52:8000/api/support/admin/faqs
    const response = await api.post("/admin/faqs", data);
    return response.data;
  },
  updateFaq: async (id, data) => {
    // 최종 주소: http://48.211.169.52:8000/api/support/admin/faqs/{id}
    const response = await api.patch(`/admin/faqs/${id}`, data);
    return response.data;
  },
  deleteFaq: async (id) => {
    // 최종 주소: http://48.211.169.52:8000/api/support/admin/faqs/{id}
    const response = await api.delete(`/admin/faqs/${id}`);
    return response.data;
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════════════════════════════════════════ */
export default function AdminSupportPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("inquiries");
  const [stats, setStats] = useState({ pending: 0, in_review: 0, answered: 0, closed: 0 });

  const loadStats = useCallback(async () => {
    try {
      const data = await mockApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("통계 데이터를 불러오는데 실패했습니다.", error);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const TABS = [
    { key: "inquiries", label: "1:1 문의 관리", icon: <MessageSquare className="w-4 h-4" /> },
    { key: "faqs",      label: "FAQ 관리",      icon: <HelpCircle    className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0e17", color: "#e8eaf0" }}>
      <header className="flex items-center justify-between px-10 py-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm transition hover:text-white"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </button>
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
          Admin
        </span>
      </header>

      <div className="px-10 pt-8 pb-6 max-w-7xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: "#4a90e2" }}>
          Admin Panel
        </p>
        <h1 className="text-3xl font-extrabold text-white mb-6" style={{ letterSpacing: "-0.03em" }}>
          고객센터 관리
        </h1>

        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Object.entries(STATUS_META).map(([key, m]) => (
            <div
              key={key}
              className="p-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: m.color }}>{m.label}</p>
              <p className="text-3xl font-black text-white">{stats[key] ?? 0}</p>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div
          className="inline-flex gap-2 p-1.5 rounded-2xl mb-8"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={
                  active
                    ? { background: "rgba(74,144,226,0.18)", color: "#fff", border: "1px solid rgba(74,144,226,0.3)" }
                    : { color: "rgba(255,255,255,0.35)", border: "1px solid transparent" }
                }
              >
                <span style={{ color: active ? "#4a90e2" : "rgba(255,255,255,0.3)" }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "inquiries" && <InquiryAdmin onStatsChange={setStats} />}
        {tab === "faqs"      && <FaqAdmin />}
    </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   1:1 문의 관리 패널 컴포넌트
══════════════════════════════════════════════════════════════════════════ */
function InquiryAdmin({ onStatsChange }) {
  const [inquiries, setInquiries] = useState([]); // 초기값은 항상 빈 배열
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selected, setSelected]             = useState(null);
  const [loading, setLoading]               = useState(false);

  const CATEGORIES = ["예약/결제", "환불", "멘토링 문제", "계정", "기타"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mockApi.getInquiries({ 
        status: filterStatus || undefined, 
        category: filterCategory || undefined 
      });
      
      // 💡 [디버깅용 로그] 서버에서 진짜 어떤 모양으로 데이터가 오는지 콘솔에서 확인해보세요!
      console.log("백엔드 응답 데이터 구조 확인:", res);

      // 🛡️ 에러 방지를 위한 3단계 방어 코드
      if (Array.isArray(res)) {
        // 1. 백엔드가 순수 배열 배열로 던져준 경우
        setInquiries(res);
      } else if (res && Array.isArray(res.data)) {
        // 2. 백엔드가 공통 포맷 객체 안의 data 필드에 배열을 담아준 경우 { success: true, data: [...] }
        setInquiries(res.data);
      } else if (res && Array.isArray(res.list)) {
        // 3. 백엔드가 페이징 처리를 하여 list 필드에 담아준 경우 { total: 100, list: [...] }
        setInquiries(res.list);
      } else {
        // 4. 그 외 예상치 못한 구조인 경우 빈 배열로 처리하여 .map() 에러 방지
        setInquiries([]);
      }
    } catch (error) {
      console.error("문의 목록을 가져오지 못했습니다.", error);
      setInquiries([]); // 에러 발생 시에도 빈 배열로 초기화
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory]);

  useEffect(() => { load(); }, [load]);

  // ... handleStatusChange 등 기존 로직 동일 ...

  return (
    <div className="flex gap-6" style={{ minHeight: 600 }}>
      {/* 목록 영역 */}
      <div className="flex flex-col gap-4 flex-1 min-w-0">
        {/* 필터 바 생략 */}

        {/* 문의 리스트 렌더링 영역 */}
        <div className="flex flex-col gap-2">
          {loading && <p className="text-center py-10 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>불러오는 중…</p>}
          
          {!loading && (!inquiries || inquiries.length === 0) && (
            <div className="flex flex-col items-center py-16 gap-3">
              <Inbox className="w-10 h-10" style={{ color: "rgba(255,255,255,0.1)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>해당하는 문의가 없습니다</p>
            </div>
          )}
          
          {/* 🛡️ 렌더링 시점에 한 번 더 안전장치 (Optional Chaining 및 배열 체크) */}
          {!loading && Array.isArray(inquiries) && inquiries.map(inq => (
            <button
              key={inq.id}
              onClick={() => setSelected(inq)}
              className="text-left flex items-start gap-4 px-5 py-4 rounded-2xl transition-all duration-150"
              style={{
                background: selected?.id === inq.id ? "rgba(74,144,226,0.07)" : "rgba(255,255,255,0.03)",
                border: selected?.id === inq.id ? "1px solid rgba(74,144,226,0.25)" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: STATUS_META[inq.status]?.color ?? "#fff" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)" }}>{inq.category}</span>
                  <StatusBadge status={inq.status} />
                  <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>{formatDate(inq.created_at)}</span>
                </div>
                <p className="text-sm font-semibold text-white truncate">{inq.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{inq.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0 self-center" style={{ color: "rgba(255,255,255,0.2)" }} />
            </button>
          ))}
        </div>
      </div>

      {/* 우측 상세 패널 */}
      {selected ? (
        <InquiryDetail
          inquiry={selected}
          onAnswered={async (updated) => {
            setSelected(updated);
            try {
              const s = await mockApi.getStats();
              onStatsChange(s);
              load();
            } catch (e) { console.error(e); }
          }}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl" style={{ width: 420, flexShrink: 0, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <MessageSquare className="w-10 h-10 mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>문의를 선택하면 상세 내용이 표시됩니다</p>
        </div>
      )}
    </div>
  );
}

/* ── 문의 상세 + 답변 패널 컴포넌트 ────────────────────────────────────── */
function InquiryDetail({ inquiry, onAnswered, onStatusChange }) {
  const [answer, setAnswer]     = useState(inquiry.answer ?? "");
  const [note, setNote]         = useState(inquiry.admin_note ?? "");
  const [status, setStatus]     = useState(inquiry.status);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    setAnswer(inquiry.answer ?? "");
    setNote(inquiry.admin_note ?? "");
    setStatus(inquiry.status);
  }, [inquiry.id, inquiry.answer, inquiry.admin_note, inquiry.status]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSaving(true);
    try {
      const updated = await mockApi.answerInquiry(inquiry.id, { answer, admin_note: note, status: "answered" });
      onAnswered(updated);
    } catch (error) {
      console.error("답변을 전송하지 못했습니다.", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col rounded-3xl overflow-hidden" style={{ width: 420, flexShrink: 0, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>{inquiry.category}</span>
        </div>
        <select
          value={status}
          onChange={async e => {
            const next = e.target.value;
            setStatus(next);
            await onStatusChange(inquiry.id, next);
          }}
          className="px-3 py-1 rounded-xl text-xs font-semibold outline-none"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5" style={{ scrollbarWidth: "none" }}>
        <div>
          <p className="text-base font-bold text-white mb-1">{inquiry.title}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{inquiry.email} · {formatDate(inquiry.created_at)}</p>
        </div>
        <div className="p-4 rounded-2xl text-sm leading-relaxed" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.07)" }}>{inquiry.body}</div>

        {inquiry.answered_at && (
          <div className="p-4 rounded-2xl text-sm leading-relaxed" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", color: "rgba(255,255,255,0.65)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#34d399" }}>✓ 기존 답변 · {formatDate(inquiry.answered_at)}</p>
            {inquiry.answer}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{inquiry.answered_at ? "답변 수정" : "답변 작성"}</p>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="고객에게 전달할 답변을 작성하세요…"
            className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-white/20"
            style={{ color: "rgba(255,255,255,0.8)", minHeight: 120, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px" }}
          />
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>내부 메모 (고객 비노출)</p>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="팀 내부 메모…"
            className="w-full outline-none text-sm placeholder-white/20"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", color: "rgba(255,255,255,0.6)" }}
          />
        </div>
      </div>

      <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            background: answer.trim() ? "linear-gradient(135deg,#4a90e2,#6c63ff)" : "rgba(255,255,255,0.06)",
            color: answer.trim() ? "#fff" : "rgba(255,255,255,0.2)",
            boxShadow: answer.trim() ? "0 6px 20px rgba(74,144,226,0.3)" : "none",
            cursor: answer.trim() ? "pointer" : "not-allowed",
          }}
        >
          <Send className="w-4 h-4" />
          {saving ? "저장 중…" : "답변 전송"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FAQ 관리 패널
══════════════════════════════════════════════════════════════════════════ */
function FaqAdmin() {
  const [faqs, setFaqs]             = useState([]); // 초기값은 항상 빈 배열
  const [editTarget, setEditTarget] = useState(null);   // null | "new" | {faq}
  const [openId, setOpenId]         = useState(null);
  const [loading, setLoading]       = useState(false);

  // 🛡️ 데이터를 안전하게 가져오는 로직으로 개편
  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mockApi.getFaqs();
      console.log("FAQ 백엔드 응답 구조 확인:", res);

      // 백엔드 응답 포맷에 따른 3단계 방어 코드
      if (Array.isArray(res)) {
        setFaqs(res);
      } else if (res && Array.isArray(res.data)) {
        setFaqs(res.data);
      } else if (res && Array.isArray(res.list)) {
        setFaqs(res.list);
      } else {
        setFaqs([]); // 예상치 못한 구조일 때 빈 배열 처리로 .filter/.map 에러 방지
      }
    } catch (error) {
      console.error("FAQ를 불러오는데 실패했습니다.", error);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const handleSave = async (data) => {
    try {
      if (editTarget === "new") {
        await mockApi.createFaq(data);
      } else {
        await mockApi.updateFaq(editTarget.id, data);
      }
      loadFaqs(); // 저장 후 목록 새로고침
      setEditTarget(null);
    } catch (error) {
      console.error("FAQ 저장 실패:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 FAQ를 비활성화하시겠습니까?")) return;
    try {
      await mockApi.deleteFaq(id);
      // 서버에서 Soft Delete 처리를 했다면 클라이언트 상태도 동기화
      setFaqs(prev => prev.map(f => f.id === id ? { ...f, is_active: false } : f));
      loadFaqs(); // 확실한 반영을 위해 새로고침
    } catch (error) {
      console.error("FAQ 삭제 실패:", error);
    }
  };

  // 🛡️ 데이터가 배열일 때만 filter를 돌리도록 한 번 더 안전장치 확보
  const safeFaqs = Array.isArray(faqs) ? faqs : [];
  const activeFaqs   = safeFaqs.filter(f => f && f.is_active !== false); // 기본값이 없거나 true인 것 선별
  const inactiveFaqs = safeFaqs.filter(f => f && f.is_active === false);

  return (
    <div className="flex gap-6">
      {/* FAQ 목록 */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">활성 FAQ ({activeFaqs.length}건)</p>
          <button
            onClick={() => setEditTarget("new")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#4a90e2,#6c63ff)", color: "#fff", boxShadow: "0 4px 12px rgba(74,144,226,0.3)" }}
          >
            <Plus className="w-3.5 h-3.5" /> FAQ 추가
          </button>
        </div>

        {loading && <p className="text-center py-10 text-sm text-white/20">불러오는 중…</p>}

        {!loading && activeFaqs.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <HelpCircle className="w-10 h-10 text-white/10" />
            <p className="text-sm text-white/20">등록된 FAQ가 없습니다.</p>
          </div>
        )}

        {!loading && activeFaqs.map(faq => {
          const open = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: open ? "rgba(74,144,226,0.05)" : "rgba(255,255,255,0.03)",
                border: open ? "1px solid rgba(74,144,226,0.2)" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                  onClick={() => setOpenId(open ? null : faq.id)}
                >
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(74,144,226,0.12)", color: "#4a90e2" }}
                  >
                    {faq.category}
                  </span>
                  <span className="text-sm font-semibold text-white truncate">{faq.question}</span>
                  {/* ⚠️ 최상단 import에 ChevronDown이 있어야 합니다 */}
                  <ChevronDown
                    className="w-4 h-4 flex-shrink-0 ml-auto transition-transform"
                    style={{ color: "rgba(255,255,255,0.25)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                <button
                  onClick={() => setEditTarget(faq)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80 flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition hover:opacity-80 flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {open && (
                <div
                  className="px-5 pb-4 text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.5)", borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <p className="pt-3 whitespace-pre-wrap">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}

        {!loading && inactiveFaqs.length > 0 && (
          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            비활성 FAQ {inactiveFaqs.length}건 (소프트 삭제됨)
          </p>
        )}
      </div>

      {/* 편집 패널 */}
      {editTarget !== null ? (
        <FaqEditPanel
          faq={editTarget === "new" ? null : editTarget}
          onSave={handleSave}
          onCancel={() => setEditTarget(null)}
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-3xl"
          style={{ width: 380, flexShrink: 0, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <HelpCircle className="w-10 h-10 mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>FAQ를 선택하거나 새로 추가하세요</p>
        </div>
      )}
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: "rgba(255,255,255,0.3)" }}>
      {children}
    </label>
  );
}
/* ── FAQ 편집 패널 ──────────────────────────────────────────────────── */
const FAQ_CATEGORIES = ["예약/결제", "환불", "멘토링", "계정", "기타"];

function FaqEditPanel({ faq, onSave, onCancel }) {
  const [category, setCategory] = useState(faq?.category ?? "예약/결제");
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer]     = useState(faq?.answer ?? "");
  const [order, setOrder]       = useState(faq?.sort_order ?? 1);
  const [saving, setSaving]     = useState(false);

  const canSave = category && question.trim() && answer.trim();

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave({ category, question, answer, sort_order: Number(order) });
    setSaving(false);
  };

  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden"
      style={{ width: 380, flexShrink: 0, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="px-6 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm font-bold text-white">{faq ? "FAQ 수정" : "FAQ 추가"}</p>
        <button onClick={onCancel} style={{ color: "rgba(255,255,255,0.3)" }}>
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 px-6 py-5 flex flex-col gap-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {/* 카테고리 */}
        <div>
          <Label>카테고리</Label>
          <div className="flex gap-2 flex-wrap mt-2">
            {FAQ_CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  category === c
                    ? { background: "rgba(74,144,226,0.15)", color: "#4a90e2", border: "1px solid rgba(74,144,226,0.35)" }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 순서 */}
        <div>
          <Label>노출 순서</Label>
          <input
            type="number" min={1} value={order}
            onChange={e => setOrder(e.target.value)}
            className="mt-1.5 w-24 outline-none text-sm"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 12px", color: "#e8eaf0" }}
          />
        </div>

        {/* 질문 */}
        <div>
          <Label>질문</Label>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="고객이 자주 하는 질문을 입력하세요"
            className="mt-1.5 w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-white/20"
            style={{ color: "rgba(255,255,255,0.8)", minHeight: 72, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px" }}
          />
        </div>

        {/* 답변 */}
        <div>
          <Label>답변</Label>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="질문에 대한 답변을 입력하세요"
            className="mt-1.5 w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-white/20"
            style={{ color: "rgba(255,255,255,0.8)", minHeight: 140, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px" }}
          />
        </div>

        <div
          className="p-3 rounded-xl text-xs leading-relaxed"
          style={{ background: "rgba(74,144,226,0.06)", border: "1px solid rgba(74,144,226,0.15)", color: "rgba(255,255,255,0.4)" }}
        >
          💡 저장하면 질문 + 답변이 자동으로 합쳐져 RAG 임베딩 텍스트로 저장됩니다.
        </div>
      </div>

      <div className="px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            background: canSave ? "linear-gradient(135deg,#4a90e2,#6c63ff)" : "rgba(255,255,255,0.06)",
            color: canSave ? "#fff" : "rgba(255,255,255,0.2)",
            boxShadow: canSave ? "0 6px 20px rgba(74,144,226,0.3)" : "none",
            cursor: canSave ? "pointer" : "not-allowed",
          }}
        >
          {saving ? "저장 중…" : faq ? "수정 저장" : "FAQ 추가"}
        </button>
      </div>
    </div>
  );
}