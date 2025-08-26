import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Monitor, Gamepad2 } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Gamepad2 size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            QuizMaster Live
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create engaging real-time multiplayer quiz games. Perfect for classrooms, 
            team building, or fun with friends!
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Create Game Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Monitor size={32} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 ml-4">Host a Game</h2>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Create custom quizzes with multiple choice questions, set time limits, 
                and generate QR codes for easy player access.
              </p>
              <button
                onClick={() => navigate('/admin')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <Play size={20} className="mr-2" />
                Create Quiz Game
              </button>
            </div>
          </div>

          {/* Join Game Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Users size={32} className="text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 ml-4">Join a Game</h2>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Enter a game code or scan a QR code to join an active quiz game. 
                Compete with other players in real-time!
              </p>
              <button
                onClick={() => navigate('/join')}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                <Users size={20} className="mr-2" />
                Join Game
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white/50 backdrop-blur rounded-xl">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play size={24} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-time Gaming</h3>
            <p className="text-gray-600 text-sm">
              Live scoring and instant feedback with WebSocket technology
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/50 backdrop-blur rounded-xl">
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor size={24} className="text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Multi-Screen Setup</h3>
            <p className="text-gray-600 text-sm">
              Separate admin, player, and display screens for optimal experience
            </p>
          </div>
          
          <div className="text-center p-6 bg-white/50 backdrop-blur rounded-xl">
            <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={24} className="text-pink-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy Access</h3>
            <p className="text-gray-600 text-sm">
              QR codes and game codes make joining games quick and simple
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;