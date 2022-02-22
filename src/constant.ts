export const BLOWFISH_SECRET_KEY = "ewar@2020_Super_Key";

let getBattleDataUrl;
let publishResultUrl;
let userDetailsUrl;
if (process.env.NODE_PORT == "prod") {
    getBattleDataUrl = 'https://v2.api.ewar.in/live/api/ewar/battle/';
    publishResultUrl = 'https://v2.api.ewar.in/live/api/ewar/result';
    userDetailsUrl = 'https://v2.api.ewar.in/live/api/ewar/user/';
}
else {
    getBattleDataUrl = 'https://stagingv2.ewar.in/live/api/ewar/battle/';
    publishResultUrl = 'https://stagingv2.ewar.in/live/api/ewar/result';
    userDetailsUrl = 'https://stagingv2.ewar.in/live/api/:provider/user/';
}

export const url = {
    getBattleDataUrl: getBattleDataUrl,
    publishResultUrl: publishResultUrl
}

export const sendEvents = {
   ROOM_FILLED: "roomFilled",
   GAME_DETAILS: "gameDetails",
   MOVE_TIMER: "moveTimer", 
   NEW_MOVE: "newMove",
   GAME_OVER: "gameOver",
   START_TIMER: "startTimer",
   MOVE_SKIPPED: "moveSkipped",
   DESTROY_MOVE_TIMER: "destroyMoveTimer",
   MOVE_SYNC: "moveSync",
   RECONNECTION_DATA: "reconnectionData",
};

export const receivedEvents = {
    GET_GAME_DETAILS: "getGameDetails",
    NEW_MOVE: "newMove",
    START_SKIP_TIMER: "startSkipTimer",
    START_GAME: "startGame",
    MOVE_DONE: "moveDone",
    SEND_RECONNECTION_DATA: "sendReconnectionData",
    GAME_LEAVE_REQUEST: "gameLeaveRequest",
}