import { Mic, Video, Volume2, X } from 'lucide-react';

export default function SettingsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-96 rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>장치 설정</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Mic className="w-4 h-4" /> 마이크
            </label>
            <select className="w-full p-2.5 rounded-lg bg-black/10 text-sm focus:outline-none" style={{ color: 'var(--text-main)' }}>
              <option>기본 마이크 (내장 마이크)</option>
              <option>외부 USB 마이크</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Volume2 className="w-4 h-4" /> 스피커
            </label>
            <select className="w-full p-2.5 rounded-lg bg-black/10 text-sm focus:outline-none" style={{ color: 'var(--text-main)' }}>
              <option>기본 스피커</option>
              <option>블루투스 헤드폰</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
              <Video className="w-4 h-4" /> 카메라
            </label>
            <select className="w-full p-2.5 rounded-lg bg-black/10 text-sm focus:outline-none" style={{ color: 'var(--text-main)' }}>
              <option>FaceTime HD Camera</option>
              <option>외부 웹캠</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}