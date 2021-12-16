import { ChaserAI } from "../game/AI/ChaserAI";
import { UNIT_SCALE } from "../game/Component";
import { initLevel, Level, updateLevel } from "../game/Level";
import { newBasicEnemy } from "../game/ShipDesigns/basic";
import { SpaceShip } from "../game/SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "../game/SpaceshipIntent";
import { LevelRenderer } from "../phaser/levelRenderer";

const GAME_SPEED = 1/100;


export default class SpaceScene extends Phaser.Scene {
    name = "SpaceScene";
    level: Level;
    
    graphics: Phaser.GameObjects.Graphics;
    ai: ChaserAI;
    levelRenderer: LevelRenderer;
    
    get player(): SpaceShip{
        return this.level.player;
    }

    get intent(): SpaceshipIntent{
        return this.level.playerIntent;
    }
    
    constructor(){
        super({ key: "SpaceScene" });
        this.level = {
            player: newBasicEnemy(),
            playerIntent: {...EMPTY_INTENT},
            enemies: [
                newBasicEnemy(),
            ],
        }
        this.level.enemies[0].position.x = 30 * UNIT_SCALE;
        this.level.enemies[0].position.y = 30 * UNIT_SCALE;
        initLevel(this.level);
    }

    preload(){
        console.log("preload");
        this.load.spritesheet('block', 'assets/components/block.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('thruster', 'assets/components/thruster.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('lateralThrusters', 'assets/components/laterialThrusters.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('engineRoom', 'assets/components/engineRoom.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('bridge', 'assets/components/bridge.png', { frameWidth: 32, frameHeight: 32 });
    }

    create(){
        this.input.keyboard.addKey('W').on('down', () => this.intent.moveForward = true);
        this.input.keyboard.addKey('W').on('up', () => this.intent.moveForward = false);
        this.input.keyboard.addKey('A').on('down', () => this.intent.rotateLeft = true);
        this.input.keyboard.addKey('A').on('up', () => this.intent.rotateLeft = false);
        this.input.keyboard.addKey('D').on('down', () => this.intent.rotateRight = true);
        this.input.keyboard.addKey('D').on('up', () => this.intent.rotateRight = false);

        this.graphics = this.add.graphics();
        this.graphics.z = 10;

        console.log("CREATE")
        this.player.position.x = 20 * UNIT_SCALE;
        this.player.position.y = 20 * UNIT_SCALE;
        this.player.angularVelocity = 0;
       
        
        this.levelRenderer = new LevelRenderer(this.level);
        this.levelRenderer.onCreate(this)
    }

    update(time: number, delta: number){
        delta *= GAME_SPEED;
        updateLevel(this.level, delta);
        this.levelRenderer.onUpdate(this)
    }

    
}