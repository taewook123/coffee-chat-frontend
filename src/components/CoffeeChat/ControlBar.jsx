import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Settings } from 'lucide-react';

function ControlBtn({ active, onClick, icon, danger = false, label }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm"
        style={{
          background: danger ? 'rgba(239,68,68,0.2)' : active ? 'var(--btn-active)' : 'var(--btn-bg)',
          border: danger ? '1px solid rgba(239,68,68,0.3)' : active ? '1px solid var(--btn-border-active)' : '1px solid var(--btn-border)',
          color: danger ? '#ef4444' : active ? 'var(--text-main)' : 'var(--text-muted)',
        }}
      >
        {icon}
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </button>
  );
}

export default function ControlBar({
  isMuted, handleToggleMute,
  isVideoOff, handleToggleVideo,
  handleEndCall,
  showChat, setShowChat,
  setShowSettings
}) {
  return (
    <div className="flex-shrink-0 flex items-center justify-center">
      <div
        className="flex items-center gap-3 px-6 py-3 rounded-2xl shadow-lg backdrop-blur-xl"
        style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
      >
        <ControlBtn active={!isMuted} onClick={handleToggleMute}
          icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          danger={isMuted} label={isMuted ? '음소거' : '마이크'} />
        <ControlBtn active={!isVideoOff} onClick={handleToggleVideo}
          icon={isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          danger={isVideoOff} label={isVideoOff ? '비디오 꺼짐' : '비디오'} />
        <div className="w-px h-8 mx-1" style={{ background: 'var(--panel-border)' }} />
        <button onClick={handleEndCall} className="flex flex-col items-center gap-1 group">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xl bg-gradient-to-br from-red-500 to-red-700">
            <PhoneOff className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-red-500 font-medium">종료</span>
        </button>
        <div className="w-px h-8 mx-1" style={{ background: 'var(--panel-border)' }} />
        <ControlBtn active={showChat} onClick={() => setShowChat(!showChat)} icon={<MessageSquare className="w-5 h-5" />} label="채팅" />
        <ControlBtn active={true} onClick={() => setShowSettings(true)} icon={<Settings className="w-5 h-5" />} label="설정" />
      </div>
    </div>
  );
}