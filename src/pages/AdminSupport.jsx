import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, HelpCircle, Clock, CheckCircle,
  XCircle, Eye, RefreshCw, ArrowLeft, Inbox, Send, ChevronRight,
  ChevronDown, Plus, Trash2, Edit3, Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://48.211.169.52:8000";
const api = axios.create({ baseURL: `${BACKEND_URL}/api/support`, headers: { "Content-Type": "application/json" } });

const C = {
  bg: "#f1f5f9", surface: "#ffffff", border: "#e2e8f0", borderHover: "#cbd5e1",
  text: "#0f172a", sub: "#64748b", muted: "#94a3b8",
  blue: "#2563eb", blueBg: "#eff6ff", blueBorder: "#bfdbfe",
  indigo: "#6366f1",
  green: "#059669", greenBg: "#ecfdf5", greenBorder: "#a7f3d0",
  amber: "#d97706", amberBg: "#fffbeb", amberBorder: "#fde68a",
  red: "#dc2626", redBg: "#fef2f2", redBorder: "#fecaca",
};

const STATUS_META = {
  pending:   { label: "대기 중",   color: C.amber, bg: C.amberBg, border: C.amberBorder, stripe: "#f59e0b", icon: <Clock       className="w-3.5 h-3.5" /> },
  in_review: { label: "검토 중",   color: C.blue,  bg: C.blueBg,  border: C.blueBorder,  stripe: "#2563eb", icon: <Eye         className="w-3.5 h-3.5" /> },
  answered:  { label: "답변 완료", color: C.green, bg: C.greenBg, border: C.greenBorder, stripe: "#059669", icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
           .replace(/\. /g, ".").replace(/\.$/, "");
}

function StatusBadge({ status }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border"
      style={{ background: m.bg, color: m.color, borderColor: m.border }}>
      {m.icon}{m.label}
    </span>
  );
}

const mockApi = {
  getInquiries: async (params) => (await api.get("/admin/inquiries", { params })).data,
  getStats:     async ()        => (await api.get("/admin/inquiries/stats/summary")).data,
  answerInquiry: async (id, payload) => (await api.patch(`/admin/inquiries/${id}/answer?admin_user_id=1`, payload)).data,
  updateStatus:  async (id, status)  => (await api.patch(`/admin/inquiries/${id}/answer?admin_user_id=1`, { status })).data,
  getFaqs:    async ()         => (await api.get("/faqs")).data,
  createFaq:  async (data)     => (await api.post("/admin/faqs", data)).data,
  updateFaq:  async (id, data) => (await api.patch(`/admin/faqs/${id}`, data)).data,
  deleteFaq:  async (id)       => (await api.delete(`/admin/faqs/${id}`)).data,
};

export default function AdminSupportPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("inquiries");
  const [stats, setStats] = useState({ pending: 0, in_review: 0, answered: 0 });

  const loadStats = useCallback(async () => {
    try { setStats(await mockApi.getStats()); } catch (e) { console.error(e); }
  }, []);
  useEffect(() => { loadStats(); }, [loadStats]);

  const TABS = [
    { key: "inquiries", label: "1:1 문의",  icon: <MessageSquare className="w-4 h-4" /> },
    { key: "faqs",      label: "FAQ 관리",  icon: <HelpCircle    className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.text }}>

      {/* 헤더 */}
      <header className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium transition-all hover:gap-3"
          style={{ color: C.sub }}>
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </button>
        <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full"
          style={{ background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}` }}>
          Admin
        </span>
      </header>

      <div className="px-8 pt-8 pb-12 max-w-7xl mx-auto w-full">

        {/* 타이틀 */}
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.15em] uppercase mb-1" style={{ color: C.blue }}>고객센터</p>
          <h1 className="text-2xl font-extrabold" style={{ color: C.text, letterSpacing: "-0.03em" }}>관리자 대시보드</h1>
        </div>

        {/* 통계 카드 — 좌측 컬러 스트라이프 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {Object.entries(STATUS_META).map(([key, m]) => (
            <div key={key} className="rounded-2xl overflow-hidden flex"
              style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div className="w-1.5 flex-shrink-0" style={{ background: m.stripe }} />
              <div className="flex items-center gap-4 px-5 py-5 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: m.bg, color: m.color }}>
                  {m.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: m.color }}>{m.label}</p>
                  <p className="text-3xl font-black leading-none" style={{ color: C.text }}>{stats[key] ?? 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 탭 */}
        <div className="inline-flex gap-1 p-1 rounded-xl mb-8" style={{ background: C.border }}>
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={active
                  ? { background: C.surface, color: C.blue, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                  : { color: C.sub }}>
                <span style={{ color: active ? C.blue : C.muted }}>{t.icon}</span>
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

function InquiryAdmin({ onStatsChange }) {
  const [inquiries, setInquiries]           = useState([]);
  const [filterStatus, setFilterStatus]     = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selected, setSelected]             = useState(null);
  const [loading, setLoading]               = useState(false);
  const CATEGORIES = ["예약/결제", "환불", "멘토링 문제", "계정", "기타"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mockApi.getInquiries({ status: filterStatus || undefined, category: filterCategory || undefined });
      setInquiries(Array.isArray(res) ? res : res?.data ?? res?.list ?? []);
    } catch (e) { console.error(e); setInquiries([]); }
    finally { setLoading(false); }
  }, [filterStatus, filterCategory]);
  useEffect(() => { load(); }, [load]);

  const handleStatusChange = useCallback(async (id, nextStatus) => {
    try {
      await mockApi.updateStatus(id, nextStatus);
      setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status: nextStatus } : inq));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status: nextStatus }));
      onStatsChange(await mockApi.getStats());
    } catch (e) { console.error(e); }
  }, [selected, onStatsChange]);

  return (
    <div className="flex gap-5" style={{ minHeight: 600 }}>
      <div className="flex flex-col gap-3 flex-1 min-w-0">

        {/* 필터 바 */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.muted }} />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="outline-none text-xs font-semibold px-3 py-1.5"
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: filterStatus ? C.text : C.muted, borderRadius: 8 }}>
            <option value="">전체 상태</option>
            {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="outline-none text-xs font-semibold px-3 py-1.5"
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: filterCategory ? C.text : C.muted, borderRadius: 8 }}>
            <option value="">전체 카테고리</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(filterStatus || filterCategory) && (
            <button onClick={() => { setFilterStatus(""); setFilterCategory(""); }}
              className="text-xs font-semibold hover:opacity-70" style={{ color: C.blue }}>
              초기화
            </button>
          )}
          <button onClick={load} className="ml-auto flex items-center gap-1.5 text-xs font-medium hover:opacity-70"
            style={{ color: C.sub }}>
            <RefreshCw className="w-3.5 h-3.5" /> 새로고침
          </button>
        </div>

        {/* 목록 */}
        <div className="flex flex-col gap-2">
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2" style={{ color: C.muted }}>
              <RefreshCw className="w-4 h-4 animate-spin" /><span className="text-sm">불러오는 중…</span>
            </div>
          )}
          {!loading && inquiries.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <Inbox className="w-10 h-10" style={{ color: C.border }} />
              <p className="text-sm" style={{ color: C.muted }}>
                {filterStatus || filterCategory ? "조건에 맞는 문의가 없습니다" : "접수된 문의가 없습니다"}
              </p>
            </div>
          )}
          {!loading && inquiries.map(inq => {
            const isSelected = selected?.id === inq.id;
            const m = STATUS_META[inq.status];
            return (
              <button key={inq.id} onClick={() => setSelected(inq)}
                className="text-left flex items-start gap-4 px-4 py-4 rounded-xl transition-all duration-150"
                style={{
                  background: isSelected ? C.blueBg : C.surface,
                  border: `1px solid ${isSelected ? C.blueBorder : C.border}`,
                  boxShadow: isSelected ? `0 0 0 2px ${C.blueBg}` : "0 1px 3px rgba(0,0,0,0.04)",
                }}
                onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = C.borderHover; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)"; }}}
                onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; }}}>
                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: m?.stripe ?? C.muted }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{ background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}>
                      {inq.category}
                    </span>
                    <StatusBadge status={inq.status} />
                    <span className="text-xs ml-auto" style={{ color: C.muted }}>{formatDate(inq.created_at)}</span>
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: C.text }}>{inq.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: C.muted }}>{inq.email}</p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0 self-center" style={{ color: C.muted }} />
              </button>
            );
          })}
        </div>
      </div>

      {selected ? (
        <InquiryDetail inquiry={selected}
          onAnswered={async (updated) => {
            setSelected(updated);
            try { onStatsChange(await mockApi.getStats()); load(); } catch (e) { console.error(e); }
          }}
          onStatusChange={handleStatusChange} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl"
          style={{ width: 400, flexShrink: 0, background: C.surface, border: `1px dashed ${C.border}` }}>
          <MessageSquare className="w-8 h-8 mb-2" style={{ color: C.border }} />
          <p className="text-sm font-medium" style={{ color: C.muted }}>문의를 선택하면 상세 내용이 표시됩니다</p>
        </div>
      )}
    </div>
  );
}

function InquiryDetail({ inquiry, onAnswered, onStatusChange }) {
  const [answer, setAnswer] = useState(inquiry.answer ?? "");
  const [note,   setNote]   = useState(inquiry.admin_note ?? "");
  const [status, setStatus] = useState(inquiry.status);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnswer(inquiry.answer ?? ""); setNote(inquiry.admin_note ?? ""); setStatus(inquiry.status);
  }, [inquiry.id, inquiry.answer, inquiry.admin_note, inquiry.status]);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setSaving(true);
    try { onAnswered(await mockApi.answerInquiry(inquiry.id, { answer, admin_note: note, status: "answered" })); }
    catch (e) { console.error(e); } finally { setSaving(false); }
  };
  const canSubmit = answer.trim() && !saving;

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden"
      style={{ width: 400, flexShrink: 0, background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={status} />
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}>
            {inquiry.category}
          </span>
        </div>
        <select value={status}
          onChange={async e => { const next = e.target.value; setStatus(next); await onStatusChange(inquiry.id, next); }}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold outline-none"
          style={{ background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}>
          {Object.entries(STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5" style={{ scrollbarWidth: "none" }}>
        <div>
          <p className="text-base font-bold mb-1" style={{ color: C.text }}>{inquiry.title}</p>
          <p className="text-xs" style={{ color: C.muted }}>{inquiry.email} · {formatDate(inquiry.created_at)}</p>
        </div>

        <div className="p-4 rounded-xl text-sm leading-relaxed"
          style={{ background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}>
          {inquiry.body}
        </div>

        {inquiry.answered_at && (
          <div className="p-4 rounded-xl text-sm leading-relaxed"
            style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.sub }}>
            <p className="text-xs font-semibold mb-2" style={{ color: C.green }}>✓ 기존 답변 · {formatDate(inquiry.answered_at)}</p>
            {inquiry.answer}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>
            {inquiry.answered_at ? "답변 수정" : "답변 작성"}
          </p>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder="고객에게 전달할 답변을 작성하세요…"
            className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed"
            style={{ color: C.text, minHeight: 120, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px" }}
            onFocus={e => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.blueBg}`; }}
            onBlur={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }} />

          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>
            내부 메모{" "}
            <span className="normal-case tracking-normal font-normal" style={{ color: C.muted }}>· 고객에게 표시되지 않음</span>
          </p>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="팀 내부 메모…"
            className="w-full outline-none text-sm"
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text }}
            onFocus={e => { e.currentTarget.style.borderColor = C.blue; }}
            onBlur={e => { e.currentTarget.style.borderColor = C.border; }} />
        </div>
      </div>

      <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            background: canSubmit ? `linear-gradient(135deg, ${C.blue}, ${C.indigo})` : C.bg,
            color:      canSubmit ? "#fff" : C.muted,
            boxShadow:  canSubmit ? "0 4px 14px rgba(37,99,235,0.25)" : "none",
            cursor:     canSubmit ? "pointer" : "not-allowed",
            border:     `1px solid ${canSubmit ? "transparent" : C.border}`,
          }}>
          <Send className="w-4 h-4" />
          {saving ? "전송 중…" : inquiry.answered_at ? "답변 수정" : "답변 전송"}
        </button>
      </div>
    </div>
  );
}

function FaqAdmin() {
  const [faqs, setFaqs]             = useState([]);
  const [editTarget, setEditTarget] = useState(null);
  const [openId, setOpenId]         = useState(null);
  const [loading, setLoading]       = useState(false);

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mockApi.getFaqs();
      setFaqs(Array.isArray(res) ? res : res?.data ?? res?.list ?? []);
    } catch (e) { console.error(e); setFaqs([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadFaqs(); }, [loadFaqs]);

  const handleSave = async (data) => {
    try {
      editTarget === "new" ? await mockApi.createFaq(data) : await mockApi.updateFaq(editTarget.id, data);
      await loadFaqs(); setEditTarget(null);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("이 FAQ를 비활성화하시겠습니까?")) return;
    try { await mockApi.deleteFaq(id); setFaqs(prev => prev.map(f => f.id === id ? { ...f, is_active: false } : f)); loadFaqs(); }
    catch (e) { console.error(e); }
  };

  const safeFaqs     = Array.isArray(faqs) ? faqs : [];
  const activeFaqs   = safeFaqs.filter(f => f?.is_active !== false);
  const inactiveFaqs = safeFaqs.filter(f => f?.is_active === false);

  return (
    <div className="flex gap-5">
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: C.text }}>
            활성 FAQ <span className="font-normal" style={{ color: C.muted }}>({activeFaqs.length}건)</span>
          </p>
          <button onClick={() => setEditTarget("new")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
            style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.indigo})`, color: "#fff", boxShadow: "0 3px 10px rgba(37,99,235,0.25)" }}>
            <Plus className="w-3.5 h-3.5" /> FAQ 추가
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-2" style={{ color: C.muted }}>
            <RefreshCw className="w-4 h-4 animate-spin" /><span className="text-sm">불러오는 중…</span>
          </div>
        )}
        {!loading && activeFaqs.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <HelpCircle className="w-10 h-10" style={{ color: C.border }} />
            <p className="text-sm" style={{ color: C.muted }}>등록된 FAQ가 없습니다</p>
          </div>
        )}

        {!loading && activeFaqs.map(faq => {
          const open = openId === faq.id;
          return (
            <div key={faq.id} className="rounded-xl overflow-hidden transition-all"
              style={{
                background: C.surface,
                border: `1px solid ${open ? C.blueBorder : C.border}`,
                boxShadow: open ? `0 0 0 2px ${C.blueBg}` : "0 1px 3px rgba(0,0,0,0.04)",
              }}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <button className="flex-1 flex items-center gap-3 text-left min-w-0"
                  onClick={() => setOpenId(open ? null : faq.id)}>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}` }}>
                    {faq.category}
                  </span>
                  <span className="text-sm font-semibold truncate" style={{ color: C.text }}>{faq.question}</span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 ml-auto transition-transform"
                    style={{ color: C.muted, transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                <button onClick={() => setEditTarget(faq)} title="수정"
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 flex-shrink-0"
                  style={{ background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}>
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(faq.id)} title="비활성화"
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-70 flex-shrink-0"
                  style={{ background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}` }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {open && (
                <div className="px-4 pb-4 text-sm leading-relaxed"
                  style={{ borderTop: `1px solid ${C.border}`, color: C.sub }}>
                  <p className="pt-3 whitespace-pre-wrap">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}

        {!loading && inactiveFaqs.length > 0 && (
          <p className="text-xs mt-1" style={{ color: C.muted }}>비활성 FAQ {inactiveFaqs.length}건 (소프트 삭제됨)</p>
        )}
      </div>

      {editTarget !== null ? (
        <FaqEditPanel faq={editTarget === "new" ? null : editTarget} onSave={handleSave} onCancel={() => setEditTarget(null)} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl"
          style={{ width: 360, flexShrink: 0, background: C.surface, border: `1px dashed ${C.border}` }}>
          <HelpCircle className="w-8 h-8 mb-2" style={{ color: C.border }} />
          <p className="text-sm font-medium" style={{ color: C.muted }}>FAQ를 선택하거나 새로 추가하세요</p>
        </div>
      )}
    </div>
  );
}

function Label({ children }) {
  return <label className="text-xs font-bold uppercase tracking-widest mb-1.5 block" style={{ color: C.muted }}>{children}</label>;
}

const FAQ_CATEGORIES = ["예약/결제", "환불", "멘토링", "계정", "기타"];

function FaqEditPanel({ faq, onSave, onCancel }) {
  const [category, setCategory] = useState(faq?.category ?? "예약/결제");
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer,   setAnswer]   = useState(faq?.answer   ?? "");
  const [order,    setOrder]    = useState(faq?.sort_order ?? 1);
  const [saving,   setSaving]   = useState(false);

  const canSave = category && question.trim() && answer.trim();
  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave({ category, question, answer, sort_order: Number(order) });
    setSaving(false);
  };

  const inputStyle = {
    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12,
    padding: "10px 14px", color: C.text, width: "100%", outline: "none", fontSize: 14,
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden"
      style={{ width: 360, flexShrink: 0, background: C.surface, border: `1px solid ${C.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

      <div className="px-5 py-4 flex-shrink-0 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${C.border}` }}>
        <p className="text-sm font-bold" style={{ color: C.text }}>{faq ? "FAQ 수정" : "새 FAQ 추가"}</p>
        <button onClick={onCancel} className="hover:opacity-60 transition-opacity" style={{ color: C.muted }}>
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div>
          <Label>카테고리</Label>
          <div className="flex gap-2 flex-wrap">
            {FAQ_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={category === c
                  ? { background: C.blueBg, color: C.blue, border: `1px solid ${C.blueBorder}` }
                  : { background: C.bg, color: C.sub, border: `1px solid ${C.border}` }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>노출 순서</Label>
          <input type="number" min={1} value={order} onChange={e => setOrder(e.target.value)}
            style={{ ...inputStyle, width: 80 }} />
        </div>

        <div>
          <Label>질문</Label>
          <textarea value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="고객이 자주 묻는 질문을 입력하세요"
            style={{ ...inputStyle, minHeight: 72, resize: "none" }} />
        </div>

        <div>
          <Label>답변</Label>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)}
            placeholder="질문에 대한 답변을 입력하세요"
            style={{ ...inputStyle, minHeight: 140, resize: "none" }} />
        </div>

        <div className="p-3 rounded-xl text-xs leading-relaxed"
          style={{ background: C.blueBg, border: `1px solid ${C.blueBorder}`, color: C.blue }}>
          💡 저장하면 질문 + 답변이 자동으로 합쳐져 RAG 임베딩 텍스트로 저장됩니다.
        </div>
      </div>

      <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
        <button onClick={handleSave} disabled={!canSave || saving}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
          style={{
            background: canSave ? `linear-gradient(135deg, ${C.blue}, ${C.indigo})` : C.bg,
            color:      canSave ? "#fff" : C.muted,
            boxShadow:  canSave ? "0 4px 14px rgba(37,99,235,0.25)" : "none",
            cursor:     canSave ? "pointer" : "not-allowed",
            border:     `1px solid ${canSave ? "transparent" : C.border}`,
          }}>
          {saving ? "저장 중…" : faq ? "변경사항 저장" : "FAQ 추가"}
        </button>
      </div>
    </div>
  );
}
