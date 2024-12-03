import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './styles.css';

const socket = io('http://localhost:3000');

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    // Escuchar mensajes nuevos
    socket.on('chat_message', (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Escuchar mensajes editados
    socket.on('edit_message', (data) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === data.id ? { ...msg, mensaje: data.mensaje } : msg
        )
      );
    });

    // Escuchar mensajes eliminados
    socket.on('delete_message', (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== messageId)
      );
    });

    // Cargar mensajes existentes al conectarse
    socket.on('initial_messages', (data) => {
      setMessages(data);
    });

    return () => {
      socket.off('chat_message');
      socket.off('edit_message');
      socket.off('delete_message');
      socket.off('initial_messages');
    };
  }, []);

  const handleLogin = () => {
    if (username.trim()) {
      socket.emit('set_username', username);
      setIsLoggedIn(true);
    }
  };

  const handleSendMessage = () => {
    if (message.trim() || image) {
      const newMessage = {
        id: Date.now(), // ID único basado en la hora
        usuario: username,
        mensaje: message,
        imagen: image ? URL.createObjectURL(image) : null, // Convertir imagen a URL local
      };
      socket.emit('chat_message', newMessage);
      setMessage('');
      setImage(null);
    }
  };

  const handleEditMessage = (msg) => {
    setEditingMessage(msg); // Preparar el mensaje para edición
    setMessage(msg.mensaje); // Poner el texto del mensaje en el campo de entrada
  };

  const handleSaveEdit = () => {
    if (editingMessage) {
      const updatedMessage = { ...editingMessage, mensaje: message };
      socket.emit('edit_message', updatedMessage); // Notificar al servidor
      setEditingMessage(null); // Salir del modo edición
      setMessage(''); // Limpiar el campo de entrada
    }
  };

  const handleDeleteMessage = (msg) => {
    socket.emit('delete_message', msg.id); // Notificar al servidor
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  return (
    <div className="container">
      {!isLoggedIn ? (
        <div>
          <h2>Ingresa tu nombre</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nombre de usuario"
          />
          <button onClick={handleLogin}>Entrar al chat</button>
        </div>
      ) : (
        <div>
          <h2>Chat</h2>
          <ul>
            {messages.map((msg) => (
              <li
                key={msg.id}
                className={msg.usuario === username ? 'self' : ''}
                onMouseEnter={() => setHoveredMessage(msg.id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
                <strong>{msg.usuario}: </strong>
                {msg.mensaje && <span>{msg.mensaje}</span>}
                {msg.imagen && (
                  <div>
                    <img src={msg.imagen} alt="Mensaje adjunto" width="200" />
                  </div>
                )}
                {hoveredMessage === msg.id && msg.usuario === username && (
                  <div className="actions">
                    <button onClick={() => handleEditMessage(msg)}>
                      Editar
                    </button>
                    <button onClick={() => handleDeleteMessage(msg)}>
                      Eliminar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              editingMessage ? 'Editando mensaje...' : 'Escribe un mensaje...'
            }
          />
          <input type="file" accept="image/*" onChange={handleImageChange} />
          <button
            onClick={editingMessage ? handleSaveEdit : handleSendMessage}
          >
            {editingMessage ? 'Guardar' : 'Enviar'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
