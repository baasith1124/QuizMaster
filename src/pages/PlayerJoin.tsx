import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { Users, ArrowLeft, UserCircle } from 'lucide-react';

const AVATAR_OPTIONS = [
  '😀', '😎', '🤓', '😊', '🥳', '😇', '🤩', '😋',
  '🐶', '🐱', '🐼', '🦊', '🐨', '🐯', '🦁', '🐸',
  '🌟', '⭐', '🎯', '🎮', '🚀', '⚡', '🔥', '💎'
];

const PlayerJoin: React.FC = () => {
  const navigate = useNavigate();
  const { gameCode: urlGameCode } = useParams();
  const { socket, connected } = useSocket();
  const { state, dispatch } = useGame();
  
  const [gameCode, setGameCode] = useState(urlGameCode || '');
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('playerJoined', ({ players }) => {
      dispatch({ type: 'UPDATE_PLAYERS', payload: players });
      // Navigate to player game screen after successful join
      navigate(`/player/${gameCode.toUpperCase()}`);
    });

    socket.on('error', ({ message }) => {
      dispatch({ type: 'SET_ERROR', payload: message });
      setIsJoining(false);
    });

    return () => {
      socket.off('playerJoined');
      socket.off('error');
    };
  }, [socket, dispatch, navigate, gameCode]);

  const handleJoin = () => {
    if (!gameCode.trim() || !nickname.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter both game code and nickname' });
      return;
    }

    if (!socket || !connected) {
      dispatch({ type: 'SET_ERROR', payload: 'Not connected to server' });
      return;
    }

    setIsJoining(true);
    dispatch({ type: 'SET_ERROR', payload: null });

    const playerInfo = {
      nickname: nickname.trim(),
      avatar: selectedAvatar
    };

    dispatch({ type: 'SET_PLAYER_INFO', payload: { ...playerInfo, id: socket.id, connected: true } });
    dispatch({ type: 'SET_GAME_CODE', payload: gameCode.toUpperCase() });

    socket.emit('joinGame', {
      gameCode: gameCode.toUpperCase(),
      playerInfo
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Home
            </button>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-2xl shadow-lg mx-auto w-fit mb-4">
              <Users size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Game</h1>
            <p className="text-gray-600">Enter the game code and create your profile</p>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-700 text-center">{state.error}</p>
            </div>
          )}

          {/* Connection Status */}
          <div className={`text-center mb-6 p-3 rounded-xl ${
            connected 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>

          {/* Game Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Game Code</label>
            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Enter 6-digit game code"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-center text-2xl font-mono tracking-wider"
            />
          </div>

          {/* Nickname Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Nickname</label>
            <div className="relative">
              <UserCircle size={20} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your nickname"
                maxLength={20}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Avatar Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">Choose Your Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all duration-200 ${
                    selectedAvatar === avatar
                      ? 'bg-purple-100 ring-2 ring-purple-500 scale-110'
                      : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Player Preview</h3>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm">
                {selectedAvatar}
              </div>
              <div className="ml-3">
                <div className="font-semibold text-gray-900">
                  {nickname || 'Your Nickname'}
                </div>
                <div className="text-sm text-gray-600">Ready to play!</div>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoin}
            disabled={!gameCode.trim() || !nickname.trim() || isJoining || !connected}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
          >
            {isJoining ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Joining Game...
              </>
            ) : (
              <>
                <Users size={20} className="mr-2" />
                Join Game
              </>
            )}
          </button>

          {/* Instructions */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have a game code? Ask your host to share it with you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerJoin;