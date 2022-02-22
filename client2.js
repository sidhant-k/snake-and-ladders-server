const Colyseus = require("colyseus.js");

const client = new Colyseus.Client('ws://52.66.221.61:9090');
//const client = new Colyseus.Client('ws://localhost:9090');

let counter = 1;

client.joinOrCreate("room", {
    battleId: "test6969",
    userId: "4bf685e6-6d87-4b20-bf98-2748e6c2548f"
}).then(room => {
    console.log(room.sessionId, "joined", room.id);

    room.onMessage("roomFilled", (message) => {
        console.log("event received for room filled ->>");
        console.log(message);
        room.send("getGameDetails");
    })

    room.onMessage("startTimer", (message) => {
        console.log("start timer", message);
        if(message.timeLeft == 0){
            console.log("sending start game -->");
            room.send("startGame");
        }
    })

    room.onMessage("gameDetails", (message) => {
        console.log("event received for game details ->>");
        console.log(JSON.stringify(message));
    })

    room.onMessage("moveTimer", (message) => {
        console.log("received timer-> ", message);
        if (message.timeLeft == 5 && message.clientId == room.sessionId) {
            let payload = {
                index: 1
            };
            counter++;
            //room.send("newMove", payload);
        }
    })

    room.onMessage("newMove", (message) => {
        console.log("new move ->", message);
        if(message.clientId == room.sessionId){
          room.send("moveDone");
        }
    })

    room.onMessage("moveSkipped", (message) => {
        console.log("move skipped", message);
    })

    room.onMessage("destroyMoveTimer", (message) => {
        console.log("event received for destroying move timer ->", message);
    })

    room.onLeave((code) => {
        console.log(client.id, "left", room.name);
    });

    room.onError((code, message) => {
        console.log(client.id, "couldn't join", room.name);
    });

}).catch(e => {
    console.log("JOIN ERROR", e);
});
