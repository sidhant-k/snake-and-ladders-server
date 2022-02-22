import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Player extends Schema {
    @type("string") userId: string;
    @type("number") position: number = 1;
    @type("number") score: number = 1;  
    @type("number") canSkip: number = 3;
    @type(["number"]) totalMoves = new ArraySchema<number>();
    @type(["number"]) usedMoves = new ArraySchema<number>();
}

export class State extends Schema {
    @type({ map: Player }) players = new MapSchema<Player>();
    @type("number") boardIndex: number;
}