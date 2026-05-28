import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Calendar, Clock, ChevronLeft } from 'lucide-react';

export default function CoffeeChats() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();

  const upcomingChats = [
    {
      id: '1',
      mentee: 'John Smith',
      date: '2026-05-16',
      time: '10:00 AM',
      topic: 'Career transition to product management',
      status: 'upcoming'
    },
    {
      id: '2',
      mentee: 'Emily Chen',
      date: '2026-05-17',
      time: '2:30 PM',
      topic: 'Frontend development best practices',
      status: 'upcoming'
    },
    {
      id: '3',
      mentee: 'Michael Brown',
      date: '2026-05-18',
      time: '11:00 AM',
      topic: 'Scaling web applications',
      status: 'upcoming'
    }
  ];

  const ongoingChats = [
    {
      id: '4',
      mentee: 'Sarah Lee',
      date: '2026-05-15',
      time: '3:00 PM',
      topic: 'Leadership and team management',
      status: 'ongoing',
      duration: '35분 경과'
    }
  ];

  const completedChats = [
    {
      id: '5',
      mentee: 'David Kim',
      date: '2026-05-10',
      time: '2:00 PM',
      topic: 'System design interview prep',
      status: 'completed',
      rating: 5
    },
    {
      id: '6',
      mentee: 'Lisa Wang',
      date: '2026-05-08',
      time: '10:00 AM',
      topic: 'Career growth strategy',
      status: 'completed',
      rating: 5
    },
    {
      id: '7',
      mentee: 'Alex Johnson',
      date: '2026-05-05',
      time: '4:00 PM',
      topic: 'Backend architecture review',
      status: 'completed',
      rating: 4
    }
  ];

  const handleJoinChat = (chatId) => {
    navigate(`/coffee-chat/${chatId}`);
  };

  const renderChatCard = (chat) => (
    <div
      key={chat.id}
      className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {chat.mentee.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{chat.mentee}</h3>
            <p className="text-sm text-gray-600">{chat.topic}</p>
          </div>
        </div>
        {chat.status === 'completed' && chat.rating && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < chat.rating ? 'text-yellow-400' : 'text-gray-300'}>
                ★
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{chat.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{chat.time}</span>
        </div>
      </div>

      {chat.status === 'ongoing' && (
        <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">진행 중: {chat.duration}</p>
        </div>
      )}

      <div className="flex gap-3">
        {chat.status === 'upcoming' && (
          <button className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition">
            세부사항 보기
          </button>
        )}
        {chat.status === 'ongoing' && (
          <button
            onClick={() => handleJoinChat(chat.id)}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <Coffee className="w-5 h-5" />
            티타임 입장
          </button>
        )}
        {chat.status === 'completed' && (
          <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition">
             세부사항 보기
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ChevronLeft className="w-5 h-5" />
            대시보드로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">티타임 관리</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-8 py-3 font-semibold rounded-lg transition ${
              activeTab === 'upcoming'
                ? 'bg-black text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            예정 ({upcomingChats.length})
          </button>
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`px-8 py-3 font-semibold rounded-lg transition ${
              activeTab === 'ongoing'
                ? 'bg-black text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            진행중 ({ongoingChats.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-8 py-3 font-semibold rounded-lg transition ${
              activeTab === 'completed'
                ? 'bg-black text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            종료 ({completedChats.length})
          </button>
        </div>

        {/* Chat List */}
        <div className="grid gap-6">
          {activeTab === 'upcoming' && upcomingChats.map(renderChatCard)}
          {activeTab === 'ongoing' && ongoingChats.map(renderChatCard)}
          {activeTab === 'completed' && completedChats.map(renderChatCard)}
        </div>
      </div>
    </div>
  );
}