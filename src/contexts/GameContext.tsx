import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
interface Player {
  id: string;
  nickname: string;
  avatar: string;
  connected: boolean;
  score?: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  timeLimit: number;
}

interface Quiz {
  title: string;
  description: string;
  questions: Question[];
}

interface Game {
  id: string;
  quiz: Quiz;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentQuestionIndex: number;
  leaderboard: Player[];
}

interface GameState {
  currentGame: Game | null;
  playerInfo: Player | null;
  gameCode: string | null;
  isAdmin: boolean;
  error: string | null;
  currentQuestion: Question | null;
  timeRemaining: number;
  showResults: boolean;
  playerAnswer: number | null;
}

// Actions
type GameAction =
  | { type: 'SET_GAME'; payload: Game }
  | { type: 'SET_PLAYER_INFO'; payload: Player }
  | { type: 'SET_GAME_CODE'; payload: string }
  | { type: 'SET_IS_ADMIN'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_QUESTION'; payload: Question | null }
  | { type: 'SET_TIME_REMAINING'; payload: number }
  | { type: 'SET_SHOW_RESULTS'; payload: boolean }
  | { type: 'SET_PLAYER_ANSWER'; payload: number | null }
  | { type: 'UPDATE_PLAYERS'; payload: Player[] }
  | { type: 'UPDATE_LEADERBOARD'; payload: Player[] }
  | { type: 'RESET_GAME' };

// Initial state
const initialState: GameState = {
  currentGame: null,
  playerInfo: null,
  gameCode: null,
  isAdmin: false,
  error: null,
  currentQuestion: null,
  timeRemaining: 0,
  showResults: false,
  playerAnswer: null,
};

// Reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_GAME':
      return { ...state, currentGame: action.payload };
    case 'SET_PLAYER_INFO':
      return { ...state, playerInfo: action.payload };
    case 'SET_GAME_CODE':
      return { ...state, gameCode: action.payload };
    case 'SET_IS_ADMIN':
      return { ...state, isAdmin: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestion: action.payload, showResults: false, playerAnswer: null };
    case 'SET_TIME_REMAINING':
      return { ...state, timeRemaining: action.payload };
    case 'SET_SHOW_RESULTS':
      return { ...state, showResults: action.payload };
    case 'SET_PLAYER_ANSWER':
      return { ...state, playerAnswer: action.payload };
    case 'UPDATE_PLAYERS':
      return {
        ...state,
        currentGame: state.currentGame 
          ? { ...state.currentGame, players: action.payload }
          : null
      };
    case 'UPDATE_LEADERBOARD':
      return {
        ...state,
        currentGame: state.currentGame
          ? { ...state.currentGame, leaderboard: action.payload }
          : null
      };
    case 'RESET_GAME':
      return initialState;
    default:
      return state;
  }
};

// Context
const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

// Provider
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

// Hook
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Export types
export type { Player, Question, Quiz, Game, GameState, GameAction };