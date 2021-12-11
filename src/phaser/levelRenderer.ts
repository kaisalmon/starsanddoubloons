import { UNIT_SCALE } from "../game/Component";
import { Level } from "../game/Level";
import SpaceScene from "../scenes/SpaceScene";
import ShipRenderer from "./shipRenderer";

export class LevelRenderer{
    playerRenderer: ShipRenderer;
    enemyRenderers: ShipRenderer[];

    get renderers() {
        return [].concat([this.playerRenderer], this.enemyRenderers);
    }

    constructor(private level: Level){
        this.playerRenderer = new ShipRenderer(level.player)
        this.enemyRenderers = level.enemies.map(ship => new ShipRenderer(ship));
    }
    onCreate(scene: SpaceScene) {
        this.renderers.forEach(renderer => renderer.onCreate(scene));
    }
    onUpdate(scene: SpaceScene) {
        this.renderers.forEach(renderer => renderer.onUpdate(scene));
    }
}