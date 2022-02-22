const Colyseus = require("colyseus.js");

//const client = new Colyseus.Client('ws://52.66.221.61:9090');
const client = new Colyseus.Client('ws://localhost:9090');

client.reconnect("testBattle1999", "kTTF-Mq9u").then(room => {
    console.log("joined successfully", room);
  }).catch(e => {
    console.error("join error", e);
  });
  