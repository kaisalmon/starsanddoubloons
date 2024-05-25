
import  { Request, Response } from 'express';
import * as express from 'express';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { Server } from 'socket.io';

const app = express()
const server = createServer(app);
const io = new Server(server, {
    cors: {
      origin: 'http://localhost:10001', // Replace with the actual origin of your game
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true
    }
  });;


io.on('connection', (socket) => {
  console.log("Someone connected to the server")
  socket.on('join game', (id) => {
    console.log("Someone joined game", id)
    socket.on(`game ${id}`, (event) => {
      socket.broadcast.emit(`game ${id}`, event)
    });
});
});


server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
})
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'test_client.html'));
});