import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, TextField, Typography, Avatar, Paper, List, ListItem, ListItemAvatar, ListItemText, Button } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import axios from 'axios';
import { Chat, Message } from '../types';

interface ChatInterfaceProps {
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  activeChat: string | null;
}

export default function ChatInterface({ chats, setChats, activeChat }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyTyping, setCurrentlyTyping] = useState<{id: string, content: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref to store the typing interval

  const activeChatData = chats.find(chat => chat.id === activeChat);
  const messages = activeChatData?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentlyTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || !activeChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date(),
    };

    // Update local state first
    const updatedChats = chats.map((chat) => {
      if (chat.id === activeChat) {
        return {
          ...chat,
          messages: [...chat.messages, userMessage],
        };
      }
      return chat;
    });
    setChats(updatedChats);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/chat', {
        message: input,
        chatId: activeChat,
      });

      console.log('API Response:', response.data);

      // Create a message with empty content that will be typed out
      const assistantMessage: Message = {
        id: `typing-${Date.now()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };

      // Add the empty message to the chat
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === activeChat) {
            return {
              ...chat,
              messages: [...chat.messages, assistantMessage],
            };
          }
          return chat;
        })
      );

      // Start typing effect
      typeMessage(response.data, assistantMessage.id);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const typeMessage = (fullText: string, messageId: string) => {
    let i = 0;
    let currentText = '';
    setCurrentlyTyping({ id: messageId, content: '' });
  
    typingIntervalRef.current = setInterval(() => {
      if (i < fullText.length) {
        currentText += fullText.charAt(i);
        setCurrentlyTyping({ id: messageId, content: currentText });
        i++;
      } else {
        clearInterval(typingIntervalRef.current!);
        typingIntervalRef.current = null;
  
        // Finalize the message with complete content
        const finalMessage: Message = {
          id: messageId, // Keep the same ID instead of replacing
          content: fullText,
          role: 'assistant',
          timestamp: new Date(),
        };
  
        setChats((prevChats: Chat[]) =>
          prevChats.map((chat: Chat) => {
            if (chat.id === activeChat) {
              const updatedMessages: Message[] = chat.messages.map((msg: Message) =>
          msg.id === messageId ? finalMessage : msg
              );
              return {
          ...chat,
          messages: updatedMessages,
              };
            }
            return chat;
          })
        );
  
        setCurrentlyTyping(null);
        setIsLoading(false);
      }
    }, 10);
  };
  
  const handleStopTyping = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;

      // Finalize the message with the current content
      if (currentlyTyping) {
        const finalMessage: Message = {
          id: currentlyTyping.id,
          content: currentlyTyping.content,
          role: 'assistant',
          timestamp: new Date(),
        };

        setChats((prevChats: Chat[]) =>
          prevChats.map((chat: Chat) => {
            if (chat.id === activeChat) {
              const updatedMessages: Message[] = chat.messages.map((msg: Message) =>
                msg.id === currentlyTyping.id ? finalMessage : msg
              );
              return {
                ...chat,
                messages: updatedMessages,
              };
            }
            return chat;
          })
        );

        setCurrentlyTyping(null);
        setIsLoading(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !activeChat) return;
    
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', activeChat);

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/chat/pdf',formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Create a message with empty content that will be typed out
      const assistantMessage: Message = {
        id: `typing-${Date.now()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };

      // Add the empty message to the chat
      setChats(chats.map(chat => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: [...chat.messages, assistantMessage],
          };
        }
        return chat;
      }));

      // Start typing effect
      typeMessage(response.data || 'PDF processed successfully', assistantMessage.id);
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setIsLoading(false);
    }
  };

  const getMessageContent = (message: Message) => {
    if (currentlyTyping && currentlyTyping.id === message.id) {
      return currentlyTyping.content;
    }
    return message.content;
  };

  if (!activeChat) {
    return (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography variant="h6">Select a chat or create a new one</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      flex: 1,
      height: '100vh',
      backgroundColor: 'background.default',
    }}>
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <List sx={{ flex: 1 }}>
          {messages.map((message) => (
            <ListItem key={message.id} sx={{ 
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-start',
              py: 2,
            }}>
              {message.role === 'assistant' && (
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>AI</Avatar>
                </ListItemAvatar>
              )}
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  ml: message.role === 'assistant' ? 0 : 2,
                  mr: message.role === 'user' ? 0 : 2,
                  backgroundColor: message.role === 'assistant' ? 'grey.800' : 'primary.main',
                  color: message.role === 'assistant' ? 'text.primary' : 'primary.contrastText',
                  maxWidth: '70%',
                  borderRadius: message.role === 'assistant' 
                    ? '0px 18px 18px 18px' 
                    : '18px 0px 18px 18px',
                }}
              >
                <ListItemText 
                  primary={getMessageContent(message)} 
                  primaryTypographyProps={{ 
                    sx: { 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    } 
                  }} 
                />
              </Paper>
              {message.role === 'user' && (
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>U</Avatar>
                </ListItemAvatar>
              )}
            </ListItem>
          ))}
          {isLoading && !currentlyTyping && (
            <ListItem sx={{ justifyContent: 'flex-start' }}>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>AI</Avatar>
              </ListItemAvatar>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  backgroundColor: 'grey.800',
                  borderRadius: '0px 18px 18px 18px',
                }}
              >
                <ListItemText primary="Thinking..." />
              </Paper>
            </ListItem>
          )}
          <div ref={messagesEndRef} />
        </List>
      </Box>
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton component="label">
            <AttachFileIcon />
            <input
              type="file"
              hidden
              accept="application/pdf"
              onChange={handleFileUpload}
            />
          </IconButton>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            multiline
            maxRows={4}
            sx={{ 
              mx: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                backgroundColor: 'background.default',
              },
            }}
            disabled={isLoading}
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
          >
            <SendIcon />
          </IconButton>
          {currentlyTyping && (
            <Button variant="contained" color="secondary" onClick={handleStopTyping}>
              Stop
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}