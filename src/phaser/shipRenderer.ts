import { UNIT_SCALE } from "../game/Component";
import { SpaceShip } from "../game/SpaceShip";
import SpaceScene from "../scenes/SpaceScene";
import {DRAW_SCALE, RAD_TO_DEG} from "./constants";

var customRound = function(value, roundTo) {
    return Math.round(value / roundTo) * roundTo;
}

export default class ShipRenderer {
    sprites: Phaser.GameObjects.Sprite[];
    constructor(private spaceship:SpaceShip){}
    onCreate(scene: SpaceScene) {
        this.sprites = this.spaceship.components.map((c)=>{
            const sprite = scene.add.sprite(this.spaceship.position.x, this.spaceship.position.y, c.type.appearance, 0);
            sprite.z = 0;
            sprite.setScale(DRAW_SCALE * UNIT_SCALE / sprite.width * c.type.width, DRAW_SCALE * UNIT_SCALE / sprite.height * c.type.height);
            if(c.type.isFlipped) {
                sprite.flipX = true;
            }
            return sprite;
        }); 
        this.onUpdate(scene);
    }
    onUpdate(scene: SpaceScene) {
        this.spaceship.components.forEach((component, index)=>{
            const sprite = this.sprites[index];
            const spriteIndex = component.isPowered ? 1 : 0;
            sprite.setFrame(spriteIndex);
            const {x,y} = component.getCenterOfMassInWorldSpace(this.spaceship);
            sprite.setPosition(x * DRAW_SCALE,y * DRAW_SCALE);
          //  const downscaledAngle = customRound(this.spaceship.angle, Math.PI/8)
            sprite.setRotation(this.spaceship.angle);
        });
    }
}