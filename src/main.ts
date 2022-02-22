import express from "express";
import { createServer } from "http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport"
require("dotenv").config();

let port = Number(process.env.PORT);

import { battleRoom } from "./room/battleRoom";

const app = express();
app.get('/', (req, res) =>
  res.send(
    `<h4 style='text-align: center;'>
      Buddy, you are at wrong place!
    </h4>`
  )
);

const server = createServer(app);
const gameServer = new Server({
    transport: new WebSocketTransport({
        server // provide the custom server for `WebSocketTransport`
    })
  
});

gameServer
    .define('room', battleRoom)
    .filterBy(['battleId']);

gameServer.listen(port);

console.log(`[GameServer] Listening on Port: ${process.env.PORT}`);
console.log(`This is ${process.env.NODE_ENV} environment.`)