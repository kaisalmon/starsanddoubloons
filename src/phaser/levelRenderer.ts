import { UNIT_SCALE } from "../game/Component";
import { Level } from "../game/Level";
import SpaceScene from "../scenes/SpaceScene";
import ShipRenderer from "./shipRenderer";

export class LevelRenderer{
    playerRenderer: ShipRenderer;
    constructor(private level: Level){
        this.playerRenderer = new ShipRenderer(level.player)
    }
    onCreate(scene: SpaceScene) {
        this.playerRenderer.onCreate(scene);
    }
    onUpdate(scene: SpaceScene) {
        this.playerRenderer.onUpdate(scene);
    }
}