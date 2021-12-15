import { polygonToLines, rectangleToPolygon } from "../game/Collision";
import { UNIT_SCALE } from "../game/Component";
import { SpaceShip } from "../game/SpaceShip";
import SpaceScene from "../scenes/SpaceScene";
import {DRAW_SCALE, RAD_TO_DEG} from "./constants";

var customRound = function(value, roundTo) {
    return Math.round(value / roundTo) * roundTo;
}
const RENDER_DEBUG_LINES = false;

export default class ShipRenderer {
    sprites: Phaser.GameObjects.Sprite[];
    constructor(private spaceship:SpaceShip){}
    onCreate(scene: SpaceScene) {
        this.sprites = this.spaceship.components.map((c)=>{
            const sprite = scene.add.sprite(this.spaceship.position.x, this.spaceship.position.y, c.type.appearance, 0);
            sprite.z = -1;
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
        
        if(RENDER_DEBUG_LINES)this.renderDebugLines(scene);
    }

    private renderDebugLines(scene: SpaceScene) {
        scene.graphics.lineStyle(2, 0xFF00FF, 0.5);

        const boundingBox = this.spaceship.boundingBox;
        const lines = polygonToLines(rectangleToPolygon(boundingBox));
        lines.forEach(([p1, p2]) => {
            scene.graphics.lineBetween(p1.x * DRAW_SCALE, p1.y * DRAW_SCALE, p2.x * DRAW_SCALE, p2.y * DRAW_SCALE);
        });

        scene.graphics.lineStyle(2, 0xFF44FF, 1.0);
        this.spaceship.components.forEach((component) => {
            const lines = polygonToLines(rectangleToPolygon(component.getBoundingBox(this.spaceship)));
            lines.forEach(([p1, p2]) => {
                scene.graphics.lineBetween(p1.x * DRAW_SCALE, p1.y * DRAW_SCALE, p2.x * DRAW_SCALE, p2.y * DRAW_SCALE);
            });
        });
    }
}