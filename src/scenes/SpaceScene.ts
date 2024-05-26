import { Socket } from "socket.io";
import { UNIT_SCALE } from "../game/Component";
import { GameLevel } from "../game/Level";
import { newBasicEnemy, newPlayerShip } from "../game/ShipDesigns/basic";
import { SpaceShip } from "../game/SpaceShip";
import SpaceshipIntent from "../game/SpaceshipIntent";
import { LevelRenderer } from "../phaser/levelRenderer";
import { preload_sprites } from "./preload_sprites";

export const GAME_SPEED = 1/80;

export default class SpaceScene extends Phaser.Scene {
    name = "SpaceScene";
    level: GameLevel;
    
    graphics!: Phaser.GameObjects.Graphics;
    levelRenderer!: LevelRenderer;
    socket: any;
    gameId: string;
    lastDump: number|null = null;
    
    get player(): SpaceShip{
        return this.level.player;
    }

    get intent(): SpaceshipIntent{
        return this.level.playerIntent;
    }
    set intent(intent:SpaceshipIntent){
        this.level.playerIntent = intent;
    }
    
    constructor(socket: Socket){
        super({ key: "SpaceScene" });
        this.socket = socket;
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('gameId')
        if(!gameId) throw new Error("Missing gameId")
        this.gameId=gameId
        this.level = new GameLevel(
            [newPlayerShip("1"), newBasicEnemy("2")],
            gameId, socket
        )
        this.level.ships.forEach(e => {
            e.position.x = Math.random() * 120 * UNIT_SCALE;
            e.position.y = Math.random() * 120 * UNIT_SCALE;
            e.angle = Math.random() * Math.PI * 2;
            e.velocity = {x:Math.sin(e.angle), y:Math.cos(e.angle)};
        });
        
        this.socket.emit(`join game`, this.gameId)
        socket.on(`game ${gameId}`, (msg)=>{
            if(!msg.dump) return
            this.level.applyDump(msg.dump)
        })

    }

    init(data: { editedShip?: SpaceShip }) {
        if (data.editedShip) {
            this.level.ships[0] = data.editedShip;
            this.level.ships[0].level = this.level;
            this.level.onShipsChange(this.gameId, this.socket)
        }
    }

    preload(){
        preload_sprites(this)
    }

    create(){
        this.input.keyboard.addKey('W').on('down', () => {
            this.intent = {...this.intent, moveForward: true}
        });
        this.input.keyboard.addKey('W').on('up', () => {
            this.intent = {...this.intent, moveForward: false}
        });
        this.input.keyboard.addKey('D').on('down', () => {
            this.intent = {...this.intent, rotateRight: true}
        });
        this.input.keyboard.addKey('D').on('up', () => {
            this.intent = {...this.intent, rotateRight: false}
        });
        this.input.keyboard.addKey('A').on('down', () => {
            this.intent = {...this.intent, rotateLeft: true}
        });
        this.input.keyboard.addKey('A').on('up', () => {
            this.intent = {...this.intent, rotateLeft: false}
        });
        this.input.keyboard.addKey('left').on('down', () => {
            this.intent = {...this.intent, fireLeft: true}
        });
        this.input.keyboard.addKey('left').on('up', () => {
            this.intent = {...this.intent, fireLeft: false}
        });
        this.input.keyboard.addKey('right').on('down', () => {
            this.intent = {...this.intent, fireRight: true}
        });
        this.input.keyboard.addKey('right').on('up', () => {
            this.intent = {...this.intent, fireRight: false}
        });
        
        this.graphics = this.add.graphics();
        this.graphics.z = 10;

        this.player.position.x = 20 * UNIT_SCALE;
        this.player.position.y = 20 * UNIT_SCALE;
        this.player.angularVelocity = 0;
       

        this.levelRenderer = new LevelRenderer(this.level);
        this.levelRenderer.onCreate(this)
    }

    update(time: number, delta: number){
        delta *= GAME_SPEED;
        this.level.update(delta);
        this.levelRenderer.onUpdate(this, delta)
        
        this.socket.emit(`game ${this.gameId}`, {player: this.player.id, intent: this.player.intent})
        if(this.lastDump === null
             || time - this.lastDump > 250
        ){
            this.lastDump = time
            this.socket.emit(`game ${this.gameId}`, {dump: this.level.dump()})
        }
    }
    isHost() {
        return this.player.id === "1"
    }

}


