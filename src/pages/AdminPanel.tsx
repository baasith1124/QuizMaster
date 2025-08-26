import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../contexts/SocketContext';
import { useGame } from '../contexts/GameContext';
import { Plus, Trash2, Clock, Save, ArrowLeft } from 'lucide-react';
import QRCode from 'qrcode';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  timeLimit: number;
}

interface Quiz {
  title: string;
  description: string;
  questions: Question[];
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { state, dispatch } = useGame();
  
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    questions: []
  });
  
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    timeLimit: 30
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [gameCreated, setGameCreated] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('gameCreated', ({ gameCode, game }) => {
      dispatch({ type: 'SET_GAME_CODE', payload: gameCode });
      dispatch({ type: 'SET_GAME', payload: game });
      dispatch({ type: 'SET_IS_ADMIN', payload: true });
      setGameCreated(true);
      
      // Generate QR code
      const joinUrl = `${window.location.origin}/join/${gameCode}`;
      QRCode.toDataURL(joinUrl)
        .then(url => setQrCodeUrl(url))
        .catch(console.error);
    });

    socket.on('error', ({ message }) => {
      dispatch({ type: 'SET_ERROR', payload: message });
    });

    return () => {
      socket.off('gameCreated');
      socket.off('error');
    };
  }, [socket, dispatch]);

  const addOrUpdateQuestion = () => {
    if (!currentQuestion.text.trim() || currentQuestion.options.some(opt => !opt.trim())) {
      dispatch({ type: 'SET_ERROR', payload: 'Please fill in all question fields' });
      return;
    }

    const questionWithId = {
      ...currentQuestion,
      id: editingIndex !== null ? quiz.questions[editingIndex].id : Date.now().toString()
    };

    let updatedQuestions = [...quiz.questions];
    if (editingIndex !== null) {
      updatedQuestions[editingIndex] = questionWithId;
      setEditingIndex(null);
    } else {
      updatedQuestions.push(questionWithId);
    }

    setQuiz({ ...quiz, questions: updatedQuestions });
    setCurrentQuestion({
      id: '',
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      timeLimit: 30
    });
    
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(quiz.questions[index]);
    setEditingIndex(index);
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: updatedQuestions });
    
    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentQuestion({
        id: '',
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        timeLimit: 30
      });
    }
  };

  const createGame = () => {
    if (!quiz.title.trim() || quiz.questions.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Please add a title and at least one question' });
      return;
    }

    if (!socket) {
      dispatch({ type: 'SET_ERROR', payload: 'Not connected to server' });
      return;
    }

    socket.emit('createGame', quiz);
  };

  const goToLobby = () => {
    if (state.gameCode) {
      navigate(`/lobby/${state.gameCode}`);
    }
  };

  if (gameCreated) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Save size={40} className="text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Created Successfully!</h1>
              <p className="text-gray-600">Share the game code or QR code with players</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Game Code</h2>
              <div className="text-4xl font-mono font-bold text-blue-600 bg-white py-4 px-6 rounded-lg border-2 border-blue-200">
                {state.gameCode}
              </div>
            </div>

            {qrCodeUrl && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Code</h2>
                <img src={qrCodeUrl} alt="QR Code" className="mx-auto rounded-lg" />
                <p className="text-sm text-gray-600 mt-2">Players can scan this to join automatically</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Home
              </button>
              <button
                onClick={goToLobby}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
              >
                Go to Lobby
              </button>
            </div>
          </div>
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Quiz Game</h1>
          <p className="text-gray-600">Design your custom quiz with multiple choice questions</p>
        </div>

        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{state.error}</p>
          </div>
        )}

        {/* Quiz Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Quiz Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quiz Title *</label>
              <input
                type="text"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                placeholder="Enter quiz title"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={quiz.description}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                placeholder="Brief description of the quiz"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        {/* Question Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {editingIndex !== null ? 'Edit Question' : 'Add New Question'}
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text *</label>
              <textarea
                value={currentQuestion.text}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                placeholder="Enter your question here..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer Options *</label>
              <div className="grid md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="relative">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...currentQuestion.options];
                        newOptions[index] = e.target.value;
                        setCurrentQuestion({ ...currentQuestion, options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                        currentQuestion.correctAnswer === index 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                      className={`absolute right-3 top-3 w-6 h-6 rounded-full border-2 transition-colors duration-200 ${
                        currentQuestion.correctAnswer === index
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {currentQuestion.correctAnswer === index && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">Click the circle to mark the correct answer</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (seconds)</label>
                <div className="relative">
                  <Clock size={20} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="number"
                    value={currentQuestion.timeLimit}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, timeLimit: parseInt(e.target.value) || 30 })}
                    min="10"
                    max="120"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (optional)</label>
                <input
                  type="text"
                  value={currentQuestion.explanation}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                  placeholder="Explain the correct answer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={addOrUpdateQuestion}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center"
              >
                <Plus size={20} className="mr-2" />
                {editingIndex !== null ? 'Update Question' : 'Add Question'}
              </button>
              
              {editingIndex !== null && (
                <button
                  onClick={() => {
                    setEditingIndex(null);
                    setCurrentQuestion({
                      id: '',
                      text: '',
                      options: ['', '', '', ''],
                      correctAnswer: 0,
                      explanation: '',
                      timeLimit: 30
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors duration-200"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Questions List */}
        {quiz.questions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Questions ({quiz.questions.length})
            </h2>
            
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {index + 1}. {question.text}
                      </h3>
                      <div className="grid md:grid-cols-2 gap-2 mb-3">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`px-3 py-2 rounded-lg text-sm ${
                              question.correctAnswer === optIndex
                                ? 'bg-green-100 text-green-800 font-medium'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock size={16} className="mr-1" />
                          {question.timeLimit}s
                        </span>
                        {question.explanation && (
                          <span>Explanation: {question.explanation}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => editQuestion(index)}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteQuestion(index)}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Game Button */}
        <div className="text-center">
          <button
            onClick={createGame}
            disabled={!quiz.title.trim() || quiz.questions.length === 0}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Create Game & Generate Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;