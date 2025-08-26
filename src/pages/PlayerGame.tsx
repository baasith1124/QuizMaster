import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { Clock, Trophy, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

const PlayerGame: React.FC = () => {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{ isCorrect: boolean; correctAnswer: number } | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!socket || !gameCode) return;

    socket.on('gameStarted', ({ questionIndex, question, totalQuestions }) => {
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: question });
      setTimeRemaining(question.timeLimit);
      setAnswered(false);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setShowResults(false);
    });

    socket.on('nextQuestion', ({ questionIndex, question }) => {
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: question });
      setTimeRemaining(question.timeLimit);
      setAnswered(false);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setShowResults(false);
    });

    socket.on('answerResult', ({ isCorrect, correctAnswer, explanation }) => {
      setAnswerResult({ isCorrect, correctAnswer });
      setShowResults(true);
    });

    socket.on('leaderboardUpdate', ({ leaderboard }) => {
      dispatch({ type: 'UPDATE_LEADERBOARD', payload: leaderboard });
    });

    socket.on('error', ({ message }) => {
      dispatch({ type: 'SET_ERROR', payload: message });
    });

    return () => {
      socket.off('gameStarted');
      socket.off('nextQuestion');
      socket.off('answerResult');
      socket.off('leaderboardUpdate');
      socket.off('error');
    };
  }, [socket, gameCode, dispatch]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining > 0 && !answered) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, answered]);

  const submitAnswer = (answerIndex: number) => {
    if (!socket || answered || !gameCode) return;

    setSelectedAnswer(answerIndex);
    setAnswered(true);
    
    socket.emit('submitAnswer', {
      gameCode,
      answerIndex
    });
  };

  const getPlayerScore = () => {
    if (!state.currentGame?.leaderboard || !state.playerInfo) return 0;
    const player = state.currentGame.leaderboard.find(p => p.id === state.playerInfo?.id);
    return player?.score || 0;
  };

  if (!state.currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {state.playerInfo?.avatar && (
              <span className="text-4xl">{state.playerInfo.avatar}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {state.playerInfo?.nickname}!
          </h1>
          <p className="text-gray-600 mb-6">
            Waiting for the host to start the game...
          </p>
          <div className="animate-pulse flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="mt-6 flex items-center text-gray-600 hover:text-gray-900 mx-auto transition-colors duration-200"
          >
            <ArrowLeft size={20} className="mr-2" />
            Leave Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-lg mx-auto">
        {/* Player Info Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl mr-3">
                {state.playerInfo?.avatar}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{state.playerInfo?.nickname}</div>
                <div className="text-sm text-gray-600">Score: {getPlayerScore()}</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
        </div>

        {/* Timer */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-center">
            <Clock size={24} className="text-blue-600 mr-3" />
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                timeRemaining <= 5 ? 'text-red-600' : 'text-blue-600'
              }`}>
                {timeRemaining}
              </div>
              <div className="text-gray-600 text-sm">seconds remaining</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                timeRemaining <= 5 ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{
                width: `${(timeRemaining / state.currentQuestion.timeLimit) * 100}%`
              }}
            ></div>
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-4 mb-6">
          {state.currentQuestion.options.map((option, index) => {
            let buttonClass = 'w-full p-6 text-left text-lg font-semibold rounded-2xl border-2 transition-all duration-200 transform active:scale-95 ';
            
            if (showResults && answerResult) {
              if (index === answerResult.correctAnswer) {
                buttonClass += 'bg-green-100 border-green-500 text-green-800';
              } else if (index === selectedAnswer && index !== answerResult.correctAnswer) {
                buttonClass += 'bg-red-100 border-red-500 text-red-800';
              } else {
                buttonClass += 'bg-gray-100 border-gray-300 text-gray-600';
              }
            } else if (selectedAnswer === index) {
              buttonClass += 'bg-purple-100 border-purple-500 text-purple-800 shadow-lg';
            } else if (answered) {
              buttonClass += 'bg-gray-100 border-gray-300 text-gray-600';
            } else {
              buttonClass += 'bg-white border-gray-300 text-gray-900 hover:border-purple-500 hover:bg-purple-50 shadow-lg hover:shadow-xl hover:-translate-y-1';
            }

            return (
              <button
                key={index}
                onClick={() => submitAnswer(index)}
                disabled={answered || timeRemaining === 0}
                className={buttonClass}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-4 font-bold text-gray-700">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                  {showResults && answerResult && (
                    <div className="ml-4">
                      {index === answerResult.correctAnswer && (
                        <CheckCircle size={24} className="text-green-600" />
                      )}
                      {index === selectedAnswer && index !== answerResult.correctAnswer && (
                        <XCircle size={24} className="text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Answer Status */}
        {answered && !showResults && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
            <div className="text-blue-600 mb-2">✓ Answer Submitted!</div>
            <p className="text-blue-800">Waiting for results...</p>
          </div>
        )}

        {/* Results */}
        {showResults && answerResult && (
          <div className={`rounded-2xl p-6 text-center ${
            answerResult.isCorrect 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`text-2xl font-bold mb-2 ${
              answerResult.isCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {answerResult.isCorrect ? '🎉 Correct!' : '❌ Incorrect'}
            </div>
            <p className={`${answerResult.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {answerResult.isCorrect 
                ? 'Great job! You got it right!' 
                : `The correct answer was ${String.fromCharCode(65 + answerResult.correctAnswer)}`}
            </p>
            {state.currentQuestion.explanation && (
              <div className="mt-4 p-4 bg-white rounded-xl">
                <div className="font-semibold text-gray-900 mb-2">Explanation:</div>
                <p className="text-gray-700">{state.currentQuestion.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Current Score */}
        <div className="mt-6 bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-center">
            <Trophy size={20} className="text-yellow-600 mr-2" />
            <span className="text-gray-700">Your Score: </span>
            <span className="text-2xl font-bold text-yellow-600 ml-2">{getPlayerScore()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerGame;