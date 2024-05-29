

import { CANNONBALL_AGE } from "../game/Cannonball";
import { MOMENTUM_TO_DAMAGE, polygonToLines, rectangleToPolygon } from "../game/Collision";
import { UNIT_SCALE } from "../game/Component";
import { GameLevel } from "../game/Level";
import { getMagnitude, lerp, lerpAngle, normalizeAngle } from "../game/Vector2";
import SpaceScene from "../scenes/SpaceScene";
import { DRAW_SCALE } from "./constants";
import ShipRenderer from "./shipRenderer";

type ScrollLayer = {
    image: Phaser.GameObjects.TileSprite;
    scrollSpeed: number;
}

const lOOKAHEAD_SCALE = 3 * UNIT_SCALE * DRAW_SCALE;
const LOOKAHEAD_EXP = 2;

export class LevelRenderer{
    shipRenderers: ShipRenderer[]

    backgroundLayers: ScrollLayer[] = [];

    cannonballSprites: Phaser.GameObjects.Sprite[] = [];
    
    private desiredZoom = 0.8;
    fireEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;


    constructor(private level: GameLevel){
        this.shipRenderers = level.ships.map(ship => new ShipRenderer(ship));
    }
    onCreate(scene: SpaceScene) {
        this.shipRenderers.forEach(renderer => renderer.onCreate(scene));
        const width = Math.max(scene.scale.width, scene.scale.height);
        const height = width;
    
        this.backgroundLayers.push({
            image: scene.add.tileSprite(0, 0, width*4, height*4, 'space1')
                .setScrollFactor(0)
                .setDepth(-10),
            scrollSpeed: 0.1
        })
        this.backgroundLayers.push({
            image: scene.add.tileSprite(0, 0, width*4, height*4, 'space2')
                .setScrollFactor(0)
                .setBlendMode('SCREEN')
                .setAlpha(0.5)
                .setDepth(-9),
            scrollSpeed: 0.5
        })

        this.backgroundLayers.push({
            image: scene.add.tileSprite(0, 0, width*4, height*4, 'grid')
                .setScrollFactor(0)
                .setBlendMode('SCREEN')
                .setAlpha(0.1)
                .setTileScale(0.3,0.3)
                .setDepth(-8),
            scrollSpeed: 0.95/0.3
        })

        const crashEmitter = scene.add.particles('block').createEmitter({
            speed: { min: -300, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'SCREEN',
            lifespan: 300,
            x: this.level.player.position.x,
            y: this.level.player.position.y,
            active: false,
        });
        this.fireEmitter = scene.add.particles('cannonball').createEmitter({
            speed: { min: -300, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'SCREEN',
            lifespan: 300,
            x: this.level.player.position.x,
            y: this.level.player.position.y,
            active: false,
        });
        
        this.level.addEventListener('collision', ([_a,_b, collision])=>{
            const {x,y} = collision.position;
            crashEmitter.active = true;
            if(collision.momentum > MOMENTUM_TO_DAMAGE){
                crashEmitter.setSpeed({min: -300, max: 300})
                crashEmitter.explode(100, x * DRAW_SCALE, y * DRAW_SCALE);
            }else if(collision.momentum > MOMENTUM_TO_DAMAGE / 3){
                crashEmitter.setSpeed({min: -150, max: 150})
                crashEmitter.explode(75, x * DRAW_SCALE, y * DRAW_SCALE);
            }else{
                crashEmitter.setSpeed({min: -50, max: 50})
                crashEmitter.explode(10, x * DRAW_SCALE, y * DRAW_SCALE);
            }
        })

        this.level.addEventListener('componentDestroyed', ([component, spaceship])=>{
            const renderer = this.shipRenderers.find(renderer => renderer.spaceship === spaceship);
            if(renderer){
                renderer.onComponentDestroyed(component);
            }
        });
    }
    onUpdate(scene: SpaceScene, delta:number) {
        scene.graphics.clear();
        this.shipRenderers.forEach(renderer => renderer.onUpdate(scene));


        this.cannonballSprites.forEach((sprite, i) => {
            const cannonball = this.level.cannonballs.find(cb=>cb.id === sprite.getData('id'));
            if(!cannonball) {
                sprite.destroy()
                this.cannonballSprites.splice(this.cannonballSprites.indexOf(sprite), 1)
                this.fireEmitter.active = true;
                this.fireEmitter.setSpeed({min: -100 , max: 100 });
                this.fireEmitter.explode(50, sprite.x, sprite.y);
                return
            }
            sprite.setX(cannonball.position.x * DRAW_SCALE);
            sprite.setY(cannonball.position.y * DRAW_SCALE);
            sprite.setScale(
                Math.min(2,Math.max(0.5, 2 * cannonball.maxAge / CANNONBALL_AGE))
            )
        });

        this.level.cannonballs.forEach(cannonball=>{
            const existingSprite = this.cannonballSprites.find(s=>s.getData('id') == cannonball.id)
            if(existingSprite) return
            const sprite = scene.add.sprite(cannonball.position.x * DRAW_SCALE, cannonball.position.y * DRAW_SCALE, 'cannonball');
            sprite.setBlendMode('ADD');
            sprite.setDepth(-1);
            sprite.setData('id', cannonball.id) 
            this.cannonballSprites.push(sprite);
        })

        const spaceships = this.level.getAllSpaceships()
        if(spaceships.length >=2) {
            const totalX = spaceships.reduce((sum, ship) => sum + ship.position.x, 0);
            const totalY = spaceships.reduce((sum, ship) => sum + ship.position.y, 0);
            const centerX = totalX / spaceships.length;
            const centerY = totalY / spaceships.length;
            scene.cameras.main.scrollX = centerX * DRAW_SCALE - scene.cameras.main.width /2 ;
            scene.cameras.main.scrollY = centerY * DRAW_SCALE - scene.cameras.main.height /2 ;
    
            const maxDistance = spaceships.reduce((maxDist, ship) => {
                const distX = Math.abs(ship.position.x - centerX);
                const distY = Math.abs(ship.position.y - centerY);
                return Math.max(maxDist, distX, distY) + 10
            }, 0);
            const tzoom = scene.cameras.main.width / (maxDistance * 2 * DRAW_SCALE)
            this.desiredZoom = Math.max(0.25, Math.min(3, tzoom))
        }
        scene.cameras.main.setZoom(lerp(scene.cameras.main.zoom, this.desiredZoom, delta));
        scene.cameras.main.setZoom(this.desiredZoom);

        this.backgroundLayers.forEach(layer => {
            layer.image.tilePositionX = scene.cameras.main.scrollX * layer.scrollSpeed;
            layer.image.tilePositionY =  scene.cameras.main.scrollY * layer.scrollSpeed;
        });

        this.level.obsticals.forEach(o=>{
            scene.graphics.lineStyle(2, 0xFFFFFF, 0.5);
            const boundingBox = o.shape.getBoundingBox(o)
            const lines = polygonToLines(rectangleToPolygon(boundingBox));
            lines.forEach(([p1, p2]) => {
                scene.graphics.lineBetween(p1.x * DRAW_SCALE, p1.y * DRAW_SCALE, p2.x * DRAW_SCALE, p2.y * DRAW_SCALE);
            });
        })
    }
}