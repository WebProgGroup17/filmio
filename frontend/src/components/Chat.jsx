import { useEffect, useState,useRef } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../App.css';
import {io} from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';


const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Helsinki' };
  return new Date(dateString).toLocaleDateString('en-GB', options);
};

function ChatComponent({ groupId }) {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  // Socket reference
  const socketRef = useRef(null);
  const chatBoxRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${API_URL}/groups/${groupId}/chat`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      setMessages(await response.json());
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Socket connection
  // One authenticated socket per group; disconnecting on cleanup also leaves the old room
  useEffect(() => {
    if (!accessToken) return;

    const socket = io(API_URL, { auth: { token: accessToken } });
    socketRef.current = socket;

    // 'connect' fires again after a reconnect, so the room is re-joined too
    socket.on('connect', () => {
      socket.emit('joinGroup', groupId, (res) => {
        if (!res?.ok) console.error('Could not join group:', res?.error);
      });
    });
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });
    socket.on('newMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [groupId, accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    fetchMessages();
  }, [groupId, accessToken]);

  // Keep the chat scrolled to the newest message
  useEffect(() => {
    const box = chatBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;

    try {
      const response = await fetch(
        `${API_URL}/groups/${groupId}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setText('');

      //fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return <p>Loading chat...</p>;
  }

  return (
    <div>
      <h3>Group Chat</h3>

      <div className="chat-box" ref={chatBoxRef}>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.message_id} className="chat-message">
              <strong>
                {msg.email?.split('@')[0]|| 'Unknown'}
              </strong>
              <small>
                {formatDate(msg.created_at)}
              </small>
              <span className="chat-text">
                {msg.text}
              </span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
        />

        <button type="submit">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatComponent;
