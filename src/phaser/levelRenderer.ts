

import { MOMENTUM_TO_DAMAGE } from "../game/Collision";
import { UNIT_SCALE } from "../game/Component";
import { GameLevel } from "../game/Level";
import Vector2, { getMagnitude, lerp, lerpAngle, normalizeAngle } from "../game/Vector2";
import SpaceScene from "../scenes/SpaceScene";
import { DRAW_SCALE, RAD_TO_DEG } from "./constants";
import ShipRenderer from "./shipRenderer";

type ScrollLayer = {
    image: Phaser.GameObjects.TileSprite;
    scrollSpeed: number;
}

const lOOKAHEAD_SCALE = 3 * UNIT_SCALE * DRAW_SCALE;
const LOOKAHEAD_EXP = 2;
const MIN_ZOOM = 1/2;
const MAX_ZOOM = 2;

export class LevelRenderer{
    playerRenderer: ShipRenderer;
    enemyRenderers: ShipRenderer[]

    backgroundLayers: ScrollLayer[] = [];
    
    private cameraAngle = 0;

    get renderers() {
        return [].concat([this.playerRenderer], this.enemyRenderers);
    }

    get desiredZoom(): number{
        return 1
    }

    private get followOffset(){
        const speed = getMagnitude(this.level.player.velocity);
        return Math.pow(speed, LOOKAHEAD_EXP) * lOOKAHEAD_SCALE;
    }

    constructor(private level: GameLevel){
        this.playerRenderer = new ShipRenderer(level.player)
        this.enemyRenderers = level.enemies.map(ship => new ShipRenderer(ship));
    }
    onCreate(scene: SpaceScene) {
        this.renderers.forEach(renderer => renderer.onCreate(scene));
        const width = scene.scale.width
        const height = scene.scale.height
    
        this.backgroundLayers.push({
            image: scene.add.tileSprite(0, 0, width*3, height*3, 'space1')
                .setScrollFactor(0)
                .setDepth(-10),
            scrollSpeed: 0.1
        })
        this.backgroundLayers.push({
            image: scene.add.tileSprite(0, 0, width*3, height*3, 'space2')
                .setScrollFactor(0)
                .setBlendMode('SCREEN')
                .setAlpha(0.5)
                .setDepth(-9),
            scrollSpeed: 0.5
        })

        this.backgroundLayers.push({
            image: scene.add.tileSprite(0, 0, width*3, height*3, 'grid')
                .setScrollFactor(0)
                .setBlendMode('SCREEN')
                .setAlpha(0.1)
                .setTileScale(0.3,0.3)
                .setDepth(-8),
            scrollSpeed: 0.95/0.3
        })

        const emitter = scene.add.particles('block').createEmitter({
            speed: { min: -300, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            blendMode: 'SCREEN',
            lifespan: 300,
            x: this.level.player.position.x,
            y: this.level.player.position.y,
            active: false,
        });

        
        this.level.addEventListener('collision', ([a, b, collision])=>{
            const {x,y} = collision.position;
            emitter.active = true;
            if(collision.momentum > MOMENTUM_TO_DAMAGE){
                emitter.setSpeed({min: -300, max: 300})
                emitter.explode(100, x * DRAW_SCALE, y * DRAW_SCALE);
            }else if(collision.momentum > MOMENTUM_TO_DAMAGE / 3){
                emitter.setSpeed({min: -150, max: 150})
                emitter.explode(75, x * DRAW_SCALE, y * DRAW_SCALE);
            }else{
                emitter.setSpeed({min: -50, max: 50})
                emitter.explode(10, x * DRAW_SCALE, y * DRAW_SCALE);
            }
        })

        scene.cameras.main.startFollow(this.playerRenderer.gameObject,true, 0.04, 0.04, 0, this.followOffset)
        this.cameraAngle = normalizeAngle(Math.PI  - this.level.player.angle)

    }
    onUpdate(scene: SpaceScene, delta:number) {
        scene.graphics.clear();
        this.renderers.forEach(renderer => renderer.onUpdate(scene));

        const targetAngle = normalizeAngle(Math.PI  - this.level.player.angle);
   
        this.cameraAngle = lerpAngle(this.cameraAngle, targetAngle, 0.1);
        scene.cameras.main.setRotation(this.cameraAngle);
        scene.cameras.main.followOffset.x = this.followOffset * Math.sin(this.cameraAngle);
        scene.cameras.main.followOffset.y = this.followOffset * Math.cos(this.cameraAngle);

        scene.cameras.main.setZoom(lerp(scene.cameras.main.zoom, this.desiredZoom, 0.01));

        this.backgroundLayers.forEach(layer => {
            layer.image.tilePositionX = scene.cameras.main.scrollX * layer.scrollSpeed;
            layer.image.tilePositionY =  scene.cameras.main.scrollY * layer.scrollSpeed;
        });
    }
}