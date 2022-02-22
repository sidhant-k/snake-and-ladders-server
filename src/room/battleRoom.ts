import { Room, Client, ServerError, Delayed } from "colyseus";
import axios from "axios";
import { State, Player } from "./schema/roomState";
import { url, sendEvents, receivedEvents } from "../constant";
import { allBoards } from "../allBoards";
import { publishResult } from "./publishResult";

const baseNumberArray = [6, 6, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 1, 1];
// const snakeMap = new Map();
// const ladderMap = new Map();
// let snake = [];
// let ladder = [];

export class battleRoom extends Room<State> {

    private moveTimer!: Delayed;
    private moveCounter: number = 11;
    private totalMovesTaken = 0;
    private joinTimer!: Delayed;
    private joinCounter: number = 3;
    private joinFlag: number = 0;
    private startGameCount = 0;
    private snakeMap = new Map();
    private ladderMap = new Map();
    private snake = [];
    private ladder = [];
    private moveLock: number = 0;
    private onFindWinnerFlag: number = 0;
    private winnerFlag: number = 0;

    onGameDetails(client: Client) {
        let player = this.state.players.get(`${client.id}`);
        // for (let [key, value] of snakeMap) {
        //     snake.push(key);
        //     snake.push(value);
        // }

        // for (let [key, value] of ladderMap) {
        //     ladder.push(key);
        //     ladder.push(value);
        // }

        let payload = {
            snake: this.snake,
            ladder: this.ladder,
            totalMoves: player.totalMoves,
            position: player.position
        }
        console.log("sending game details to: ", client.id, this.snake, this.ladder);
        console.log("total moves: ");
        for (let index = 0; index < player.totalMoves.length; index++) {
            console.log(player.totalMoves[index]);
        }
        client.send(sendEvents.GAME_DETAILS, payload);
    }

    onStartGame(client: Client) {
        console.log("event received for start game 2 -->")
        this.startGameCount++;
        if (this.startGameCount == this.maxClients) {
            this.onStartSkipTimer(client.id)
        }
    }

    onStartSkipTimer(clientId: any) {
        console.log("event received for start skip timer: ->", clientId);
        this.totalMovesTaken++;
        this.moveLock = 0;

        this.moveTimer = this.clock.setInterval(() => {
            this.moveCountDownTimer(clientId);
        }, 1000);
    }

    moveCountDownTimer(clientId: any) {
        try {
            if (this.moveCounter >= 0) {
                this.broadcast(sendEvents.MOVE_TIMER, { clientId: clientId, timeLeft: this.moveCounter, maxTime: 10 });
            }
            else if (this.moveCounter <= -1 && this.moveTimer) {
                if (this.moveTimer) {
                    this.moveTimer.clear();
                }

                let player = this.state.players.get(`${clientId}`);
                player.canSkip--;
                let move = player.totalMoves.shift();
                player.usedMoves.push(move);

                let payload = {
                    clientId: clientId,
                    canSkip: player.canSkip,
                    totalMoves: player.totalMoves,
                    usedMoves: player.usedMoves
                }
                this.broadcast(sendEvents.MOVE_SKIPPED, payload);

                let opponentClientId;

                this.state.players.forEach((value, key) => {
                    if (clientId != key) {
                        opponentClientId = key;
                    }
                })
                if (player.canSkip == 0) {
                    this.broadcast(sendEvents.GAME_OVER);
                    this.onFindWinnerFlag = 1; 
                    let opponentPlayer = this.state.players.get(`${opponentClientId}`);

                    player.position = 0;
                    let result = {
                        "battleId": `${this.roomId}`,
                        "result": [
                            {
                                "id": player.userId,
                                "score": player.position
                            },
                            {
                                "id": opponentPlayer.userId,
                                "score": opponentPlayer.position
                            }
                        ]
                    }
                    console.log("result for publish-->> ", result);
                    publishResult(result);
                    this.clock.setTimeout(() => {
                        this.disconnect();
                    }, 2000);
                }
                else if (player.canSkip > 0) {
                    this.moveCounter = 12; // to tackle 1 second latency in skipping chance
                    this.onStartSkipTimer(opponentClientId);
                }
            }
            this.moveCounter--;
        } catch (error) {
            console.log(error);
        }
    }

    onNewMove(client: Client, payload: any) {
        try {
            if (this.moveLock == 0) {
                this.moveLock = 1;
                let player = this.state.players.get(`${client.id}`);
                console.log("event received for new move ->", client.id, payload);
                if (this.moveTimer) {
                    this.moveTimer.clear();
                }
                this.broadcast(sendEvents.DESTROY_MOVE_TIMER, { clientId: client.id });
                let opponentClientId;

                this.state.players.forEach((value, key) => {
                    if (client.id != key) {
                        opponentClientId = key;
                    }
                })
                let opponentPlayer = this.state.players.get(`${opponentClientId}`);
                let windowIndex = payload.index;
                //let player = this.state.players.get(`${client.id}`);
                if (player.totalMoves.length >= 1 && player.position < 100) {
                    let move = player.totalMoves.at(windowIndex);
                    player.totalMoves.splice(windowIndex, 1);
                    player.usedMoves.push(move);

                    let direction = 0;
                    let snlNumber = 0;
                    if (player.position + move <= 100) {
                        console.log("under   100");
                        player.position = player.position + move;
                    }

                    let payload = {
                        clientId: client.id,
                        direction: direction,
                        newPosition: player.position,
                        playValue: move,
                        snlNumber: snlNumber
                    }
                    console.log("broadcasting new move-->>", payload);
                    this.broadcast(sendEvents.NEW_MOVE, payload);
                    console.log("total moves left: ", client.id);
                    for (let index = 0; index < player.totalMoves.length; index++) {
                        console.log(player.totalMoves[index]);
                    }

                    if ((player.position == 100 || opponentPlayer.position == 100) && (this.totalMovesTaken % 2 == 0)) {
                        this.winnerFlag = 1;
                    }
                    else if (player.totalMoves.length == 0 && opponentPlayer.totalMoves.length == 0) {
                        this.winnerFlag = 1;
                    }

                    if (this.winnerFlag == 1) {
                        if (this.moveTimer) {
                            this.moveTimer.clear();
                        }
                        this.onFindWinnerFlag = 1;
                        let result = {
                            "battleId": `${this.roomId}`,
                            "result": [
                                {
                                    "id": player.userId,
                                    "score": player.position
                                },
                                {
                                    "id": opponentPlayer.userId,
                                    "score": opponentPlayer.position
                                }
                            ]
                        }
                        console.log("result for publish-->> ", result);
                        this.clock.setTimeout(() => {
                            this.disconnect();
                        }, 2000);
                        publishResult(result);
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    onMoveDone(client: Client) {
        try {
            console.log('event received for move done --->>', client.id);
            let player = this.state.players.get(`${client.id}`);
            let direction = 0;
            let snlNumber = 0;

            if (this.snakeMap.get(player.position)) {
                player.position = this.snakeMap.get(player.position);
                direction = 1;
                for (let index = 0; index < this.snake.length; index++) {
                    if (this.snake[index] == player.position) {
                        snlNumber = index;
                        break;
                    }
                }
            }
            else if (this.ladderMap.get(player.position)) {
                player.position = this.ladderMap.get(player.position);
                direction = 2;
                for (let index = 0; index < this.ladder.length; index++) {
                    if (this.ladder[index] == player.position) {
                        snlNumber = index;
                        break;
                    }
                }
            }

            if (direction == 1 || direction == 2) {

                let payload = {
                    clientId: client.id,
                    direction: direction,
                    newPosition: player.position,
                    playValue: 0,
                    snlNumber: snlNumber
                }
                console.log("broadcasting new move-->>", payload);
                this.broadcast(sendEvents.NEW_MOVE, payload);
            }
            else {
                let payload = {
                    totalMoves: player.totalMoves,
                    usedMoves: player.usedMoves
                }
                client.send(sendEvents.MOVE_SYNC, payload);

                let opponentClientId;

                this.state.players.forEach((value, key) => {
                    if (client.id != key) {
                        opponentClientId = key;
                    }
                })
                this.moveCounter = 11; // to tackle 1 second latency in skipping chance
                if (this.winnerFlag == 0) {
                    this.onStartSkipTimer(opponentClientId);
                }
                else if(this.winnerFlag == 1){
                    this.broadcast(sendEvents.GAME_OVER);
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    onCreate(options: any) {
        this.maxClients = 2;
        this.setState(new State());
        console.log("GAME ROOM CREATED WITH OPTIONS", options);
        this.roomId = options["battleId"];
        console.log("now room id is: ", this.roomId);

        this.onMessage("*", (client, message, payload) => {
            //console.log("all message -> ", message, "payload-> ", payload);
            switch (message) {
                case receivedEvents.GET_GAME_DETAILS: {
                    this.onGameDetails(client);
                    break;
                }
                case receivedEvents.MOVE_DONE: {
                    this.onMoveDone(client);
                    break;
                }
                case receivedEvents.NEW_MOVE: {
                    this.onNewMove(client, payload);
                    break;
                }
                case receivedEvents.START_GAME: {
                    console.log("event received for start game -->>");
                    this.onStartGame(client);
                    break;
                }
                case receivedEvents.SEND_RECONNECTION_DATA: {
                    console.log("receieved send reconnection event --->>>");
                    let player = this.state.players.get(`${client.id}`);

                    let opponentPlayer;
                    this.state.players.forEach((value, key) => {
                        if (client.id != key) {
                            opponentPlayer = this.state.players.get(`${key}`);
                        }
                    })

                    let payload = {
                        snake: this.snake,
                        ladder: this.ladder,
                        totalMoves: player.totalMoves,
                        usedMoves: player.usedMoves,
                        position: player.position,
                        skipLeft: player.canSkip,
                        opponentPosition: opponentPlayer.position,
                        opponentSkipLeft: opponentPlayer.canSkip
                    };
                    console.log("sending reconnection data---->>>", payload);
                    client.send(sendEvents.RECONNECTION_DATA, payload);
                    break;
                }
                case receivedEvents.GAME_LEAVE_REQUEST: {
                    this.onFindWinner(client);
                    break;
                }
                // default: {
                //     client.send(events.unknownEventReceived);
                //     break;
                // }
            }
        })
    }

    async onAuth(client: Client, options: any) {
        console.log("on auth user id->", options["userId"]);
        if (options["userId"]) {
            try {
                let userData;
                let response = await axios.get(`${url.getBattleDataUrl}${this.roomId}`)
                console.log("userData -->>", response.data);
                let users = response.data.result.players;
                for (let index = 0; index < users.length; index++) {
                    if (options["userId"] == users[index].id) {
                        //console.log("userId found in auth-->", users[index].id);
                        userData = users[index];
                    }
                }
                if (userData) {
                    return users;
                }
                else {
                    return false;
                }
            } catch (error) {
                throw new ServerError(500, 'Something went wrong!');
            }
        }
        else {
            throw new ServerError(400, "no userId provided");
        }
    }

    onJoin(client: Client, options: any, auth: any) {
        //console.log("auth->", auth);
        console.log("JOINED GAME ROOM:", client.sessionId, "on roomId: ", this.roomId);
        try {
            this.state.players.set(client.id, new Player());
            let player = this.state.players.get(`${client.id}`);
            player.userId = options["userId"];

            baseNumberArray.sort(() => Math.random() - 0.5);
            baseNumberArray.forEach(element => {
                player.totalMoves.push(element);
            });

            if (this.clients.length == this.maxClients) {
                //console.log("battle data-->>",JSON.stringify(response.data));
                let randomBoardIndex = Math.floor(Math.random() * allBoards.Boards.length);
                console.log("board index -->", randomBoardIndex);
                this.state.boardIndex = randomBoardIndex;

                for (let snakeIndex = 0; snakeIndex < allBoards.Boards[this.state.boardIndex].TSnakes; snakeIndex++) {
                    this.snakeMap.set(allBoards.Boards[this.state.boardIndex].Type[0].SnakesOBJ[snakeIndex].start, allBoards.Boards[this.state.boardIndex].Type[0].SnakesOBJ[snakeIndex].end);
                    this.snake.push(allBoards.Boards[this.state.boardIndex].Type[0].SnakesOBJ[snakeIndex].start);
                    this.snake.push(allBoards.Boards[this.state.boardIndex].Type[0].SnakesOBJ[snakeIndex].end);
                }

                for (let ladderIndex = 0; ladderIndex < allBoards.Boards[this.state.boardIndex].TLadder; ladderIndex++) {
                    this.ladderMap.set(allBoards.Boards[this.state.boardIndex].Type[1].LadderOBJ[ladderIndex].start, allBoards.Boards[this.state.boardIndex].Type[1].LadderOBJ[ladderIndex].end);
                    this.ladder.push(allBoards.Boards[this.state.boardIndex].Type[1].LadderOBJ[ladderIndex].start);
                    this.ladder.push(allBoards.Boards[this.state.boardIndex].Type[1].LadderOBJ[ladderIndex].end);
                }

                // for (let [key, value] of snakeMap) {
                //     snake.push(key);
                //     snake.push(value);
                // }

                // for (let [key, value] of ladderMap) {
                //     ladder.push(key);
                //     ladder.push(value);
                // }

                let payload = {
                    battleData: auth,
                }
                this.broadcast(sendEvents.ROOM_FILLED, payload);

                this.joinTimer = this.clock.setInterval(() => {
                    this.joinCountDownTimer(payload);
                }, 1000);
            }
        } catch (error) {
            throw new ServerError(500, 'Something went wrong!');
        }
    }

    joinCountDownTimer(payload: any) {
        if (this.joinCounter >= 0) {
            this.broadcast(sendEvents.START_TIMER, { timeLeft: this.joinCounter });
            if (this.joinCounter == 1) {
                this.joinFlag = 1;
            }
        }
        else {
            if (this.joinTimer) {
                this.joinFlag = 1;
                this.joinTimer.clear();
                this.joinCounter = 3;
            }
        }
        this.joinCounter--;
    }

    onFindWinner(client: Client) {
        try {
            if (this.onFindWinnerFlag == 0) {
                this.onFindWinnerFlag = 1;
                console.log("on find winner called-->>");
                let losePlayer = this.state.players.get(`${client.id}`);
                losePlayer.position = 0;
                let winPlayer;
                let winnerClientId;
                this.state.players.forEach((value, key) => {
                    if (client.id != key) {
                        winPlayer = this.state.players.get(`${key}`);
                        winnerClientId = key;
                    }
                })

                let result = {
                    "battleId": `${this.roomId}`,
                    "result": [
                        {
                            "id": winPlayer.userId,
                            "score": winPlayer.position
                        },
                        {
                            "id": losePlayer.userId,
                            "score": losePlayer.position
                        }
                    ]
                }
                console.log("result for publish-->", result);
                this.broadcast(sendEvents.GAME_OVER)
                this.clock.setTimeout(() => {
                    this.disconnect();
                }, 1000)
                publishResult(result);
            }
        } catch (error) {
            console.log(error);
        }
    }

    async onLeave(client: Client, consented: boolean) {
        console.log("user leaved", client.sessionId, consented);
        try {
            console.log("not consented leave waiting for reconnection -->>>>> ");
            //this.broadcast(events.gameFreeze);
            await this.allowReconnection(client, 20);
            //this.broadcast(events.gameRestart);
        } catch (e) {
            // 20 seconds expired. let's remove the client.
            this.onFindWinner(client);
        }
    }

    onDispose() {
        console.log("room disposed");
    }

};