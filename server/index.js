import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

// Game state storage (in production, use Redis or database)
const games = new Map();
const players = new Map();

// Game class to manage game state
class Game {
  constructor(quiz, adminSocketId) {
    this.id = uuidv4().substring(0, 6).toUpperCase();
    this.quiz = quiz;
    this.adminSocketId = adminSocketId;
    this.players = new Map();
    this.status = 'waiting'; // waiting, playing, finished
    this.currentQuestionIndex = 0;
    this.questionStartTime = null;
    this.scores = new Map();
    this.questionTimer = null;
  }

  addPlayer(socketId, playerInfo) {
    this.players.set(socketId, {
      ...playerInfo,
      id: socketId,
      connected: true
    });
    this.scores.set(socketId, 0);
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    this.scores.delete(socketId);
  }

  getLeaderboard() {
    const leaderboard = Array.from(this.players.entries())
      .map(([socketId, player]) => ({
        ...player,
        score: this.scores.get(socketId) || 0
      }))
      .sort((a, b) => b.score - a.score);
    return leaderboard;
  }

  startQuestion() {
    if (this.currentQuestionIndex >= this.quiz.questions.length) {
      this.endGame();
      return;
    }

    const question = this.quiz.questions[this.currentQuestionIndex];
    this.questionStartTime = Date.now();
    this.status = 'playing';

    // Clear any existing timer
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
    }

    // Auto-advance after question time limit
    this.questionTimer = setTimeout(() => {
      this.endQuestion();
    }, question.timeLimit * 1000);
  }

  endQuestion() {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
      this.questionTimer = null;
    }

    const question = this.quiz.questions[this.currentQuestionIndex];
    
    // Show results for 5 seconds, then move to next question
    setTimeout(() => {
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex < this.quiz.questions.length) {
        this.startQuestion();
        io.to(`game-${this.id}`).emit('nextQuestion', {
          questionIndex: this.currentQuestionIndex,
          question: this.quiz.questions[this.currentQuestionIndex]
        });
      } else {
        this.endGame();
      }
    }, 5000);
  }

  submitAnswer(socketId, answerIndex) {
    if (this.status !== 'playing' || !this.questionStartTime) return false;

    const question = this.quiz.questions[this.currentQuestionIndex];
    const timeSpent = (Date.now() - this.questionStartTime) / 1000;
    
    // Check if answer is correct and within time limit
    if (answerIndex === question.correctAnswer && timeSpent <= question.timeLimit) {
      // Score based on speed (faster answers get more points)
      const speedBonus = Math.max(0, (question.timeLimit - timeSpent) / question.timeLimit);
      const points = Math.round(1000 * (0.5 + 0.5 * speedBonus));
      const currentScore = this.scores.get(socketId) || 0;
      this.scores.set(socketId, currentScore + points);
      return true;
    }
    return false;
  }

  endGame() {
    this.status = 'finished';
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
    }
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Create a new game
  socket.on('createGame', (quizData) => {
    try {
      const game = new Game(quizData, socket.id);
      games.set(game.id, game);
      socket.join(`game-${game.id}`);
      
      socket.emit('gameCreated', {
        gameCode: game.id,
        game: {
          id: game.id,
          quiz: game.quiz,
          status: game.status,
          players: Array.from(game.players.values())
        }
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to create game' });
    }
  });

  // Join a game as a player
  socket.on('joinGame', ({ gameCode, playerInfo }) => {
    try {
      const game = games.get(gameCode.toUpperCase());
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.status !== 'waiting') {
        socket.emit('error', { message: 'Game already started' });
        return;
      }

      game.addPlayer(socket.id, playerInfo);
      socket.join(`game-${game.id}`);
      players.set(socket.id, { gameCode: game.id, role: 'player' });

      // Notify all players in the game about the new player
      io.to(`game-${game.id}`).emit('playerJoined', {
        players: Array.from(game.players.values()),
        newPlayer: playerInfo
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Start the game
  socket.on('startGame', (gameCode) => {
    try {
      const game = games.get(gameCode);
      if (!game || game.adminSocketId !== socket.id) {
        socket.emit('error', { message: 'Unauthorized or game not found' });
        return;
      }

      if (game.players.size === 0) {
        socket.emit('error', { message: 'No players joined yet' });
        return;
      }

      game.startQuestion();
      
      const question = game.quiz.questions[0];
      io.to(`game-${game.id}`).emit('gameStarted', {
        questionIndex: 0,
        question: question,
        totalQuestions: game.quiz.questions.length
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Submit an answer
  socket.on('submitAnswer', ({ gameCode, answerIndex }) => {
    try {
      const game = games.get(gameCode);
      if (!game) return;

      const isCorrect = game.submitAnswer(socket.id, answerIndex);
      const question = game.quiz.questions[game.currentQuestionIndex];
      
      socket.emit('answerResult', { 
        isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      });

      // Update leaderboard for all clients
      io.to(`game-${game.id}`).emit('leaderboardUpdate', {
        leaderboard: game.getLeaderboard(),
        currentQuestion: game.currentQuestionIndex
      });

    } catch (error) {
      socket.emit('error', { message: 'Failed to submit answer' });
    }
  });

  // Get current game state
  socket.on('getGameState', (gameCode) => {
    try {
      const game = games.get(gameCode);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      socket.emit('gameState', {
        game: {
          id: game.id,
          status: game.status,
          currentQuestionIndex: game.currentQuestionIndex,
          quiz: game.quiz,
          leaderboard: game.getLeaderboard(),
          players: Array.from(game.players.values())
        }
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to get game state' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.gameCode);
      if (game) {
        game.removePlayer(socket.id);
        io.to(`game-${game.id}`).emit('playerLeft', {
          players: Array.from(game.players.values()),
          leftPlayerId: socket.id
        });
      }
      players.delete(socket.id);
    }

    // Clean up empty games
    for (const [gameId, game] of games.entries()) {
      if (game.adminSocketId === socket.id || game.players.size === 0) {
        games.delete(gameId);
      }
    }
  });
});

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});