import { SpaceShip } from "../game/SpaceShip";
import ShipRenderer from "../phaser/shipRenderer";
import { ShipBulderState } from "../game/ShipBuilderState";

export default class ShipBulderScene extends Phaser.Scene {
    state = new ShipBulderState();
    graphics!: Phaser.GameObjects.Graphics;

    shipRenderer!: ShipRenderer;

    constructor(){
        super({key: "ShipBuilderScene"})
    }

    get spaceship(): SpaceShip{
        return this.state.ship;
    }

    preload(){
        ShipRenderer.preload(this);
    }
    onCreate(){
        this.graphics = this.add.graphics();
        this.shipRenderer = new ShipRenderer(this.spaceship);
        this.shipRenderer.onCreate(this)
    }
    
}