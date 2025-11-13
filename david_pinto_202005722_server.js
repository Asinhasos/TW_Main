import express from "express";
import { WebSocketServer } from "ws";
import http from "http";

const WebSocket = require('ws');
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });


app.use(express.static("public")); // serve your HTML/JS

let controllerSocket = null;
let gameSocket = null;

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "register") {
      if (data.role === "controller") controllerSocket = ws;
      if (data.role === "game") gameSocket = ws;
    }

    // Forward motion data to the game
    if (data.type === "motion" && gameSocket) {
      gameSocket.send(JSON.stringify(data));
    }
  });
});

wss.on('connection', ws => {
  console.log('New connection');

  ws.on('message', message => {
    console.log('Received from client:', message.toString());
  });

  ws.on('close', () => {
    console.log('Connection closed');
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

server.listen(3000, () => console.log("Server running on http://localhost:3000"));

