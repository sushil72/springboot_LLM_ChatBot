import { useState } from 'react';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { Chat } from './types';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Sidebar 
          chats={chats} 
          setChats={setChats} 
          activeChat={activeChat} 
          setActiveChat={setActiveChat} 
        />
        <ChatInterface 
          chats={chats} 
          setChats={setChats} 
          activeChat={activeChat} 
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;