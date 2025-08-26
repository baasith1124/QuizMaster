import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { GameProvider } from './contexts/GameContext';
import HomePage from './pages/HomePage';
import AdminPanel from './pages/AdminPanel';
import PlayerJoin from './pages/PlayerJoin';
import PlayerGame from './pages/PlayerGame';
import GameDisplay from './pages/GameDisplay';
import GameLobby from './pages/GameLobby';

function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/join" element={<PlayerJoin />} />
              <Route path="/join/:gameCode" element={<PlayerJoin />} />
              <Route path="/player/:gameCode" element={<PlayerGame />} />
              <Route path="/display/:gameCode" element={<GameDisplay />} />
              <Route path="/lobby/:gameCode" element={<GameLobby />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </GameProvider>
    </SocketProvider>
  );
}

export default App;