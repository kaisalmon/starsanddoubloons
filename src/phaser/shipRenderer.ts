import { CollisionAvoidanceAI, getSpaceshipRay } from "../game/AI/CollissionAvoidance";
import { polygonToLines, rectangleToPolygon } from "../game/Collision";
import Component, { UNIT_SCALE } from "../game/Component";
import { SpaceShip } from "../game/SpaceShip";
import SpaceScene from "../scenes/SpaceScene";
import {DRAW_SCALE} from "./constants";

var customRound = function(value: number, roundTo: number) {
    return Math.round(value / roundTo) * roundTo;
}
const RENDER_DEBUG_LINES = false;

export default class ShipRenderer {
    private group!: Phaser.GameObjects.Container;
    
    private crashEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private smokeEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

    get gameObject(): Phaser.GameObjects.GameObject {
        return this.group;
    }
    constructor(public spaceship:SpaceShip){}
    onCreate(scene: SpaceScene) {
        this.crashEmitter = scene.add.particles('block').createEmitter({
            speed: { min: -30, max: 30 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0.1 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            x: this.spaceship.position.x,
            y: this.spaceship.position.y,
            active: false,

        });
        this.smokeEmitter = scene.add.particles('smoke').createEmitter({
            speed: { min: -10, max: 10 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0.5},
            alpha: { start: 0.8, end: 0},
            lifespan: 3000,
            blendMode: 'SCREEN',
            x: this.spaceship.position.x,
            y: this.spaceship.position.y,
            active: false,
        });

        const spaceshipUnitSpaceCoM = this.spaceship.getCenterOfMassUnitSpace();
        this.group = scene.add.container(this.spaceship.position.x, 
            this.spaceship.position.y,
            this.spaceship.components.map((c)=>{
                const sprite = scene.add.sprite(this.spaceship.position.x, this.spaceship.position.y, c.type.appearance, 0);
                sprite.setScale(DRAW_SCALE * UNIT_SCALE / sprite.width * c.type.width, DRAW_SCALE * UNIT_SCALE / sprite.height * c.type.height);
                
                const {x,y} = c.getCoMInUnitSpace() 
                sprite.setPosition(
                    (x - spaceshipUnitSpaceCoM.x) * UNIT_SCALE * DRAW_SCALE, 
                    (y - spaceshipUnitSpaceCoM.y) * UNIT_SCALE * DRAW_SCALE
                );

                if(c.type.isFlipped) {
                    sprite.flipX = true;
                }
                return sprite;
            }));
        this.group.setZ(1)
        this.onUpdate(scene);
    }
    onUpdate(scene: SpaceScene) {
        const sprites = this.group.getAll() as Phaser.GameObjects.Sprite[]
        const spaceshipUnitSpaceCoM = this.spaceship.getCenterOfMassUnitSpace();

        this.spaceship.components.forEach((component, index)=>{
            const sprite = sprites[index];
            const damage = component.damage
            const health = component.type.health
            const dim = component.damage > 0;
            const activeSprite = component.isPowered || sprite.data?.get('isFiring');
            const spriteIndex = damage + (activeSprite ? (health + 1) : 0);
            const {x,y} = component.getCoMInUnitSpace() 
            sprite.setPosition(
                (x - spaceshipUnitSpaceCoM.x) * UNIT_SCALE * DRAW_SCALE, 
                (y - spaceshipUnitSpaceCoM.y) * UNIT_SCALE * DRAW_SCALE
            );
            sprite.setFrame(spriteIndex);
            sprite.setTint(dim ? 0xAAAAAA : 0xFFFFFF);
            sprite.setDepth(component.isDestroyed() ? -2 : 0);

            if(!this.spaceship.isDestroyed()){
                const canSmoke = component.type.isThruster || component.type.weaponType !== undefined;
                if(canSmoke && component.isDestroyed()) {
                    this.smokeEmitter.explode(1, component.getCenterOfMassInWorldSpace(this.spaceship).x * DRAW_SCALE, component.getCenterOfMassInWorldSpace(this.spaceship).y * DRAW_SCALE);
                   this.smokeEmitter.active = true;
               }
            }
        });
        
        const {x,y} = this.spaceship.position;
        this.group.setPosition(x * DRAW_SCALE,y * DRAW_SCALE);
        this.group.setRotation(this.spaceship.angle);
        this.group.setDepth(this.spaceship.isDestroyed() ? -2 : 0);
        
        if(RENDER_DEBUG_LINES)this.renderDebugLines(scene);
    }

    private renderDebugLines(scene: SpaceScene) {
        scene.graphics.lineStyle(2, 0xFF00FF, 0.5);

        const boundingBox = this.spaceship.boundingBox;
        const lines = polygonToLines(rectangleToPolygon(boundingBox));
        lines.forEach(([p1, p2]) => {
            scene.graphics.lineBetween(p1.x * DRAW_SCALE, p1.y * DRAW_SCALE, p2.x * DRAW_SCALE, p2.y * DRAW_SCALE);
        });
        if(this.spaceship.ai instanceof CollisionAvoidanceAI && this.spaceship.ai.wasRayHit){
            scene.graphics.lineStyle(4, 0xFF0000, 2.0);
        }
        const ray = getSpaceshipRay(this.spaceship);
        scene.graphics.lineBetween(ray[0].x * DRAW_SCALE, ray[0].y * DRAW_SCALE, ray[1].x * DRAW_SCALE, ray[1].y * DRAW_SCALE);
        scene.graphics.strokeCircle(this.spaceship.position.x * DRAW_SCALE, this.spaceship.position.y * DRAW_SCALE, this.spaceship.radius * DRAW_SCALE);

        scene.graphics.lineStyle(2, 0xFF44FF, 1.0);
        this.spaceship.components.forEach((component) => {
            if(!component.isCollidable()){
                return;
            }
            const lines = polygonToLines(rectangleToPolygon(component.getBoundingBox(this.spaceship)));
            lines.forEach(([p1, p2]) => {
                scene.graphics.lineBetween(p1.x * DRAW_SCALE, p1.y * DRAW_SCALE, p2.x * DRAW_SCALE, p2.y * DRAW_SCALE);
            });
        });
    }

    onComponentDestroyed(component: Component) {
        const {x,y} = component.getCenterOfMassInWorldSpace(this.spaceship);
        this.crashEmitter.active = true;
        const boundingBox = component.getBoundingBox(this.spaceship);
        const w = boundingBox.width * DRAW_SCALE;
        const h = boundingBox.height * DRAW_SCALE;
        const emitZone = new Phaser.Geom.Rectangle(-w/2, -h/2, w, h);
        this.crashEmitter.setEmitZone({source: emitZone} as any);
        this.crashEmitter.texture = component.type.appearance as any;
        const area = boundingBox.width * boundingBox.height;
        this.crashEmitter.explode(area * 50, x * DRAW_SCALE,y * DRAW_SCALE);
        
    }

    onCannonballFired(component: Component) {
        const index = this.spaceship.components.indexOf(component);
        const sprite = this.group.getAll()[index] as Phaser.GameObjects.Sprite;
        sprite.setData('isFiring', true);
        setTimeout(()=>{
            sprite.setData('isFiring', false);
        }, 100);
    }
}