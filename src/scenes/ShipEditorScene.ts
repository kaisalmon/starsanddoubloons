import { Socket } from "socket.io";
import Component, { UNIT_SCALE } from "../game/Component";
import { newBasicEnemy, newPlayerShip } from "../game/ShipDesigns/basic";
import { SpaceShip } from "../game/SpaceShip";
import { preload_sprites } from "./preload_sprites";
import Vector2 from "../game/Vector2";
import { COMPONENT_TYPES_BY_NAME, block, bouncingMagazine, cannon, engine, flipped, grapeshot, lateralThruster, minicannon, thruster } from "../game/Component/ComponentType";
import MatchManager from "../game/MatchManager";

const DRAW_SCALE = 32/UNIT_SCALE;


export default class ShipEditorScene extends Phaser.Scene {
    name = "ShipEditorScene";
    socket:Socket
    spaceship!: SpaceShip
    selectedSprite: Phaser.GameObjects.Sprite | null;
    selectedComponent: Component | null
    offset: Vector2={x:0, y:0};
    gameId: string;
    match: MatchManager;
    graphics!: Phaser.GameObjects.Graphics;
    
    constructor(socket: Socket, match: MatchManager){
        super({ key: "ShipEditorScene" });
        this.socket = socket;
        const urlParams = new URLSearchParams(window.location.search);
        this.selectedComponent = null
        this.selectedSprite = null
        const gameId = urlParams.get('gameId')
        if(!gameId) throw new Error("Missing gameId")
        this.gameId = gameId
        this.match = match
    }

    init(){
        this.spaceship = this.match.getEditingSpaceship()
        this.spaceship.shelf=Object.keys(COMPONENT_TYPES_BY_NAME).map(key => ({
            typeName: key,
            count: 99
        }))
    }

    preload(){
        preload_sprites(this)
    }

    create(){
        this.createSprites();
        this.graphics = this.add.graphics();
        this.graphics.z = 10;
        this.input.on('pointerup', () => {
            if (this.selectedComponent && this.selectedSprite) {
                // Check if the component is being dropped on the shelf area
                const shelfArea = new Phaser.Geom.Rectangle(0, 0, 200, 600);
                if (shelfArea.contains(this.selectedSprite.x, this.selectedSprite.y)) {
                    // Remove the component from the spaceship and add it to the shelf
                    this.spaceship.removeComponent(this.selectedComponent)
                    const shelfItem = this.spaceship.shelf.find(item => item.typeName == this.selectedComponent?._type.name);
                    if (shelfItem) {
                        shelfItem.count++;
                    } else {
                        this.spaceship.shelf.push({ typeName: this.selectedComponent._type.name, count: 1 });
                    }
                }
            }
            this.selectedSprite = null;
            this.selectedComponent = null;
            this.createSprites()
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if(this.selectedComponent && this.selectedSprite){
                this.selectedSprite.x = pointer.x + this.offset.x;
                this.selectedSprite.y = pointer.y + this.offset.y;

                const { x, y } = this.selectedSprite.getTopLeft();
                this.selectedComponent.position.x = (x - 400) / (UNIT_SCALE * DRAW_SCALE);
                this.selectedComponent.position.y = (y - 300) / (UNIT_SCALE * DRAW_SCALE);
                
                this.emitDump();
            }
               
        });

        this.input.keyboard.on('keydown-ENTER', () => {
            this.emitDump()
            this.nextScene()
        });

        this.input.keyboard.on('keydown-F', () => {
            if(this.selectedComponent){
                this.selectedComponent._type = flipped(this.selectedComponent._type)
                this.selectedSprite!.flipX = this.selectedComponent._type.isFlipped;
            }
            this.emitDump()
        });
  
        this.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
            if (gameObject.getData('isShelfComponent')) {
                const shelfItem = this.spaceship.shelf[gameObject.getData('shelfIndex')];
                if (shelfItem.count > 0) {
                    const shelfSprite = gameObject as Phaser.GameObjects.Sprite;
                    const type = COMPONENT_TYPES_BY_NAME[shelfItem.typeName]
                    this.selectedComponent = new Component(type, { x: 0, y: 0 });
                    this.selectedComponent.spaceship = this.spaceship;

                    const { x, y } = shelfSprite.getCenter();
                    this.selectedComponent.position.x = (x - 400) / (UNIT_SCALE * DRAW_SCALE);
                    this.selectedComponent.position.y = (y - 300) / (UNIT_SCALE * DRAW_SCALE);

                    this.offset = { x: shelfSprite.x - pointer.x, y: shelfSprite.y - pointer.y };
                    shelfItem.count--;
                    if (shelfItem.count === 0) {
                        this.spaceship.shelf.splice(gameObject.getData('shelfIndex'), 1);
                    }
                    this.spaceship.addComponent(this.selectedComponent);
                    this.createSprites();
                    this.selectedSprite = this.children.list
                        .find(o => o instanceof Phaser.GameObjects.Sprite && o.getData('component') === this.selectedComponent)! as Phaser.GameObjects.Sprite;
                    this.selectedSprite.x = pointer.x + this.offset.x;
                    this.selectedSprite.y = pointer.y + this.offset.y;
                }
            }
        });

        this.socket.on(`game ${this.gameId}`, (msg)=>{
            if(!msg.editorDump) return
            this.spaceship.applyDump(msg.editorDump.ship)
            this.createSprites()
        })
    }
    nextScene() {
        this.match.setState(this.match.getState() === 'blue_edit' ? 'red_edit' : 'space')
    }

    private emitDump() {
        this.socket.emit(`game ${this.gameId}`, {
            editorDump: {
                ship: this.spaceship.fulldump(),
            }
        });
    }

    private createSprites() {

        this.children.list.filter(x => x instanceof Phaser.GameObjects.Sprite && x.getData('isComponent')).forEach(c=>c.destroy())

        this.spaceship.components.forEach((c) => {
            const sprite = this.add.sprite(0, 0, c.type.appearance, 0);
            sprite.setData('isComponent', true)
            sprite.setFrame(this.spaceship.id === '2' ? 2*c.type.health+2 : 0)
            sprite.setData('component', c)
            sprite.setScale(DRAW_SCALE * UNIT_SCALE / sprite.width * c.type.width, DRAW_SCALE * UNIT_SCALE / sprite.height * c.type.height);
            const { x, y } = c.getCoMInUnitSpace();
            sprite.setPosition(
                (x) * UNIT_SCALE * DRAW_SCALE + 400,
                (y) * UNIT_SCALE * DRAW_SCALE + 300
            );

            if (c.type.isFlipped) {
                sprite.flipX = true;
            }
            sprite.setInteractive();
            sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                this.selectedSprite = sprite;
                this.selectedComponent = c;
                this.offset = { x: sprite.x - pointer.x, y: sprite.y - pointer.y };
            });
        });

        this.children.list.filter(x => x instanceof Phaser.GameObjects.Sprite && x.getData('isShelfComponent')).forEach(c => c.destroy());
        this.children.list.filter(x => x instanceof Phaser.GameObjects.Text && x.getData('isShelfCount')).forEach(c => c.destroy());
        let offset=20
        this.spaceship.shelf.forEach((shelfItem, index) => {
            
            const type = COMPONENT_TYPES_BY_NAME[shelfItem.typeName]
            const sprite = this.add.sprite(50, offset, type.appearance, 0);
            sprite.setData('isShelfComponent', true);
            sprite.setData('shelfIndex', index);
            sprite.setFrame(this.spaceship.id === '2' ? 2*type.health+2 : 0)
            sprite.setScale(DRAW_SCALE * UNIT_SCALE / sprite.width * type.width, DRAW_SCALE * UNIT_SCALE / sprite.height * type.height);
            sprite.setInteractive();
            if(type.isFlipped){
                sprite.setFlipX(true)
            }

            const countText = this.add.text(sprite.x + 50, sprite.y-5, `${type.name} ×${shelfItem.count}`, {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff'
            });
            countText.setData('isShelfCount', true);
            offset+= ( DRAW_SCALE * UNIT_SCALE * type.height) + 2
        });
    }

    update(time: number, delta: number): void {
        // this.graphics.clear();
        // this.graphics.z=10
        // const {x,y} = this.spaceship.getCenterOfMassUnitSpace()
        // this.graphics.fillStyle(0xffffff)
        // this.graphics.fillCircle(x* UNIT_SCALE * DRAW_SCALE + 400,y * UNIT_SCALE * DRAW_SCALE + 300,10)
    }
}


