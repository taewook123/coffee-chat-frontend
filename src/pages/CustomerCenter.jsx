import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HelpCircle,
  MessageCircle,
  Bot,
  ChevronDown,
  Send,
  ArrowLeft,
  Search,
  User,
  Paperclip,
  CheckCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  Eye,
} from "lucide-react";

/* ─── 챗봇 로직 (AI 챗봇 작업 전까지 유지되는 사전 정의 답변) ────────────────────────────── */
const DEFAULT_BOT_RESPONSES = {
  default: "안녕하세요! 티타임즈 AI 도우미입니다. 무엇을 도와드릴까요?",
  "결제": "결제는 신용카드, 카카오페이, 네이버페이를 지원합니다. 환불 정책은 마이페이지의 이용 약관을 참고해 주세요.",
  "멘토": "멘토 신청은 상단 메뉴의 '멘토 지원하기'를 통해 상시 접수받고 있습니다.",
  "시간": "티타임 세션 시간 변경은 매칭 완료 후 영업일 기준 최소 24시간 전까지 가능합니다."
};

const DEFAULT_QUICK_REPLIES = ["결제 방법은 어떻게 되나요?", "멘토 지원 조건이 궁금해요", "시간 변경하고 싶어요"];

function getBotReply(input, responses) {
  for (const [key, val] of Object.entries(responses)) {
    if (key !== "default" && input.includes(key)) return val;
  }
  return "해당 내용은 담당자에게 연결이 필요할 수 있습니다. 1:1 문의를 이용하시면 더 정확한 답변을 받으실 수 있어요. 다른 궁금한 점이 있으신가요?";
}

function now() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

/* ═══════════════════════════════════════════════════════════════════════════
    MAIN PAGE COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function SupportPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("faq");

  const [faqs, setFaqs]               = useState([]);
  const [faqCategories, setFaqCategories] = useState(["전체"]);
  const [faqLoading, setFaqLoading]   = useState(true);
  const [faqError, setFaqError]       = useState(null);

  const [inquiryCategories] = useState(["서비스 이용", "결제/환불", "계정/인증", "기타"]);
  const [csInfo] = useState({
    operatingHours: "평일 10:00 ~ 18:00 (주말/공휴일 제외)",
    responseTimeHint: "15분 이내",
    responseTimeDetail: "영업일 기준 평균 1~2시간 이내 답변",
    email: "support@teatimes.com"
  });
  const [botResponses] = useState(DEFAULT_BOT_RESPONSES);
  const [quickReplies] = useState(DEFAULT_QUICK_REPLIES);

  useEffect(() => {
    const SERVER_URL = "http://48.211.169.52:8000";

    fetch(`${SERVER_URL}/api/support/faqs/categories`)
      .then((r) => { 
        if (!r.ok) throw new Error(); 
        return r.json(); 
      })
      .then((data) => {
        setFaqCategories(["전체", ...data]);
      })
      .catch((err) => {
        console.error("카테고리 에러:", err);
        setFaqError("카테고리를 불러오지 못했습니다.");
      });

    fetch(`${SERVER_URL}/api/support/faqs`)
      .then((r) => { 
        if (!r.ok) throw new Error(); 
        return r.json(); 
      })
      .then((data) => {
        setFaqs(data.map((f) => ({
          id: String(f.id),
          category: f.category,
          q: f.question,
          a: f.answer,
        })));
        setFaqLoading(false);
      })
      .catch((err) => {
        console.error("FAQ 목록 에러:", err);
        setFaqError("FAQ를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setFaqLoading(false);
      });
  }, []);

  const TABS = [
    { key: "faq",     label: "자주 묻는 질문", icon: <HelpCircle     className="w-5 h-5" /> },
    { key: "inquiry", label: "1:1 문의",       icon: <MessageCircle className="w-5 h-5" /> },
    { key: "chatbot", label: "AI 챗봇",        icon: <Bot className="w-5 h-5" /> },
  ];

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-300"
      style={{ background: "linear-gradient(135deg, #f4f8ff 0%, #e6f0fa 100%)", color: "#1a1f27" }}
    >
      <header
        className="flex items-center justify-between px-10 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(47, 107, 251, 0.1)" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium transition hover:text-blue-600"
          style={{ color: "#718096" }}
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-medium" style={{ color: "#718096" }}>
            {csInfo?.operatingHours ?? "로딩 중…"}
          </span>
        </div>
      </header>

      <div className="px-10 pt-10 pb-8 max-w-5xl mx-auto w-full">
        <p className="text-xs font-bold tracking-[0.15em] uppercase mb-3 text-blue-600">
          Customer Support
        </p>
        <h1
          className="leading-none tracking-tight mb-3"
          style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#1a1f27", letterSpacing: "-0.03em" }}
        >
          고객센터
        </h1>
        <p className="text-sm font-medium" style={{ color: "#718096" }}>
          궁금한 점이 있으신가요? 티타임즈가 빠르게 도와드릴게요.
        </p>
      </div>

      <div className="px-10 pb-8 max-w-5xl mx-auto w-full">
        <div
          className="inline-flex gap-2 p-1.5 rounded-2xl bg-white shadow-sm"
          style={{ border: "1px solid rgba(47, 107, 251, 0.1)" }}
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200"
                style={
                  active
                    ? { background: "#eff6ff", color: "#2f6bfb", border: "1px solid rgba(47, 107, 251, 0.2)" }
                    : { color: "#718096", border: "1px solid transparent" }
                }
              >
                <span style={{ color: active ? "#2f6bfb" : "#a0aec0" }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-10 pb-12 max-w-5xl mx-auto w-full">
        {tab === "faq" && (
          <FaqPanel categories={faqCategories} faqs={faqs} loading={faqLoading} error={faqError} />
        )}
        {tab === "inquiry" && (
          <InquiryPanel categories={inquiryCategories} info={csInfo} />
        )}
        {tab === "chatbot" && (
          <ChatbotPanel responses={botResponses} quickReplies={quickReplies} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
    FAQ PANEL
══════════════════════════════════════════════════════════════════════════ */
function FaqPanel({ categories, faqs, loading, error }) {
  const [activeCat, setActiveCat] = useState("전체");
  const [query, setQuery]         = useState("");
  const [openId, setOpenId]       = useState(null);

  const filtered = faqs.filter((f) => {
    const matchCat = activeCat === "전체" || f.category === activeCat;
    const matchQ   = query.trim() === "" || f.q.includes(query) || f.a.includes(query);
    return matchCat && matchQ;
  });

  return (
    <div className="flex flex-col gap-6">
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
        style={{ border: "1px solid rgba(47, 107, 251, 0.15)" }}
      >
        <Search className="w-5 h-5 flex-shrink-0 text-blue-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="궁금한 내용을 검색하세요…"
          className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 font-medium"
          style={{ color: "#1a1f27" }}
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const active = activeCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className="px-4 py-2 rounded-full text-xs font-bold transition-all duration-150 shadow-sm"
              style={
                active
                  ? { background: "#eff6ff", color: "#2f6bfb", border: "1px solid rgba(47, 107, 251, 0.3)" }
                  : { background: "#ffffff", color: "#718096", border: "1px solid rgba(47, 107, 251, 0.1)" }
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "rgba(47, 107, 251, 0.2)", borderTopColor: "#2f6bfb" }}
          />
          <p className="text-sm font-medium" style={{ color: "#718096" }}>질문을 불러오는 중…</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-500">
          ⚠ {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {filtered.map((faq) => {
            const open = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl overflow-hidden transition-all duration-200 shadow-sm"
                style={{
                  background: open ? "#f8faff" : "#ffffff",
                  border: open ? "1px solid rgba(47, 107, 251, 0.3)" : "1px solid rgba(47, 107, 251, 0.1)",
                }}
              >
                <button
                  onClick={() => setOpenId(open ? null : faq.id)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-blue-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0"
                      style={{ background: "#eff6ff", color: "#2f6bfb" }}
                    >
                      {faq.category}
                    </span>
                    <span
                      className="text-sm font-bold truncate"
                      style={{ color: open ? "#2f6bfb" : "#1a1f27" }}
                    >
                      {faq.q}
                    </span>
                  </div>
                  <ChevronDown
                    className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
                    style={{ color: open ? "#2f6bfb" : "#a0aec0", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {open && (
                  <div
                    className="px-6 pb-6 text-sm leading-relaxed"
                    style={{ color: "#4a5568", borderTop: "1px solid rgba(47, 107, 251, 0.05)" }}
                  >
                    <p className="pt-4 font-medium">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3 bg-white rounded-2xl border border-blue-500/10 shadow-sm">
              <HelpCircle className="w-12 h-12 text-gray-300" />
              <p className="text-sm font-medium" style={{ color: "#a0aec0" }}>검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
    1:1 INQUIRY PANEL
══════════════════════════════════════════════════════════════════════════ */
function InquiryPanel({ categories, info }) {
  const [category, setCategory]     = useState("");
  const [title, setTitle]           = useState("");
  const [body, setBody]             = useState("");
  const [email, setEmail]           = useState("");
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const canSubmit = category && title.trim() && body.trim() && email.trim();

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/support/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, body, email, user_id: null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail ?? "서버 오류가 발생했습니다.");
      }
      setSubmitted(true);
    } catch (e) {
      setSubmitError(e.message || "문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-6 bg-white p-8 rounded-3xl shadow-sm border border-blue-500/10">
        <div>
          <Label>문의 유형</Label>
          <div className="flex gap-2 flex-wrap mt-3">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150"
                style={
                  category === c
                    ? { background: "#eff6ff", color: "#2f6bfb", border: "1px solid rgba(47, 107, 251, 0.3)" }
                    : { background: "#f8faff", color: "#718096", border: "1px solid rgba(47, 107, 251, 0.1)" }
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <Field label="답변받을 이메일">
          <FieldInput value={email} onChange={setEmail} placeholder="example@email.com" type="email" />
        </Field>

        <Field label="제목">
          <FieldInput value={title} onChange={setTitle} placeholder="문의 제목을 입력하세요" maxLength={80} />
        </Field>

        <Field label="문의 내용">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="문의 내용을 자세히 작성해주세요. 티타임 날짜 등 관련 정보를 함께 적어주시면 더 빠른 답변이 가능합니다."
            className="w-full bg-white outline-none resize-none text-sm leading-relaxed placeholder-gray-400 font-medium transition-all focus:ring-2 focus:ring-blue-500/20"
            style={{
              color: "#1a1f27",
              minHeight: 160,
              border: "1px solid rgba(47, 107, 251, 0.15)",
              borderRadius: 16,
              padding: "16px",
            }}
          />
          <p className="text-xs mt-1.5 text-right font-medium" style={{ color: "#a0aec0" }}>
            {body.length}자
          </p>
        </Field>

        <button
          className="flex items-center gap-2 text-sm font-semibold transition hover:text-blue-600 self-start"
          style={{ color: "#718096" }}
        >
          <Paperclip className="w-4 h-4" />
          파일 첨부 (선택, 최대 10MB)
        </button>

        {submitError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-red-50 border border-red-200 text-red-500">
            ⚠ {submitError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="flex items-center justify-center gap-2 py-4 mt-2 rounded-xl text-sm font-bold transition-all duration-200 shadow-md"
          style={{
            background: canSubmit && !submitting ? "linear-gradient(135deg, #2f6bfb, #4a90e2)" : "#f1f5f9",
            color:      canSubmit && !submitting ? "#fff" : "#a0aec0",
            boxShadow:  canSubmit && !submitting ? "0 8px 20px rgba(47, 107, 251, 0.25)" : "none",
            cursor:     canSubmit && !submitting ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? (
            <>
              <div
                className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "transparent" }}
              />
              전송 중…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              문의 제출하기
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {[
          { icon: <Clock className="w-5 h-5" />, title: "평균 응답 시간", desc: info.responseTimeDetail, color: "#2f6bfb" },
          { icon: <Mail  className="w-5 h-5" />, title: "이메일 지원",   desc: info.email,               color: "#8b5cf6" },
          { icon: <Phone className="w-5 h-5" />, title: "전화 상담",    desc: info.operatingHours,    color: "#10b981" },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-4 p-5 rounded-2xl bg-white shadow-sm"
            style={{ border: "1px solid rgba(47, 107, 251, 0.1)" }}
          >
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: `${item.color}15`, color: item.color }}
            >
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900">{item.title}</p>
              <p className="text-xs mt-1 font-medium leading-relaxed" style={{ color: "#718096" }}>{item.desc}</p>
            </div>
          </div>
        ))}

        <div
          className="p-5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm mt-2"
          style={{ background: "#eff6ff", border: "1px solid rgba(47, 107, 251, 0.2)", color: "#2f6bfb" }}
        >
          💡 <strong>자주 묻는 질문</strong>에서 답변을 먼저 찾아보시면 더 빠르게 해결될 수 있어요.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
    CHATBOT PANEL
══════════════════════════════════════════════════════════════════════════ */
function ChatbotPanel({ responses, quickReplies }) {
  const defaultMsg = responses?.default ?? "안녕하세요! 잠시만 기다려 주세요.";
  const [messages, setMessages] = useState([
    { id: 0, role: "bot", text: defaultMsg, time: now() },
  ]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef           = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text) => {
    if (!text.trim() || !responses) return;
    const userMsg = { id: Date.now(), role: "user", text: text.trim(), time: now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(text, responses);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "bot", text: reply, time: now() }]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  };

  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden bg-white shadow-lg mx-auto max-w-3xl"
      style={{ height: 600, border: "1px solid rgba(47, 107, 251, 0.15)" }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(47, 107, 251, 0.1)", background: "#f8faff" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: "linear-gradient(135deg, #2f6bfb, #4a90e2)" }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "#1a1f27" }}>티타임즈 AI 도우미</p>
          <p className="text-xs font-semibold flex items-center gap-1.5 mt-0.5" style={{ color: "#10b981" }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            온라인
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5" style={{ scrollbarWidth: "none", background: "#ffffff" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "bot" ? (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 self-end shadow-sm"
                style={{ background: "linear-gradient(135deg, #2f6bfb, #4a90e2)" }}
              >
                <Bot className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 self-end bg-gray-100"
              >
                <User className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div className={`flex flex-col gap-1.5 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className="px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm"
                style={
                  msg.role === "bot"
                    ? { background: "#f1f5f9", color: "#1a1f27", borderBottomLeftRadius: 6 }
                    : { background: "linear-gradient(135deg, #2f6bfb, #4a90e2)", color: "#fff", borderBottomRightRadius: 6 }
                }
              >
                {msg.text}
              </div>
              <span className="text-[11px] font-semibold px-1" style={{ color: "#a0aec0" }}>{msg.time}</span>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              style={{ background: "linear-gradient(135deg, #2f6bfb, #4a90e2)" }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div
              className="flex items-center gap-1.5 px-5 py-4 rounded-2xl"
              style={{ background: "#f1f5f9", borderBottomLeftRadius: 6 }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        className="flex gap-2 px-6 py-4 overflow-x-auto flex-shrink-0"
        style={{ borderTop: "1px solid rgba(47, 107, 251, 0.05)", background: "#ffffff", scrollbarWidth: "none" }}
      >
        {(quickReplies ?? []).map((qr) => (
          <button
            key={qr}
            onClick={() => sendMessage(qr)}
            className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-colors shadow-sm hover:bg-blue-100"
            style={{ background: "#eff6ff", color: "#2f6bfb", border: "1px solid rgba(47, 107, 251, 0.2)" }}
          >
            {qr}
          </button>
        ))}
      </div>

      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0 bg-white"
        style={{ borderTop: "1px solid rgba(47, 107, 251, 0.1)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="메시지를 입력하세요…"
          className="flex-1 bg-gray-50 rounded-xl px-4 py-3 outline-none text-sm placeholder-gray-400 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all border border-transparent focus:border-blue-500/20"
          style={{ color: "#1a1f27" }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-sm"
          style={{
            background: input.trim() ? "linear-gradient(135deg, #2f6bfb, #4a90e2)" : "#f1f5f9",
            color:      input.trim() ? "#fff" : "#a0aec0",
            boxShadow:  input.trim() ? "0 4px 12px rgba(47, 107, 251, 0.3)" : "none",
          }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.05em] mb-1" style={{ color: "#718096" }}>
      {children}
    </p>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FieldInput({ value, onChange, placeholder, type = "text", maxLength }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full bg-white outline-none text-sm placeholder-gray-400 font-medium transition-all focus:ring-2 focus:ring-blue-500/20"
      style={{
        border: "1px solid rgba(47, 107, 251, 0.15)",
        borderRadius: "14px",
        padding: "14px 16px",
        color: "#1a1f27",
      }}
    />
  );
}