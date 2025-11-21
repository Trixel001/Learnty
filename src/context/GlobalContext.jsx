import React, { createContext, useState, useContext } from 'react';

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    // --- CHAT STATE ---
    const [chatMessages, setChatMessages] = useState([
        { id: 1, text: "Hello! I'm Learnie. What topic should we transform into a game today?", sender: 'bot' }
    ]);

    // --- NOTES STATE ---
    const [noteContent, setNoteContent] = useState('<h1>Learnty Fusion</h1><p>Type notes here. Select text for AI. Switch mode to draw resizable shapes!</p>');
    const [noteElements, setNoteElements] = useState([]);
    const [noteHistory, setNoteHistory] = useState([]); // [ {content, elements, timestamp, reason} ]

    // --- GAME STATE ---
    const [gameXP, setGameXP] = useState(1200);
    const [gameStreak, setGameStreak] = useState(1);
    const [gameHistory, setGameHistory] = useState({}); // { [stepIndex]: {selected, isCorrect, view} }

    // --- TOPIC GAME STATE ---
    const [topicRoadmap, setTopicRoadmap] = useState([]);
    const [topicStatus, setTopicStatus] = useState("");

    return (
        <GlobalContext.Provider value={{
            // Chat
            chatMessages, setChatMessages,

            // Notes
            noteContent, setNoteContent,
            noteElements, setNoteElements,
            noteHistory, setNoteHistory,

            // Game
            gameXP, setGameXP,
            gameStreak, setGameStreak,
            gameHistory, setGameHistory,

            // Topic Game
            topicRoadmap, setTopicRoadmap,
            topicStatus, setTopicStatus
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalState = () => useContext(GlobalContext);
