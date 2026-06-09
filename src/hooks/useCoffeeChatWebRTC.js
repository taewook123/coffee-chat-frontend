/**
 * CoffeeChatRoom.jsx 에서 쓰는 통합 훅
 *
 * 담당:
 * 1. WebRTC P2P 통화 (시그널링 서버 경유)
 * 2. Azure STT (오디오 → 텍스트 실시간)
 * 3. LLM 어시스턴트 WebSocket
 *
 * 사용법:
 * const {
 * localVideoRef, remoteVideoRef,   // <video> 태그에 ref로 연결
 * sttLogs,                          // 실시간 STT 결과 배열
 * sendLLMQuestion,                  // LLM 질문 전송 함수
 * llmStreaming,                     // 현재 LLM 스트리밍 중 여부
 * hangUp,                           // 통화 종료
 * } = useCoffeeChatWebRTC({ chatId, userId, userName, questions });
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const BACKEND_WS = import.meta.env.VITE_BACKEND_WS || 'ws://48.211.169.52:8000';

// 구글 무료 STUN 서버 (전 세계 어디서든 NAT 뚫기용)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useCoffeeChatWebRTC({ chatId, userId, userName, questions }) {
  // ── refs ─────────────────────────────────────────────
  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef          = useRef(null);   // RTCPeerConnection
  const sigWsRef       = useRef(null);   // 시그널링 WebSocket
  const sttWsRef       = useRef(null);   // STT WebSocket
  const llmWsRef       = useRef(null);   // LLM WebSocket
  const localStreamRef = useRef(null);   // 내 카메라/마이크 스트림
  const mediaRecRef    = useRef(null);   // MediaRecorder (STT용)
  const audioContextRef   = useRef(null);
  const audioSourceRef    = useRef(null);
  const audioProcessorRef = useRef(null);
  // ── state ────────────────────────────────────────────
  const [sttLogs, setSttLogs]           = useState([]);
  const [llmStreaming, setLlmStreaming]  = useState(false);
  const [llmBuffer, setLlmBuffer]       = useState('');  // 스트리밍 중 누적 텍스트

  // ── 1. 로컬 미디어 획득 + WebRTC 초기화 ──────────────
  useEffect(() => {
    if (!chatId || !userId) return;

    let cancelled = false;

    (async () => {
      // 카메라 + 마이크
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: {
  echoCancellation: true,   // 상대 음성이 내 마이크에 섞이는 것 방지
  noiseSuppression: true,   // 배경 잡음 제거
  autoGainControl: true,    // 자동 게인
  sampleRate: 16000,
  channelCount: 1,          // 모노 강제 (STT 정확도 향상)
}});
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // 내 소리 피드백 방지
      }

      // RTCPeerConnection 생성
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // 내 트랙 추가
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // 상대방 트랙 수신
      pc.ontrack = (evt) => {
        if (remoteVideoRef.current && evt.streams[0]) {
          remoteVideoRef.current.srcObject = evt.streams[0];
        }
      };

      // ICE 후보 → 시그널링 서버로 전송
      pc.onicecandidate = (evt) => {
        if (evt.candidate && sigWsRef.current?.readyState === WebSocket.OPEN) {
          sigWsRef.current.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: evt.candidate,
          }));
        }
      };

      // ── 시그널링 WebSocket 연결 ──────────────────────
      const sigWs = new WebSocket(`${BACKEND_WS}/ws/webrtc/${chatId}/${userId}`);
      sigWsRef.current = sigWs;

      sigWs.onmessage = async (e) => {
        const msg = JSON.parse(e.data);

        switch (msg.type) {
          case 'peer_joined':
            // 내가 두 번째로 입장했거나, 상대가 들어왔으면 offer 생성
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
            // 상대방이 나갔을 때 UI 처리는 컴포넌트에서
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            break;

          default:
            break;
        }
      };

      // ── STT WebSocket 연결 ───────────────────────────
      _connectSTT(stream);

      // ── LLM WebSocket 연결 ───────────────────────────
      _connectLLM();
    })();

    return () => {
      cancelled = true;
      _cleanup();
    };
  }, [chatId, userId]);

  // ── 2. STT WebSocket + MediaRecorder (🚨 수정된 부분) ──
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

    // ✅ AudioWorklet으로 교체 (ScriptProcessor 대신)
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

    // ✅ VAD: 무음 구간은 전송 안 함 (오인식 방지)
    let silenceCount = 0;
    workletNode.port.onmessage = (e) => {
      if (sttWs.readyState !== WebSocket.OPEN) return;
      const float32 = e.data;

      // PCM16 변환 및 볼륨 증폭
      const pcm16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        // 💡 튜닝: 볼륨(Gain) 1.5배 증폭은 그대로 유지 (작게 말하는 소리 캐치)
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
          // 💡 핵심 수정: 화면의 모든 interim을 지우지 않고, '방금 데이터를 보낸 사람'의 interim만 지우고 교체합니다.
          ...prev.filter((log) => log.type !== 'interim' || log.speaker !== nextLog.speaker),
          nextLog,
        ]);
        return;
      }

      if (data.type === 'final') {
        setSttLogs((prev) => [
          // 💡 핵심 수정: 방금 문장을 끝낸 사람의 interim만 제거하고 final을 추가합니다.
          ...prev.filter((log) => log.type !== 'interim' || log.speaker !== nextLog.speaker),
          nextLog,
        ]);
      }
    } catch (err) {
      console.warn('[STT] 데이터 파싱 오류:', err);
    }
  };

  sttWs.onerror = (err) => {
    console.error('[STT] 웹소켓 오류:', err);
  };

  sttWs.onclose = (event) => {
    console.log('[STT] 웹소켓 연결 종료:', event.code, event.reason);
  };
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
        // 완성된 응답은 컴포넌트에서 llmMessages에 추가
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
    // 시그널링 서버에 hang-up 알림
    if (sigWsRef.current?.readyState === WebSocket.OPEN) {
      sigWsRef.current.send(JSON.stringify({ type: 'hang-up' }));
    }
    // STT 서버에 세션 종료 + DB 저장 요청
    if (sttWsRef.current?.readyState === WebSocket.OPEN) {
      sttWsRef.current.send(JSON.stringify({ type: 'end_session' }));
      // 저장 완료 대기 (1초)
      await new Promise(r => setTimeout(r, 1000));
    }
    _cleanup();
  }, []);

  function _cleanup() {
  try {
    audioProcessorRef.current?.port?.close(); // ✅ worklet port 닫기
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
    llmBuffer,       // 스트리밍 중 실시간 텍스트
    sendLLMQuestion,
    hangUp,
  };
}