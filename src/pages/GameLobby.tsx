import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { Play, Users, ArrowLeft, Monitor, Copy, Check } from 'lucide-react';

const GameLobby: React.FC = () => {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket || !gameCode) return;

    // Get current game state
    socket.emit('getGameState', gameCode);

    socket.on('gameState', ({ game }) => {
      dispatch({ type: 'SET_GAME', payload: game });
    });

    socket.on('playerJoined', ({ players, newPlayer }) => {
      dispatch({ type: 'UPDATE_PLAYERS', payload: players });
    });

    socket.on('playerLeft', ({ players }) => {
      dispatch({ type: 'UPDATE_PLAYERS', payload: players });
    });

    socket.on('gameStarted', () => {
      // Navigate to game display when admin starts the game
      navigate(`/display/${gameCode}`);
    });

    socket.on('error', ({ message }) => {
      dispatch({ type: 'SET_ERROR', payload: message });
    });

    return () => {
      socket.off('gameState');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('error');
    };
  }, [socket, gameCode, dispatch, navigate]);

  const startGame = () => {
    if (!socket || !gameCode) return;
    
    if (!state.currentGame?.players || state.currentGame.players.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'No players have joined yet!' });
      return;
    }

    socket.emit('startGame', gameCode);
  };

  const copyGameCode = async () => {
    if (!gameCode) return;
    
    try {
      await navigator.clipboard.writeText(gameCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy game code:', err);
    }
  };

  const openDisplayScreen = () => {
    window.open(`/display/${gameCode}`, '_blank');
  };

  if (!state.currentGame) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Game Lobby</h1>
              <p className="text-gray-600">Waiting for players to join...</p>
            </div>
            <button
              onClick={openDisplayScreen}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors duration-200 flex items-center"
            >
              <Monitor size={20} className="mr-2" />
              Open Display Screen
            </button>
          </div>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{state.error}</p>
          </div>
        )}

        {/* Game Info */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Quiz Details */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quiz Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Title:</span>
                <span className="ml-2 font-semibold">{state.currentGame.quiz.title}</span>
              </div>
              {state.currentGame.quiz.description && (
                <div>
                  <span className="text-gray-600">Description:</span>
                  <span className="ml-2">{state.currentGame.quiz.description}</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Questions:</span>
                <span className="ml-2 font-semibold">{state.currentGame.quiz.questions.length}</span>
              </div>
            </div>
          </div>

          {/* Game Code */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Game Code</h2>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-blue-600 bg-blue-50 py-4 px-6 rounded-lg border-2 border-blue-200 mb-4">
                {gameCode}
              </div>
              <button
                onClick={copyGameCode}
                className="flex items-center justify-center mx-auto px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
              >
                {copied ? (
                  <>
                    <Check size={16} className="mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-2" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <Users size={24} className="mr-2" />
              Players ({state.currentGame.players.length})
            </h2>
            <div className="text-sm text-gray-600">
              Players will see their screens automatically update
            </div>
          </div>

          {state.currentGame.players.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg mb-2">No players yet</p>
              <p className="text-gray-500">Share the game code for players to join!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {state.currentGame.players.map((player) => (
                <div
                  key={player.id}
                  className="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-3xl shadow-sm mx-auto mb-3">
                    {player.avatar}
                  </div>
                  <div className="font-semibold text-gray-900 mb-1">{player.nickname}</div>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    player.connected 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {player.connected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">How it works:</h3>
          <div className="space-y-2 text-blue-800">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</div>
              <span>Players join using the game code above</span>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</div>
              <span>When ready, click "Start Game" to begin</span>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</div>
              <span>Questions appear on the main display, answers on player devices</span>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</div>
              <span>Leaderboard updates live after each question</span>
            </div>
          </div>
        </div>

        {/* Start Game Button */}
        <div className="text-center">
          <button
            onClick={startGame}
            disabled={state.currentGame.players.length === 0}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center mx-auto"
          >
            <Play size={24} className="mr-3" />
            Start Game
          </button>
          {state.currentGame.players.length === 0 && (
            <p className="text-gray-500 text-sm mt-2">Wait for at least one player to join</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLobby;