import { Socket } from "socket.io";
import { UNIT_SCALE } from "../game/Component";
import { GameLevel } from "../game/Level";
import { newBasicEnemy, newPlayerShip } from "../game/ShipDesigns/basic";
import { SpaceShip } from "../game/SpaceShip";
import SpaceshipIntent from "../game/SpaceshipIntent";
import { LevelRenderer } from "../phaser/levelRenderer";
import { preload_sprites } from "./preload_sprites";
import MatchManager from "../game/matchmanager";

export const GAME_SPEED = 1/80;

export default class SpaceScene extends Phaser.Scene {
    name = "SpaceScene";
    level: GameLevel;
    
    graphics!: Phaser.GameObjects.Graphics;
    levelRenderer!: LevelRenderer;
    socket: any;
    gameId: string;
    lastDump: number|null = null;
    match: MatchManager;
    fpsText!: Phaser.GameObjects.Text;
    
    get player(): SpaceShip{
        return this.level.player;
    }

    get intent(): SpaceshipIntent{
        return this.level.playerIntent;
    }
    set intent(intent:SpaceshipIntent){
        this.level.playerIntent = intent;
    }
    
    constructor(socket: Socket, match: MatchManager){
        super({ key: "SpaceScene" });
        this.socket = socket;
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('gameId')
        if(!gameId) throw new Error("Missing gameId")
        this.gameId=gameId
        this.level = new GameLevel(
            [match.blueShip, match.redShip],
            gameId, socket
        )
        
        
        this.socket.emit(`join game`, this.gameId)
        socket.on(`game ${gameId}`, (msg)=>{
            if(!msg.dump) return
            this.level.applyDump(msg.dump)
        })
        this.match = match;
    }

    init() {
        this.level.ships[0] = this.match.blueShip;
        this.level.ships[0].level = this.level;
        this.level.ships[1] = this.match.redShip;
        this.level.ships[1].level = this.level;
        this.level.onShipsChange(this.gameId, this.socket)
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

       
        this.levelRenderer = new LevelRenderer(this.level);
        this.levelRenderer.onCreate(this)
        
        this.fpsText = this.add.text(10,10,"")
    }

    update(time: number, delta: number){
        delta *= GAME_SPEED;
        this.level.update(delta);
        this.levelRenderer.onUpdate(this, delta)
        
        this.socket.emit(`game ${this.gameId}`, {player: this.player.id, intent: {...this.player.intent}})
        if(this.lastDump === null
             || time - this.lastDump > 250
        ){
            this.lastDump = time
            this.socket.emit(`game ${this.gameId}`, {dump: this.level.dump()})
        }

        //this.fpsText.setText(`${this.game.loop.actualFps}fps`)
    }
    isHost() {
        return this.player.id === "1"
    }

}
