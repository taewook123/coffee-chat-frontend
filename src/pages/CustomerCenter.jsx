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
} from "lucide-react";

/* ─── 1. 비즈니스 로직 함수 ────────────────────────────────────────────── */
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
export default function SupportPage({
  faqCategories = DEFAULT_FAQ_CATEGORIES,
  faqs = DEFAULT_FAQS,
  inquiryCategories = DEFAULT_INQUIRY_CATEGORIES,
  botResponses = DEFAULT_BOT_RESPONSES,
  quickReplies = DEFAULT_QUICK_REPLIES,
  customerServiceInfo = DEFAULT_CS_INFO,
}) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("faq");

  const TABS = [
    { key: "faq",     label: "자주 묻는 질문", icon: <HelpCircle className="w-5 h-5" /> },
    { key: "inquiry", label: "1:1 문의",       icon: <MessageCircle className="w-5 h-5" /> },
    { key: "chatbot", label: "AI 챗봇",        icon: <Bot className="w-5 h-5" /> },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0a0e17", color: "#e8eaf0", fontFamily: "'Inter', sans-serif" }}
    >
      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-10 py-5 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm transition hover:text-white"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {customerServiceInfo.operatingHours}
          </span>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="px-10 pt-10 pb-8 max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: "#4a90e2" }}>
          Customer Support
        </p>
        <h1
          className="leading-none tracking-tight mb-3"
          style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}
        >
          고객센터
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          궁금한 점이 있으신가요? 빠르게 도와드릴게요.
        </p>
      </div>

      {/* ── Tab selector ── */}
      <div className="px-10 pb-8 max-w-5xl mx-auto w-full">
        <div
          className="inline-flex gap-2 p-1.5 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
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
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-10 pb-12 max-w-5xl mx-auto w-full">
        {tab === "faq"     && <FaqPanel categories={faqCategories} faqs={faqs} />}
        {tab === "inquiry" && <InquiryPanel categories={inquiryCategories} info={customerServiceInfo} />}
        {tab === "chatbot" && <ChatbotPanel responses={botResponses} quickReplies={quickReplies} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
    FAQ PANEL
══════════════════════════════════════════════════════════════════════════ */
function FaqPanel({ categories, faqs }) {
  const [activeCat, setActiveCat] = useState("전체");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const filtered = faqs.filter((f) => {
    const matchCat = activeCat === "전체" || f.category === activeCat;
    const matchQ = query.trim() === "" || f.q.includes(query) || f.a.includes(query);
    return matchCat && matchQ;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="궁금한 내용을 검색하세요…"
          className="flex-1 bg-transparent outline-none text-sm placeholder-white/25"
          style={{ color: "#e8eaf0" }}
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const active = activeCat === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={
                active
                  ? { background: "rgba(74,144,226,0.15)", color: "#4a90e2", border: "1px solid rgba(74,144,226,0.35)" }
                  : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Accordion list */}
      <div className="flex flex-col gap-2">
        {filtered.map((faq) => {
          const open = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                background: open ? "rgba(74,144,226,0.06)" : "rgba(255,255,255,0.03)",
                border: open ? "1px solid rgba(74,144,226,0.2)" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <button
                onClick={() => setOpenId(open ? null : faq.id)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "rgba(74,144,226,0.12)", color: "#4a90e2" }}
                  >
                    {faq.category}
                  </span>
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: open ? "#fff" : "rgba(255,255,255,0.8)" }}
                  >
                    {faq.q}
                  </span>
                </div>
                <ChevronDown
                  className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                  style={{ color: "rgba(255,255,255,0.3)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {open && (
                <div
                  className="px-6 pb-5 text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.55)", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <p className="pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <HelpCircle className="w-10 h-10" style={{ color: "rgba(255,255,255,0.1)" }} />
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
    1:1 INQUIRY PANEL
══════════════════════════════════════════════════════════════════════════ */
function InquiryPanel({ categories, info }) {
  const [category, setCategory] = useState("");
  const [title, setTitle]       = useState("");
  const [body, setBody]         = useState("");
  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = category && title.trim() && body.trim() && email.trim();

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#4a90e2,#6c63ff)", boxShadow: "0 0 50px rgba(74,144,226,0.35)" }}
        >
          <CheckCircle className="w-9 h-9 text-white" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white mb-2">문의가 접수되었습니다</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            영업일 기준 1~2일 내에 <span style={{ color: "#4a90e2" }}>{email}</span> 으로 답변드립니다.
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm mt-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
        >
          <Clock className="w-4 h-4" />
          평균 응답 시간: {info.responseTimeHint}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8" style={{ gridTemplateColumns: "1fr 280px" }}>
      {/* Form */}
      <div className="flex flex-col gap-5">
        {/* Category */}
        <div>
          <Label>문의 유형</Label>
          <div className="flex gap-2 flex-wrap mt-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                style={
                  category === c
                    ? { background: "rgba(74,144,226,0.15)", color: "#4a90e2", border: "1px solid rgba(74,144,226,0.35)" }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <Field label="답변받을 이메일">
          <FieldInput value={email} onChange={setEmail} placeholder="example@email.com" type="email" />
        </Field>

        {/* Title */}
        <Field label="제목">
          <FieldInput value={title} onChange={setTitle} placeholder="문의 제목을 입력하세요" maxLength={80} />
        </Field>

        {/* Body */}
        <Field label="문의 내용">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="문의 내용을 자세히 작성해주세요. 주문번호, 세션 날짜 등 관련 정보를 함께 적어주시면 더 빠른 답변이 가능합니다."
            className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-white/20"
            style={{
              color: "rgba(255,255,255,0.8)",
              minHeight: 160,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "14px 16px",
            }}
          />
          <p className="text-xs mt-1.5 text-right" style={{ color: "rgba(255,255,255,0.2)" }}>
            {body.length}자
          </p>
        </Field>

        {/* Attach hint */}
        <button
          className="flex items-center gap-2 text-sm transition hover:opacity-80 self-start"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          <Paperclip className="w-4 h-4" />
          파일 첨부 (선택, 최대 10MB)
        </button>

        {/* Submit */}
        <button
          onClick={() => canSubmit && setSubmitted(true)}
          disabled={!canSubmit}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={{
            background: canSubmit ? "linear-gradient(135deg,#4a90e2,#6c63ff)" : "rgba(255,255,255,0.06)",
            color: canSubmit ? "#fff" : "rgba(255,255,255,0.2)",
            boxShadow: canSubmit ? "0 6px 20px rgba(74,144,226,0.3)" : "none",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          <Send className="w-4 h-4" />
          문의 제출하기
        </button>
      </div>

      {/* Side info */}
      <div className="flex flex-col gap-4">
        {[
          { icon: <Clock className="w-4 h-4" />, title: "평균 응답 시간", desc: info.responseTimeDetail, color: "#4a90e2" },
          { icon: <Mail className="w-4 h-4" />, title: "이메일 지원", desc: info.email, color: "#a78bfa" },
          { icon: <Phone className="w-4 h-4" />, title: "전화 상담", desc: info.operatingHours, color: "#34d399" },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${item.color}18`, color: item.color }}
            >
              {item.icon}
            </span>
            <div>
              <p className="text-xs font-semibold text-white">{item.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
            </div>
          </div>
        ))}

        <div
          className="p-4 rounded-2xl text-xs leading-relaxed"
          style={{ background: "rgba(74,144,226,0.06)", border: "1px solid rgba(74,144,226,0.15)", color: "rgba(255,255,255,0.4)" }}
        >
          💡 자주 묻는 질문에서 답변을 먼저 찾아보시면 더 빠르게 해결될 수 있어요.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
    CHATBOT PANEL
══════════════════════════════════════════════════════════════════════════ */
function ChatbotPanel({ responses, quickReplies }) {
  const [messages, setMessages] = useState([
    { id: 0, role: "bot", text: responses.default, time: now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
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
      className="flex flex-col rounded-3xl overflow-hidden"
      style={{ height: 560, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#4a90e2,#6c63ff)" }}
        >
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">커피챗 AI 도우미</p>
          <p className="text-xs flex items-center gap-1.5" style={{ color: "#34d399" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            온라인
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "bot" ? (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-end"
                style={{ background: "linear-gradient(135deg,#4a90e2,#6c63ff)" }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-end"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div
                className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={
                  msg.role === "bot"
                    ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", borderBottomLeftRadius: 6 }
                    : { background: "linear-gradient(135deg,#4a90e2,#6c63ff)", color: "#fff", borderBottomRightRadius: 6 }
                }
              >
                {msg.text}
              </div>
              <span className="text-xs px-1" style={{ color: "rgba(255,255,255,0.2)" }}>{msg.time}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#4a90e2,#6c63ff)" }}
            >
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.06)", borderBottomLeftRadius: 6 }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div
        className="flex gap-2 px-6 py-3 overflow-x-auto flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)", scrollbarWidth: "none" }}
      >
        {quickReplies.map((qr) => (
          <button
            key={qr}
            onClick={() => sendMessage(qr)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition hover:opacity-80"
            style={{ background: "rgba(74,144,226,0.12)", color: "#4a90e2", border: "1px solid rgba(74,144,226,0.25)" }}
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="메시지를 입력하세요…"
          className="flex-1 bg-transparent outline-none text-sm placeholder-white/25"
          style={{ color: "#e8eaf0" }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150"
          style={{
            background: input.trim() ? "linear-gradient(135deg,#4a90e2,#6c63ff)" : "rgba(255,255,255,0.06)",
            color: input.trim() ? "#fff" : "rgba(255,255,255,0.2)",
            boxShadow: input.trim() ? "0 4px 12px rgba(74,144,226,0.35)" : "none",
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function Label({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.35)" }}>
      {children}
    </p>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
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
      className="w-full outline-none text-sm placeholder-white/20"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: "12px 16px",
        color: "#e8eaf0",
      }}
    />
  );
}

/* ─── 2. 기본 데이터셋 정의 (MOCK DATA / DEFAULT PROPS) ──────────────────── */
const DEFAULT_FAQ_CATEGORIES = ["전체", "예약/결제", "멘토링", "계정", "환불"];

const DEFAULT_FAQS = [
  { id: "1", category: "예약/결제", q: "커피챗 세션을 예약하려면 어떻게 하나요?", a: "멘토 탐색 페이지에서 원하는 멘토를 선택한 후, 프로필 하단의 '커피챗 예약' 버튼을 클릭하세요. 날짜 선택 → 질문 작성 → 결제 순서로 진행됩니다. 결제가 완료되면 예약 확인 이메일이 발송됩니다." },
  { id: "2", category: "예약/결제", q: "결제 수단은 어떤 것이 지원되나요?", a: "신용카드(VISA, Mastercard, 국내 카드사 전체), 카카오페이, 네이버페이, 토스페이를 지원합니다. 기업 계좌이체는 별도 문의를 통해 진행하실 수 있습니다." },
  { id: "3", category: "환불", q: "예약 취소 및 환불 정책이 어떻게 되나요?", a: "세션 시작 48시간 전까지 취소 시 100% 환불됩니다. 24~48시간 전 취소 시 50% 환불, 24시간 이내 취소는 환불이 불가합니다. 멘토 사정으로 인한 취소는 항상 100% 환불됩니다." },
  { id: "4", category: "멘토링", q: "커피챗 세션은 얼마나 진행되나요?", a: "기본 세션은 30분이며, 멘토에 따라 60분 옵션도 제공됩니다. 세션 시작 5분 전에 입장 링크가 발송되며, 예약 시간 이후에는 자동으로 세션이 시작됩니다." },
  { id: "5", category: "멘토링", q: "멘토가 세션에 나타나지 않으면 어떻게 하나요?", a: "세션 시작 후 10분이 지나도 멘토가 입장하지 않을 경우, 고객센터 채팅으로 즉시 알려주세요. 전액 환불 또는 다른 멘토와의 세션을 우선 배정해드립니다." },
  { id: "6", category: "계정", q: "멘토로 등록하려면 어떤 조건이 필요한가요?", a: "해당 분야 3년 이상의 경력 또는 현직 종사자이면 신청 가능합니다. 프로필 검토 후 영업일 기준 3~5일 내에 승인 여부를 이메일로 안내드립니다." },
  { id: "7", category: "계정", q: "비밀번호를 잊어버렸어요. 어떻게 재설정하나요?", a: "로그인 화면에서 '비밀번호 찾기'를 클릭하고 가입 이메일을 입력하세요. 재설정 링크가 이메일로 발송됩니다. 이메일이 오지 않는다면 스팸 폴더도 확인해 주세요." },
  { id: "8", category: "예약/결제", q: "세션 일정을 변경할 수 있나요?", a: "세션 시작 48시간 전까지 '커피챗 관리' 페이지에서 일정 변경을 요청할 수 있습니다. 변경은 멘토의 수락이 필요하며, 수락 후 새 일정으로 확정됩니다." },
];

const DEFAULT_INQUIRY_CATEGORIES = ["예약/결제", "환불", "멘토링 문제", "계정", "기타"];

const DEFAULT_BOT_RESPONSES = {
  default: "안녕하세요! 커피챗 고객센터 AI입니다 😊 예약, 결제, 환불, 멘토링에 관한 질문이 있으시면 편하게 물어보세요.",
  예약: "예약은 멘토 탐색 페이지에서 원하는 멘토를 선택한 뒤 '커피챗 예약' 버튼을 클릭하면 됩니다. 날짜 → 질문 작성 → 결제 순서로 진행돼요.",
  결제: "신용카드, 카카오페이, 네이버페이, 토스페이를 지원합니다. 결제 문제가 발생하면 사용하신 카드사나 간편결제사에 먼저 문의해 보세요.",
  환불: "세션 48시간 전 취소 시 100% 환불, 24~48시간 전은 50% 환불, 24시간 이내는 환불이 어렵습니다. 멘토 귀책 사유일 경우 항상 100% 환불됩니다.",
  취소: "'커피챗 관리' 페이지에서 해당 세션을 선택하고 '예약 취소'를 누르시면 됩니다. 취소 정책에 따라 환불 금액이 결정됩니다.",
  멘토: "멘토 등록은 해당 분야 3년 이상 경력자이면 신청 가능합니다. 멘토 등록 페이지에서 신청서를 제출하면 3~5 영업일 내 검토 후 안내드립니다.",
  비밀번호: "로그인 화면 하단의 '비밀번호 찾기'를 클릭하고 가입 이메일을 입력하면 재설정 링크를 받으실 수 있습니다.",
};

const DEFAULT_QUICK_REPLIES = ["예약 방법", "환불 정책", "결제 수단", "멘토 등록", "비밀번호 재설정"];

const DEFAULT_CS_INFO = {
  operatingHours: "평일 09:00 – 18:00",
  email: "support@coffeechat.kr",
  responseTimeHint: "4시간 이내 (영업일)",
  responseTimeDetail: "영업일 기준 4시간 이내",
};