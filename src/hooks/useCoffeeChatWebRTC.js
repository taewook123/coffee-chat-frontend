// hooks/useCoffeeChatWebRTC.js
/**
 * CoffeeChatRoom.jsx 에서 쓰는 통합 훅
 *
 * 담당:
 *  1. WebRTC P2P 통화 (시그널링 서버 경유)
 *  2. Azure STT (오디오 → 텍스트 실시간)
 *  3. LLM 어시스턴트 WebSocket
 *
 * 사용법:
 *   const {
 *     localVideoRef, remoteVideoRef,   // <video> 태그에 ref로 연결
 *     sttLogs,                          // 실시간 STT 결과 배열
 *     sendLLMQuestion,                  // LLM 질문 전송 함수
 *     llmStreaming,                     // 현재 LLM 스트리밍 중 여부
 *     hangUp,                           // 통화 종료
 *   } = useCoffeeChatWebRTC({ chatId, userId, userName, questions });
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

  // ── 2. STT WebSocket + MediaRecorder ─────────────────
  function _connectSTT(stream) {
    const sttWs = new WebSocket(
      `${BACKEND_WS}/ws/stt/${chatId}/${userId}/${encodeURIComponent(userName || '나')}`
    );
    sttWsRef.current = sttWs;

    sttWs.onopen = () => {
      // MediaRecorder로 오디오 청크를 STT 서버에 전송
      const audioStream = new MediaStream(stream.getAudioTracks());
      const recorder = new MediaRecorder(audioStream, {
          mimeType: 'audio/webm;codecs=opus' // 브라우저 지원에 따라 다름
      });
      mediaRecRef.current = recorder;

      recorder.ondataavailable = (evt) => {
        if (evt.data.size > 0 && sttWs.readyState === WebSocket.OPEN) {
          sttWs.send(evt.data);
        }
      };
      // 250ms 단위로 청크 전송 (실시간성)
      recorder.start(250);
    };

    sttWs.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'final') {
        setSttLogs(prev => [...prev, { speaker: data.speaker, text: data.text }]);
      }
      // interim(중간) 결과는 필요 시 별도 state로 처리 가능
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
        // onLLMResponse 콜백으로 올려줄 수도 있음
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
    mediaRecRef.current?.stop();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
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