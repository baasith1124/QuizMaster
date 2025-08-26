import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { Clock, Trophy, Users, Star } from 'lucide-react';

const GameDisplay: React.FC = () => {
  const { gameCode } = useParams<{ gameCode: string }>();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);

  useEffect(() => {
    if (!socket || !gameCode) return;

    socket.on('gameStarted', ({ questionIndex, question, totalQuestions }) => {
      setCurrentQuestion(question);
      setTimeRemaining(question.timeLimit);
      setShowResults(false);
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: question });
    });

    socket.on('nextQuestion', ({ questionIndex, question }) => {
      setCurrentQuestion(question);
      setTimeRemaining(question.timeLimit);
      setShowResults(false);
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: question });
    });

    socket.on('leaderboardUpdate', ({ leaderboard }) => {
      dispatch({ type: 'UPDATE_LEADERBOARD', payload: leaderboard });
      setShowResults(true);
      // Hide results after 4 seconds for next question
      setTimeout(() => setShowResults(false), 4000);
    });

    return () => {
      socket.off('gameStarted');
      socket.off('nextQuestion');  
      socket.off('leaderboardUpdate');
    };
  }, [socket, gameCode, dispatch]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !showResults) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && currentQuestion) {
      setShowResults(true);
    }
  }, [timeRemaining, showResults, currentQuestion]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white flex items-center justify-center p-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Users size={64} className="text-white" />
          </div>
          <h1 className="text-6xl font-bold mb-4">QuizMaster Live</h1>
          <p className="text-2xl text-blue-100 mb-8">Game Code: <span className="font-mono font-bold">{gameCode}</span></p>
          <div className="text-xl text-blue-100">
            Waiting for host to start the game...
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const sortedLeaderboard = state.currentGame?.leaderboard || [];
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-blue-700 text-white p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Question Results</h1>
            <div className="text-xl text-green-100">
              Correct Answer: <span className="font-bold">
                {String.fromCharCode(65 + (currentQuestion?.correctAnswer || 0))}. {currentQuestion?.options[currentQuestion?.correctAnswer]}
              </span>
            </div>
            {currentQuestion?.explanation && (
              <div className="mt-4 text-lg text-green-100 max-w-3xl mx-auto">
                {currentQuestion.explanation}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white/10 backdrop-blur rounded-3xl p-8">
            <div className="flex items-center justify-center mb-8">
              <Trophy size={32} className="text-yellow-400 mr-3" />
              <h2 className="text-3xl font-bold">Live Leaderboard</h2>
            </div>

            <div className="space-y-4">
              {sortedLeaderboard.slice(0, 10).map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-6 rounded-2xl transition-all duration-300 ${
                    index === 0 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-2xl scale-105' 
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black shadow-xl'
                      : index === 2
                      ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-black shadow-xl'
                      : 'bg-white/20 backdrop-blur shadow-lg'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 font-bold text-xl mr-4">
                      {index + 1}
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl mr-4">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="text-xl font-bold">{player.nickname}</div>
                      <div className={`text-sm ${index < 3 && index !== 0 ? 'text-black/70' : 'text-white/70'}`}>
                        Rank #{index + 1}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{player.score || 0}</div>
                    <div className={`text-sm ${index < 3 && index !== 0 ? 'text-black/70' : 'text-white/70'}`}>
                      points
                    </div>
                  </div>
                  {index === 0 && (
                    <Star size={24} className="text-yellow-600 ml-4" />
                  )}
                </div>
              ))}
            </div>

            {sortedLeaderboard.length === 0 && (
              <div className="text-center py-12 text-white/70">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-xl">No players yet</p>
              </div>
            )}
          </div>

          <div className="text-center mt-8 text-white/70">
            <p className="text-lg">Next question coming up...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-700 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Timer */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <Clock size={32} className="text-white mr-4" />
            <div>
              <div className={`text-5xl font-bold ${timeRemaining <= 5 ? 'text-red-400' : 'text-white'}`}>
                {timeRemaining}
              </div>
              <div className="text-white/70">seconds remaining</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto bg-white/20 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-1000 ${
                timeRemaining <= 5 ? 'bg-red-400' : 'bg-white'
              }`}
              style={{
                width: `${(timeRemaining / currentQuestion.timeLimit) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-12 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center leading-tight">
            {currentQuestion.text}
          </h1>
        </div>

        {/* Answer Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {currentQuestion.options.map((option: string, index: number) => (
            <div
              key={index}
              className="bg-white/20 backdrop-blur rounded-2xl p-8 border-2 border-white/30 hover:bg-white/30 transition-all duration-300"
            >
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center mr-6 text-2xl font-bold">
                  {String.fromCharCode(65 + index)}
                </div>
                <div className="text-2xl font-semibold">{option}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Players Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center bg-white/10 backdrop-blur rounded-xl px-6 py-3">
            <Users size={20} className="mr-2" />
            <span>Players are answering on their devices...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDisplay;