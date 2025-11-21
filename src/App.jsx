import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { GlobalProvider } from './context/GlobalContext';

import Intro from './pages/Intro';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Game from './pages/Game';
import TopicGame from './pages/TopicGame';
import Notes from './pages/Notes';

function AnimatedRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Intro />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/game" element={<Game />} />
                <Route path="/topic-game" element={<TopicGame />} />
                <Route path="/notes" element={<Notes />} />
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <GlobalProvider>
            <Router>
                <AnimatedRoutes />
            </Router>
        </GlobalProvider>
    );
}

export default App;
