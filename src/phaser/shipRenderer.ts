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
        this.sprites = this.spaceship.components.map(()=>{
            const sprite = scene.add.sprite(this.spaceship.position.x, this.spaceship.position.y, 'spaceshipParts', 59);
            sprite.z = 0;
            sprite.setScale(DRAW_SCALE * UNIT_SCALE / sprite.width)
            return sprite;
        });
        this.onUpdate(scene);
    }
    onUpdate(scene: SpaceScene) {
        this.spaceship.components.forEach((component, index)=>{
            const sprite = this.sprites[index];
            const {x,y} = component.getCenterOfMassInWorldSpace(this.spaceship);
            sprite.setPosition(x * DRAW_SCALE,y * DRAW_SCALE);
            const downscaledAngle = customRound(this.spaceship.angle, Math.PI/8)
            sprite.setRotation(downscaledAngle);
        });
    }
}