import { SpaceShip } from "../game/SpaceShip";
import SpaceScene from "../scenes/SpaceScene";
import {DRAW_SCALE, RAD_TO_DEG} from "./constants";

export default class ShipRenderer {
    sprites: Phaser.GameObjects.Sprite[];
    constructor(private spaceship:SpaceShip){}
    onCreate(scene: SpaceScene) {
        this.sprites = this.spaceship.components.map(()=>{
            const sprite = scene.add.sprite(this.spaceship.position.x, this.spaceship.position.y, 'spaceshipParts', 13);
            sprite.z = 0;
            sprite.setScale(0.2)
            return sprite;
        });
        this.onUpdate(scene);
    }
    onUpdate(scene: SpaceScene) {
        this.spaceship.components.forEach((component, index)=>{
            const sprite = this.sprites[index];
            const {x,y} = component.getCenterOfMassInWorldSpace(this.spaceship);
            sprite.setPosition(x * DRAW_SCALE,y * DRAW_SCALE);
            sprite.setRotation(this.spaceship.angle);
        });
    }
}