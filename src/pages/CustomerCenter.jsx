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
  Clock,
  Sparkles,
  Phone,
  Mail,
} from "lucide-react";

const DEFAULT_BOT_RESPONSES = {
  default: "안녕하세요! 커피챗 AI 도우미입니다. 무엇을 도와드릴까요?",
  "결제": "결제는 신용카드, 카카오페이, 네이버페이를 지원합니다. 환불 정책은 마이페이지의 이용 약관을 참고해 주세요.",
  "멘토": "멘토 신청은 상단 메뉴의 '멘토 지원하기'를 통해 상시 접수받고 있습니다.",
  "시간": "커피챗 세션 시간 변경은 매칭 완료 후 영업일 기준 최소 24시간 전까지 가능합니다."
};
const DEFAULT_QUICK_REPLIES = ["결제 방법은 어떻게 되나요?", "멘토 지원 조건이 궁금해요", "시간 변경하고 싶어요"];

function getBotReply(input, responses) {
  for (const [key, val] of Object.entries(responses)) {
    if (key !== "default" && input.includes(key)) return val;
  }
  return "해당 내용은 담당자에게 연결이 필요할 수 있습니다. 1:1 문의를 이용하시면 더 정확한 답변을 받으실 수 있어요.";
}

function nowTime() {
  return new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

const BACKEND_URL = "http://48.211.169.52:8000";

export default function SupportPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("faq");

  const [faqs, setFaqs] = useState([]);
  const [faqCategories, setFaqCategories] = useState(["전체"]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState(null);

  const [inquiryCategories] = useState(["서비스 이용", "결제/환불", "계정/인증", "기타"]);
  const [csInfo] = useState({
    operatingHours: "평일 10:00 ~ 18:00 (주말/공휴일 제외)",
    responseTimeDetail: "영업일 기준 평균 1~2시간 이내 답변",
    email: "support@coffeechat.com"
  });
  const [botResponses] = useState(DEFAULT_BOT_RESPONSES);
  const [quickReplies] = useState(DEFAULT_QUICK_REPLIES);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/support/faqs/categories`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        const cats = Array.isArray(data) ? data : [];
        setFaqCategories(cats.includes("전체") ? cats : ["전체", ...cats]);
      })
      .catch(() => setFaqError("카테고리를 불러오지 못했습니다."));

    fetch(`${BACKEND_URL}/api/support/faqs`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        setFaqs(data.map((f) => ({ id: String(f.id), category: f.category, q: f.question, a: f.answer })));
        setFaqLoading(false);
      })
      .catch(() => {
        setFaqError("FAQ를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
        setFaqLoading(false);
      });
  }, []);

  const TABS = [
    { key: "faq",     label: "자주 묻는 질문", icon: <HelpCircle    className="w-5 h-5" /> },
    { key: "inquiry", label: "1:1 문의",       icon: <MessageCircle className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0e17", color: "#e8eaf0", fontFamily: "'Inter', sans-serif" }}>
      <header className="flex items-center justify-between px-10 py-5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm transition hover:text-white" style={{ color: "rgba(255,255,255,0.4)" }}>
          <ArrowLeft className="w-4 h-4" /> 돌아가기
        </button>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{csInfo.operatingHours}</span>
        </div>
      </header>

      <div className="px-10 pt-10 pb-8 max-w-5xl mx-auto w-full">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: "#4a90e2" }}>Customer Support</p>
        <h1 className="leading-none tracking-tight mb-3" style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>고객센터</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>궁금한 점이 있으신가요? 빠르게 도와드릴게요.</p>
      </div>

      <div className="px-10 pb-8 max-w-5xl mx-auto w-full">
        <div className="inline-flex gap-2 p-1.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={active
                  ? { background: "rgba(74,144,226,0.18)", color: "#fff", border: "1px solid rgba(74,144,226,0.3)" }
                  : { color: "rgba(255,255,255,0.35)", border: "1px solid transparent" }}>
                <span style={{ color: active ? "#4a90e2" : "rgba(255,255,255,0.3)" }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 px-10 pb-12 max-w-5xl mx-auto w-full">
        {tab === "faq"     && <FaqPanel categories={faqCategories} faqs={faqs} loading={faqLoading} error={faqError} />}
        {tab === "inquiry" && <InquiryPanel categories={inquiryCategories} info={csInfo} />}
        {tab === "chatbot" && <ChatbotPanel responses={botResponses} quickReplies={quickReplies} />}
      </div>
    </div>
  );
}

/* ── FAQ PANEL ── */
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
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="궁금한 내용을 검색하세요…"
          className="flex-1 bg-transparent outline-none text-sm placeholder-white/25" style={{ color: "#e8eaf0" }} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => {
          const active = activeCat === cat;
          return (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={active
                ? { background: "rgba(74,144,226,0.15)", color: "#4a90e2", border: "1px solid rgba(74,144,226,0.35)" }
                : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {cat}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(74,144,226,0.3)", borderTopColor: "#4a90e2" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>FAQ를 불러오는 중…</p>
        </div>
      )}
      {!loading && error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          ⚠ {error}
        </div>
      )}
      {!loading && !error && (
        <div className="flex flex-col gap-2">
          {filtered.map((faq) => {
            const open = openId === faq.id;
            return (
              <div key={faq.id} className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: open ? "rgba(74,144,226,0.06)" : "rgba(255,255,255,0.03)", border: open ? "1px solid rgba(74,144,226,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => setOpenId(open ? null : faq.id)} className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(74,144,226,0.12)", color: "#4a90e2" }}>{faq.category}</span>
                    <span className="text-sm font-semibold truncate" style={{ color: open ? "#fff" : "rgba(255,255,255,0.8)" }}>{faq.q}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200" style={{ color: "rgba(255,255,255,0.3)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {open && (
                  <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
      )}
    </div>
  );
}

/* ── 1:1 INQUIRY PANEL ── */
function InquiryPanel({ categories, info }) {
  const [category, setCategory]       = useState("");
  const [title, setTitle]             = useState("");
  const [body, setBody]               = useState("");
  const [email, setEmail]             = useState("");
  const [userId, setUserId]           = useState(null);   // ✅ user_id 상태
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ✅ 로그인 정보에서 user_id + email 자동완성
  useEffect(() => {
    const rawId = localStorage.getItem("userId")
               || localStorage.getItem("id")
               || localStorage.getItem("user_id");
    const cleanId = rawId ? parseInt(rawId.toString().replace(/[^0-9]/g, ""), 10) : null;

    if (cleanId && !isNaN(cleanId)) {
      setUserId(cleanId);
      fetch(`${BACKEND_URL}/api/user/${cleanId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => { if (data?.email) setEmail(data.email); })
        .catch(() => {});
    }
  }, []);

  const canSubmit = category && title.trim() && body.trim() && email.trim();

  // ✅ FastAPI 422 에러 파싱
  function parseErrorDetail(err) {
    if (!err) return "서버 오류가 발생했습니다.";
    if (Array.isArray(err.detail)) return err.detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
    if (typeof err.detail === "string") return err.detail;
    return "서버 오류가 발생했습니다.";
  }

  // ✅ 이메일 검증 완화 — @만 있으면 허용 (123456@kakao.com 같은 형태 포함)
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+$/.test(val.trim());
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    if (!isValidEmail(email)) {
      setSubmitError("이메일 형식이 올바르지 않습니다. (예: example@email.com)");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          body,
          email: email.trim(),
          user_id: userId,  // ✅ localStorage user_id 전송
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(parseErrorDetail(errJson));
      }
      alert("🚀 문의가 성공적으로 접수되었습니다!");
      setCategory(""); setTitle(""); setBody("");
    } catch (e) {
      setSubmitError(e.message || "문의 접수 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8" style={{ gridTemplateColumns: "1fr 280px" }}>
      <div className="flex flex-col gap-5">
        <div>
          <Label>문의 유형</Label>
          <div className="flex gap-2 flex-wrap mt-2">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                style={category === c
                  ? { background: "rgba(74,144,226,0.15)", color: "#4a90e2", border: "1px solid rgba(74,144,226,0.35)" }
                  : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <Field label="답변받을 이메일">
          <FieldInput value={email} onChange={setEmail} placeholder="example@email.com" type="text" />
        </Field>

        <Field label="제목">
          <FieldInput value={title} onChange={setTitle} placeholder="문의 제목을 입력하세요" maxLength={80} />
        </Field>

        <Field label="문의 내용">
          <textarea value={body} onChange={(e) => setBody(e.target.value)}
            placeholder="문의 내용을 자세히 작성해주세요."
            className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-white/20"
            style={{ color: "rgba(255,255,255,0.8)", minHeight: 160, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px" }} />
          <p className="text-xs mt-1.5 text-right" style={{ color: "rgba(255,255,255,0.2)" }}>{body.length}자</p>
        </Field>

        <button className="flex items-center gap-2 text-sm transition hover:opacity-80 self-start" style={{ color: "rgba(255,255,255,0.3)" }}>
          <Paperclip className="w-4 h-4" /> 파일 첨부 (선택, 최대 10MB)
        </button>

        {submitError && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
            ⚠ {String(submitError)}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!canSubmit || submitting}
          className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={{
            background: canSubmit && !submitting ? "linear-gradient(135deg,#4a90e2,#6c63ff)" : "rgba(255,255,255,0.06)",
            color:      canSubmit && !submitting ? "#fff" : "rgba(255,255,255,0.2)",
            boxShadow:  canSubmit && !submitting ? "0 6px 20px rgba(74,144,226,0.3)" : "none",
            cursor:     canSubmit && !submitting ? "pointer" : "not-allowed",
          }}>
          {submitting
            ? <><div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "transparent" }} /> 전송 중…</>
            : <><Send className="w-4 h-4" /> 문의 제출하기</>}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {[
          { icon: <Clock className="w-4 h-4" />, title: "평균 응답 시간", desc: info.responseTimeDetail, color: "#4a90e2" },
          { icon: <Mail  className="w-4 h-4" />, title: "이메일 지원",   desc: info.email,              color: "#a78bfa" },
          { icon: <Phone className="w-4 h-4" />, title: "전화 상담",     desc: info.operatingHours,     color: "#34d399" },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18`, color: item.color }}>{item.icon}</span>
            <div>
              <p className="text-xs font-semibold text-white">{item.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{item.desc}</p>
            </div>
          </div>
        ))}
        <div className="p-4 rounded-2xl text-xs leading-relaxed" style={{ background: "rgba(74,144,226,0.06)", border: "1px solid rgba(74,144,226,0.15)", color: "rgba(255,255,255,0.4)" }}>
          💡 자주 묻는 질문에서 답변을 먼저 찾아보시면 더 빠르게 해결될 수 있어요.
        </div>
      </div>
    </div>
  );
}

/* ── CHATBOT PANEL ── */
function ChatbotPanel({ responses, quickReplies }) {
  const defaultMsg = responses?.default ?? "안녕하세요! 잠시만 기다려 주세요.";
  const [messages, setMessages] = useState([{ id: 0, role: "bot", text: defaultMsg, time: nowTime() }]);
  const [input, setInput]   = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef           = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const sendMessage = (text) => {
    if (!text.trim() || !responses) return;
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: text.trim(), time: nowTime() }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(text, responses);
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "bot", text: reply, time: nowTime() }]);
      setTyping(false);
    }, 900 + Math.random() * 600);
  };

  return (
    <div className="flex flex-col rounded-3xl overflow-hidden" style={{ height: 560, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4a90e2,#6c63ff)" }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">커피챗 AI 도우미</p>
          <p className="text-xs flex items-center gap-1.5" style={{ color: "#34d399" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 온라인
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4" style={{ scrollbarWidth: "none" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {msg.role === "bot"
              ? <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-end" style={{ background: "linear-gradient(135deg,#4a90e2,#6c63ff)" }}><Bot className="w-4 h-4 text-white" /></div>
              : <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-end" style={{ background: "rgba(255,255,255,0.08)" }}><User className="w-4 h-4 text-white" /></div>}
            <div className={`flex flex-col gap-1 max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                style={msg.role === "bot"
                  ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", borderBottomLeftRadius: 6 }
                  : { background: "linear-gradient(135deg,#4a90e2,#6c63ff)", color: "#fff", borderBottomRightRadius: 6 }}>
                {msg.text}
              </div>
              <span className="text-xs px-1" style={{ color: "rgba(255,255,255,0.2)" }}>{msg.time}</span>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#4a90e2,#6c63ff)" }}><Bot className="w-4 h-4 text-white" /></div>
            <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)", borderBottomLeftRadius: 6 }}>
              {[0,1,2].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 px-6 py-3 overflow-x-auto flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", scrollbarWidth: "none" }}>
        {(quickReplies ?? []).map((qr) => (
          <button key={qr} onClick={() => sendMessage(qr)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition hover:opacity-80"
            style={{ background: "rgba(74,144,226,0.12)", color: "#4a90e2", border: "1px solid rgba(74,144,226,0.25)" }}>
            {qr}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="메시지를 입력하세요…"
          className="flex-1 bg-transparent outline-none text-sm placeholder-white/25" style={{ color: "#e8eaf0" }} />
        <button onClick={() => sendMessage(input)} disabled={!input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150"
          style={{ background: input.trim() ? "linear-gradient(135deg,#4a90e2,#6c63ff)" : "rgba(255,255,255,0.06)", color: input.trim() ? "#fff" : "rgba(255,255,255,0.2)", boxShadow: input.trim() ? "0 4px 12px rgba(74,144,226,0.35)" : "none" }}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: "rgba(255,255,255,0.35)" }}>{children}</p>;
}
function Field({ label, children }) {
  return <div className="flex flex-col gap-2"><Label>{label}</Label>{children}</div>;
}
function FieldInput({ value, onChange, placeholder, type = "text", maxLength }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} maxLength={maxLength}
      className="w-full outline-none text-sm placeholder-white/20"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 16px", color: "#e8eaf0" }} />
  );
}