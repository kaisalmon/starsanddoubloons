

import { Level } from "../game/Level";
import Vector2 from "../game/Vector2";
import SpaceScene from "../scenes/SpaceScene";
import { DRAW_SCALE, RAD_TO_DEG } from "./constants";
import ShipRenderer from "./shipRenderer";

type ScrollLayer = {
    image: Phaser.GameObjects.TileSprite;
    scrollSpeed: number;
}

export class LevelRenderer{
    playerRenderer: ShipRenderer;
    enemyRenderers: ShipRenderer[];

    backgroundLayers: ScrollLayer[] = [];

    get renderers() {
        return [].concat([this.playerRenderer], this.enemyRenderers);
    }

    constructor(private level: Level){
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
    }
    onUpdate(scene: SpaceScene, delta:number) {
        scene.graphics.clear();
        this.renderers.forEach(renderer => renderer.onUpdate(scene));

        const targetAngle = Math.PI  - this.level.player.angle;
        const targetCamera = {
            x: this.level.player.position.x * DRAW_SCALE,
            y: this.level.player.position.y * DRAW_SCALE
        }
        scene.cameras.main.centerOn(targetCamera.x, targetCamera.y);
        scene.cameras.main.setRotation(targetAngle);
        

        this.backgroundLayers.forEach(layer => {
            layer.image.tilePositionX = scene.cameras.main.scrollX * layer.scrollSpeed;
            layer.image.tilePositionY =  scene.cameras.main.scrollY * layer.scrollSpeed;
        });
    }
}