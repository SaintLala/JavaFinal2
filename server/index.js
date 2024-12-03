const http = require('http');

const server = http.createServer();

const io = require('socket.io')(server, {
    cors: { origin: '*' }
});

let messages = [];

io.on('connection', (socket) => {
    console.log('Se ha conectado un Chupapi');

    socket.broadcast.emit('chat_message', {
        usuario: 'INFO',
        mensaje: 'Se ha conectado un nuevo Chupapi',
    });


    socket.emit('initial_messages', messages);

    socket.on('chat_message', (data) => {
        messages.push(data);

        io.emit('chat_message', data);
    });

    socket.on('edit_message', (data) => {
        
        const index = messages.findIndex((msg) => msg.id === data.id);
        if (index !== -1) {
            messages[index].mensaje = data.mensaje;
            io.emit('edit_message', data); 
        }
    });


    socket.on('delete_message', (messageId) => {
     
        messages = messages.filter((msg) => msg.id !== messageId);

        
        io.emit('delete_message', messageId);
    });

    socket.on('disconnect', () => {
        console.log('Un cliente se ha desconectado');
    });
});

server.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});
