import Component, { UNIT_SCALE } from "../game/Component";
import { block, leftWing, rightWing } from "../game/Component/ComponentType";
import { SpaceShip } from "../game/SpaceShip";
import SpaceshipIntent from "../game/SpaceshipIntent";

const GAME_SPEED = 1/1000;

const DRAW_SCALE = 15/UNIT_SCALE;

export default class SpaceScene extends Phaser.Scene {
    name = "SpaceScene";
    player: SpaceShip;
    intent: SpaceshipIntent = {
        moveForward: false,
        rotateLeft: false,
        rotateRight: false
    }
    playerSprite: Phaser.GameObjects.Sprite;
    graphics: Phaser.GameObjects.Graphics;
    
    constructor(){
        super({ key: "SpaceScene" });
        this.player = new SpaceShip([
            new Component(block, {x: 0, y: 1}),
            new Component(block, {x: 0, y: 0}),
            new Component(leftWing, {x: -2, y: 0}),
            new Component(rightWing, {x: 1, y: 0}),
        ])
    }

    preload(){
        console.log("preload");
        this.load.spritesheet('spaceshipParts', 'assets/kenney_scribbleplatformer/Spritesheet/spritesheet_retina.png', { frameWidth: 128, frameHeight: 128 });

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
        this.player.position.x = 5 * UNIT_SCALE;
        this.player.position.y = 5 * UNIT_SCALE;
        this.player.angle = Math.PI / 4;
        this.player.angularVelocity = 0;
        this.playerSprite = this.add.sprite(this.player.position.x, this.player.position.y, 'spaceshipParts', 14);
        this.playerSprite.setScale(0);
        this.playerSprite.z = 0;
        
    }

    update(time: number, delta: number){
        delta *= GAME_SPEED;
        this.player.update(this.intent, delta);
        this.playerSprite.x = this.player.position.x;
        this.playerSprite.y = this.player.position.y;
        this.playerSprite.rotation = Math.PI + this.player.angle;

        this.graphics.clear();

        //  Debug lines
    
        this.graphics.fillStyle(0xff0000, 1);
        for(let component of this.player.components){
            const {x,y} = component.getCenterOfMassInWorldSpace(this.player);
            this.graphics.fillCircle(x * DRAW_SCALE, y * DRAW_SCALE, component.width / 2 * UNIT_SCALE * DRAW_SCALE);
        }
        /*
        this.graphics.lineStyle(1, 0x00ff00, 1);
        for(let component of this.player.components){
            const {x,y} = component.getCenterOfMassInWorldSpace(this.player);
            const velocity = component.getEffectiveVelocity(this.player);
            this.graphics.lineBetween(
                x, y, x+velocity.x * 1, y+velocity.y * 1
            )
        }
        */
        this.graphics.lineStyle(3, 0xffffff, 1);
        for(let component of this.player.components){
            const {x,y} = this.player.position;
            const force = component.getTotalForce(this.intent, this.player);
            const F_SCALE = 0.3;
            this.graphics.lineBetween(
                (x + force.offsetX) * DRAW_SCALE, (y + force.offsetY) * DRAW_SCALE,
                (x + force.offsetX + force.x * F_SCALE) * DRAW_SCALE, (y + force.offsetY + force.y * F_SCALE) * DRAW_SCALE
            )
        }
        this.graphics.fillStyle(0xffff00, 1);
        this.graphics.fillCircle(this.player.position.x * DRAW_SCALE, this.player.position.y * DRAW_SCALE, 10);
    }

    
}