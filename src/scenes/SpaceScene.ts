import { IDLE_AI } from "../game/AI/ai";
import { ChaserAI } from "../game/AI/ChaserAI";
import { UNIT_SCALE } from "../game/Component";
import { GameLevel } from "../game/Level";
import { newBasicEnemy } from "../game/ShipDesigns/basic";
import { SpaceShip } from "../game/SpaceShip";
import SpaceshipIntent, { EMPTY_INTENT } from "../game/SpaceshipIntent";
import { DRAW_SCALE } from "../phaser/constants";
import { LevelRenderer } from "../phaser/levelRenderer";

const GAME_SPEED = 1/100;


export default class SpaceScene extends Phaser.Scene {
    name = "SpaceScene";
    level: GameLevel;
    
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
        this.level = new GameLevel(
           newBasicEnemy(),[
             //   newBasicEnemy(),
              //  newBasicEnemy(),
               // newBasicEnemy(),
            ],
        )
        this.level.enemies.forEach(e => {
            e.position.x = Math.random() * 30 * UNIT_SCALE;
            e.position.y = Math.random() * 30 * UNIT_SCALE;
        });
    }

    preload(){
        console.log("preload");
        this.load.spritesheet('block', 'assets/components/block.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('thruster', 'assets/components/thruster.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('lateralThrusters', 'assets/components/laterialThrusters.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('engineRoom', 'assets/components/engineRoom.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('bridge', 'assets/components/bridge.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('cannon', 'assets/components/cannon.png', { frameWidth: 16, frameHeight: 16 });

        this.load.image('space1', 'assets/backgrounds/space1.jpeg');
        this.load.image('space2', 'assets/backgrounds/space2.jpeg');
        this.load.image('grid', 'assets/backgrounds/grid.png');
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

    }

    
}