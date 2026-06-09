import { useEffect, useRef, useState, useCallback } from 'react';
 
const BACKEND_WS = import.meta.env.VITE_BACKEND_WS || 'ws://48.211.169.52:8000';
 
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
 
export function useCoffeeChatWebRTC({ chatId, userId, userName, questions }) {
  // ── refs ─────────────────────────────────────────────
  const localVideoRef     = useRef(null);
  const remoteVideoRef    = useRef(null);
  const pcRef             = useRef(null);
  const sigWsRef          = useRef(null);
  const sttWsRef          = useRef(null);
  const llmWsRef          = useRef(null);
  const localStreamRef    = useRef(null);
  const mediaRecRef       = useRef(null);
  const audioContextRef   = useRef(null);
  const audioSourceRef    = useRef(null);
  const audioProcessorRef = useRef(null);
 
  // ── state ────────────────────────────────────────────
  const [sttLogs, setSttLogs]          = useState([]);
  const [llmStreaming, setLlmStreaming] = useState(false);
  const [llmBuffer, setLlmBuffer]      = useState('');
 
  // ── 1. 로컬 미디어 획득 + WebRTC 초기화 ──────────────
  useEffect(() => {
    if (!chatId || !userId) return;
 
    let cancelled = false;
 
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
 
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }
 
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
 
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
 
      pc.ontrack = (evt) => {
        if (remoteVideoRef.current && evt.streams[0]) {
          remoteVideoRef.current.srcObject = evt.streams[0];
        }
      };
 
      pc.onicecandidate = (evt) => {
        if (evt.candidate && sigWsRef.current?.readyState === WebSocket.OPEN) {
          sigWsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: evt.candidate,
          }));
        }
      };
 
      // ── 시그널링 WebSocket ──────────────────────────
      const sigWs = new WebSocket(`${BACKEND_WS}/ws/webrtc/${chatId}/${userId}`);
      sigWsRef.current = sigWs;
 
      sigWs.onmessage = async (e) => {
        const msg = JSON.parse(e.data);
 
        switch (msg.type) {
          case 'peer_joined':
            if (msg.peer_count === 2) {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              sigWs.send(JSON.stringify({ type: 'offer', sdp: offer }));
            }
            break;
 
          case 'offer':
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sigWs.send(JSON.stringify({ type: 'answer', sdp: answer }));
            break;
 
          case 'answer':
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            break;
 
          case 'ice-candidate':
            if (msg.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            }
            break;
 
          case 'peer_left':
          case 'hang-up':
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            break;
 
          default:
            break;
        }
      };
 
      _connectSTT(stream);
      _connectLLM();
    })();
 
    return () => {
      cancelled = true;
      _cleanup();
    };
  }, [chatId, userId]);
 
  // ── 2. STT WebSocket + AudioWorklet ──────────────────
  function _connectSTT(stream) {
    const safeUserName = encodeURIComponent(userName || '사용자');
    const sttWsUrl = `${BACKEND_WS}/ws/stt/${chatId}/${userId}/${safeUserName}`;
 
    console.log('[STT] 웹소켓 연결 시도:', sttWsUrl);
 
    const sttWs = new WebSocket(sttWsUrl);
    sttWs.binaryType = 'arraybuffer';
    sttWsRef.current = sttWs;
 
    sttWs.onopen = async () => {
      try {
        const audioStream = new MediaStream(stream.getAudioTracks());
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(audioStream);
 
        audioContextRef.current = audioContext;
        audioSourceRef.current = source;
 
        const workletCode = `
          class PCMProcessor extends AudioWorkletProcessor {
            constructor() {
              super();
              this._buffer = [];
              this._bufferSize = 4096;
            }
            process(inputs) {
              const input = inputs[0][0];
              if (!input) return true;
              for (let i = 0; i < input.length; i++) this._buffer.push(input[i]);
              while (this._buffer.length >= this._bufferSize) {
                const chunk = this._buffer.splice(0, this._bufferSize);
                this.port.postMessage(new Float32Array(chunk));
              }
              return true;
            }
          }
          registerProcessor('pcm-processor', PCMProcessor);
        `;
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        await audioContext.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
 
        const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
        audioProcessorRef.current = workletNode;
 
        workletNode.port.onmessage = (e) => {
          if (sttWs.readyState !== WebSocket.OPEN) return;
          const float32 = e.data;
          const pcm16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            const amplified = float32[i] * 1.5;
            const s = Math.max(-1, Math.min(1, amplified));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          sttWs.send(pcm16.buffer);
        };
 
        source.connect(workletNode);
        workletNode.connect(audioContext.destination);
      } catch (err) {
        console.error('[STT] 오디오 처리 시작 실패:', err);
      }
    };
 
    sttWs.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('[STT] 서버 응답:', data);
 
        if (data.type === 'notice') {
          console.warn('[STT] 서버 알림:', data.text);
          return;
        }
 
        if (!data.text) return;
 
        const nextLog = {
          speaker: data.speaker || data.speaker_name || userName || '사용자',
          text: data.text,
          type: data.type,
        };
 
        if (data.type === 'interim') {
          setSttLogs((prev) => [
            ...prev.filter((log) => log.type !== 'interim' || log.speaker !== nextLog.speaker),
            nextLog,
          ]);
          return;
        }
 
        if (data.type === 'final') {
          setSttLogs((prev) => [
            ...prev.filter((log) => log.type !== 'interim' || log.speaker !== nextLog.speaker),
            nextLog,
          ]);
        }
      } catch (err) {
        console.warn('[STT] 데이터 파싱 오류:', err);
      }
    };
 
    sttWs.onerror = (err) => console.error('[STT] 웹소켓 오류:', err);
    sttWs.onclose = (event) => console.log('[STT] 웹소켓 연결 종료:', event.code, event.reason);
  }
 
  // ── 3. LLM WebSocket ──────────────────────────────────
  function _connectLLM() {
    const llmWs = new WebSocket(`${BACKEND_WS}/ws/llm/${chatId}/${userId}`);
    llmWsRef.current = llmWs;
 
    llmWs.onmessage = (e) => {
      const data = JSON.parse(e.data);
 
      if (data.type === 'chunk') {
        setLlmBuffer(prev => prev + data.text);
        setLlmStreaming(true);
      } else if (data.type === 'done') {
        setLlmStreaming(false);
        setLlmBuffer('');
      } else if (data.type === 'error') {
        setLlmStreaming(false);
        console.error('[LLM]', data.text);
      }
    };
  }
 
  // ── 4. LLM 질문 전송 ─────────────────────────────────
  const sendLLMQuestion = useCallback((text) => {
    if (!llmWsRef.current || llmWsRef.current.readyState !== WebSocket.OPEN) return;
    llmWsRef.current.send(JSON.stringify({
      type: 'question',
      text,
      questions: questions || '',
    }));
  }, [questions]);
 
  // ── 5. 통화 종료 ──────────────────────────────────────
  const hangUp = useCallback(async () => {
    if (sigWsRef.current?.readyState === WebSocket.OPEN) {
      sigWsRef.current.send(JSON.stringify({ type: 'hang-up' }));
    }
    if (sttWsRef.current?.readyState === WebSocket.OPEN) {
      sttWsRef.current.send(JSON.stringify({ type: 'end_session' }));
      await new Promise(r => setTimeout(r, 1000));
    }
    _cleanup();
  }, []);
 
  function _cleanup() {
    try {
      audioProcessorRef.current?.port?.close();
      audioProcessorRef.current?.disconnect();
      audioSourceRef.current?.disconnect();
      audioContextRef.current?.close();
    } catch (e) {
      console.warn('[STT] 오디오 정리 실패:', e);
    }
 
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    sigWsRef.current?.close();
    sttWsRef.current?.close();
    llmWsRef.current?.close();
  }
 
  return {
    localVideoRef,
    remoteVideoRef,
    sttLogs,
    llmStreaming,
    llmBuffer,
    sendLLMQuestion,
    hangUp,
  };
}