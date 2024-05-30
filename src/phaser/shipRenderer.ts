import { Cameras, GameObjects } from "phaser";
import { CollisionAvoidanceAI, getSpaceshipRay } from "../game/AI/CollissionAvoidance";
import { polygonToLines, rectangleToPolygon } from "../game/Collision";
import Component, { UNIT_SCALE } from "../game/Component";
import { SHIELD_REACTIVATE_TIME, SHIELD_STAY_ACTIVE_TIME, SpaceShip } from "../game/SpaceShip";
import SpaceScene from "../scenes/SpaceScene";
import {DRAW_SCALE} from "./constants";
import { lerp } from "../game/Vector2";

const RENDER_DEBUG_LINES = false;

export default class ShipRenderer {
    private group!: Phaser.GameObjects.Container;
    private shieldSprites: Phaser.GameObjects.Sprite[] = [];
    
    private crashEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private smokeEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    scene!: SpaceScene;

    get gameObject(): Phaser.GameObjects.GameObject {
        return this.group;
    }
    constructor(public spaceship:SpaceShip){}
    onCreate(scene: SpaceScene) {
        this.scene = scene
        this.crashEmitter = scene.add.particles('block').createEmitter({
            speed: { min: -30, max: 30 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0.1 },
            alpha: { start: 1, end: 0 },
            frame: this.spaceship.id == "1" ? 0 : 2,
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

                if(c.isFlipped) {
                    sprite.flipX = true;
                }
                return sprite;
            }));
        const maxShields = this.spaceship.components.filter(c => c.type.shieldRadius > 0).length;
        for (let i = 0; i < maxShields; i++) {
            this.addShieldFlyweight(scene);
        }

        this.onUpdate(scene);
        this.group.setZ(1)
        this.onUpdate(scene);
    }
    private addShieldFlyweight(scene: SpaceScene) {
        const shieldSprite = scene.add.sprite(0, 0, "shieldfx");
        shieldSprite.setVisible(false);
        this.shieldSprites.push(shieldSprite);
        console.log("Adding flyweight", shieldSprite)
        shieldSprite.setDepth(11)
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
            const red = component.spaceship.id==="2"
            const spriteIndex = damage + (activeSprite ? (health + 1) : 0) + (red ? 2*(health + 1): 0);
            
            sprite.setFrame(spriteIndex);
            const {x,y} = component.getCoMInUnitSpace() 
            sprite.setPosition(
                (x - spaceshipUnitSpaceCoM.x) * UNIT_SCALE * DRAW_SCALE, 
                (y - spaceshipUnitSpaceCoM.y) * UNIT_SCALE * DRAW_SCALE
            );
            sprite.setTint(dim ? 0xAAAAAA : 0xFFFFFF);
            sprite.setDepth(component.isDestroyed() ? -2 : 0);
            

            if (!component.isDestroyed() && component.invTime) {
                // Make the component flash during invincibility frames
                const elapsed = scene.time.now - component.invTime;
                const flashDuration = 100; // Adjust the flash duration as needed
                const isFlashVisible = Math.floor(elapsed / flashDuration) % 2 === 0;
                sprite.setVisible(isFlashVisible);
            } else {
                sprite.setVisible(true);
            }

            if(!this.spaceship.isDestroyed()){
                const canSmoke = component.type.isThruster || component.type.weaponType !== undefined;
                if(canSmoke && component.isDestroyed()) {
                    this.smokeEmitter.explode(1, component.getCenterOfMassInWorldSpace().x * DRAW_SCALE, component.getCenterOfMassInWorldSpace().y * DRAW_SCALE);
                   this.smokeEmitter.active = true;
               }
            }
        });

        const shields = this.spaceship.getShields(true);
        for (let i = 0; i < shields.length; i++) {
            if(i>this.shieldSprites.length){
                this.addShieldFlyweight(this.scene)
            }
            const shieldSprite = this.shieldSprites[i];
            const shield = shields[i];

            shieldSprite.setVisible(true);
            shieldSprite.setScale(
                (shield.type.shieldRadius * 2 * UNIT_SCALE * DRAW_SCALE) / shieldSprite.width,
                (shield.type.shieldRadius * 2 * UNIT_SCALE * DRAW_SCALE) / shieldSprite.height
            );
            shieldSprite.setPosition(
                shield.getCenterOfMassInWorldSpace().x * DRAW_SCALE,
                shield.getCenterOfMassInWorldSpace().y * DRAW_SCALE
            );
            const timeSinceShieldsHit= this.spaceship.timeSinceShieldsHit()
            const shieldBright = timeSinceShieldsHit && timeSinceShieldsHit < SHIELD_REACTIVATE_TIME
            shieldSprite.setFrame(shieldBright ? 1 : 0)
            if(shield.isPowered){
                shieldSprite.setAlpha(lerp(shieldSprite.alpha, 1, 0.2))
            }else{
                shieldSprite.setAlpha(lerp(shieldSprite.alpha, 0, 0.1))
            }
        }
        
        const {x,y} = this.spaceship.position;
        this.group.setPosition(x * DRAW_SCALE,y * DRAW_SCALE);
        this.group.setRotation(this.spaceship.angle);
        this.group.setDepth(this.spaceship.isDestroyed() ? -2 : 0);
        
        if(RENDER_DEBUG_LINES)this.renderDebugLines(scene);

    }



    private renderDebugLines(scene: SpaceScene) {
   
        if(this.spaceship.ai instanceof CollisionAvoidanceAI && this.spaceship.ai.wasRayHit){
            scene.graphics.lineStyle(4, 0xFF0000, 2.0);
            const ray = getSpaceshipRay(this.spaceship);
            scene.graphics.lineBetween(ray[0].x * DRAW_SCALE, ray[0].y * DRAW_SCALE, ray[1].x * DRAW_SCALE, ray[1].y * DRAW_SCALE);
            scene.graphics.strokeCircle(this.spaceship.position.x * DRAW_SCALE, this.spaceship.position.y * DRAW_SCALE, this.spaceship.radius * DRAW_SCALE);

            scene.graphics.lineStyle(2, 0xFF44FF, 1.0);
        }

       
        scene.graphics.lineStyle(4, 0xFF0000);
        this.spaceship.components.forEach((component) => {
            if(!component.isCollidable()){
                return;
            }
            const lines = polygonToLines(rectangleToPolygon(component.getBoundingBox()));
            lines.forEach(([p1, p2]) => {
                scene.graphics.lineBetween(p1.x * DRAW_SCALE, p1.y * DRAW_SCALE, p2.x * DRAW_SCALE, p2.y * DRAW_SCALE);
            });
        }); 
        scene.graphics.lineStyle(2, 0xFFffFF);
        const bb = this.spaceship.boundingBox
        const bbLines = polygonToLines(rectangleToPolygon(bb));
        bbLines.forEach(([p1, p2]) => {
            scene.graphics.lineBetween(p1.x * DRAW_SCALE, p1.y * DRAW_SCALE, p2.x * DRAW_SCALE, p2.y * DRAW_SCALE);
        });
   

    }

    onComponentDestroyed(component: Component) {
        const {x,y} = component.getCenterOfMassInWorldSpace();
        this.crashEmitter.active = true;
        const boundingBox = component.getBoundingBox();
        const w = boundingBox.width * DRAW_SCALE;
        const h = boundingBox.height * DRAW_SCALE;
        const emitZone = new Phaser.Geom.Rectangle(-w/2, -h/2, w, h);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.crashEmitter.setEmitZone({source: emitZone} as any);
        const area = boundingBox.width * boundingBox.height;
        this.crashEmitter.explode(area * 50, x * DRAW_SCALE,y * DRAW_SCALE);
        
    }

    onCannonballFired(component: Component) {
        const index = this.spaceship.components.indexOf(component);
        const sprite = this.group.getAll()[index] as Phaser.GameObjects.Sprite;
        if(sprite){
            sprite.setData('isFiring', true);
            setTimeout(()=>{
                sprite.setData('isFiring', false);
            }, 300);
        }
    }
}
