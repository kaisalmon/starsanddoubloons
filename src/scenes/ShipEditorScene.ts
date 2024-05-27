import { Socket } from "socket.io";
import Component, { UNIT_SCALE } from "../game/Component";
import { newBasicEnemy, newPlayerShip } from "../game/ShipDesigns/basic";
import { SpaceShip } from "../game/SpaceShip";
import { preload_sprites } from "./preload_sprites";
import Vector2 from "../game/Vector2";
import { block, cannon, engine, flipped, grapeshot, lateralThruster, minicannon, thruster } from "../game/Component/ComponentType";
import MatchManager from "../game/matchmanager";

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
        this.spaceship.shelf =[
            { type: grapeshot, count: 99 },
            { type: flipped(grapeshot), count:99 },
            { type: minicannon, count: 99 },
            { type: flipped(minicannon), count:99 },
            { type: cannon, count: 99 },
            { type: flipped(cannon), count:99 },
            { type: thruster, count: 99 },
            { type: block, count: 99 },
            { type: lateralThruster, count: 99 },
            { type: flipped(lateralThruster), count:99 },
            { type: engine, count: 99 }
        ];
    }

    preload(){
        preload_sprites(this)
    }

    create(){
        this.createSprites();
        this.input.on('pointerup', () => {
            if (this.selectedComponent && this.selectedSprite) {
                // Check if the component is being dropped on the shelf area
                const shelfArea = new Phaser.Geom.Rectangle(0, 0, 200, 600);
                if (shelfArea.contains(this.selectedSprite.x, this.selectedSprite.y)) {
                    // Remove the component from the spaceship and add it to the shelf
                    const index = this.spaceship.components.indexOf(this.selectedComponent);
                    if (index !== -1) {
                        this.spaceship.components.splice(index, 1);
                        const shelfItem = this.spaceship.shelf.find(item => item.type === this.selectedComponent!.type);
                        if (shelfItem) {
                            shelfItem.count++;
                        } else {
                            this.spaceship.shelf.push({ type: this.selectedComponent.type, count: 1 });
                        }
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
            this.socket.emit(`game ${this.gameId}`, {
                doneEditing: true,
            })
            this.nextScene()
        });
  
        this.input.on('gameobjectdown', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
            if (gameObject.getData('isShelfComponent')) {
                const shelfItem = this.spaceship.shelf[gameObject.getData('shelfIndex')];
                if (shelfItem.count > 0) {
                    const shelfSprite = gameObject as Phaser.GameObjects.Sprite;
                    this.selectedComponent = new Component(shelfItem.type, { x: 0, y: 0 });
                    this.selectedComponent.spaceship = this.spaceship;

                    const { x, y } = shelfSprite.getCenter();
                    this.selectedComponent.position.x = (x - 400) / (UNIT_SCALE * DRAW_SCALE);
                    this.selectedComponent.position.y = (y - 300) / (UNIT_SCALE * DRAW_SCALE);

                    this.offset = { x: shelfSprite.x - pointer.x, y: shelfSprite.y - pointer.y };
                    shelfItem.count--;
                    if (shelfItem.count === 0) {
                        this.spaceship.shelf.splice(gameObject.getData('shelfIndex'), 1);
                    }
                    this.spaceship.components.push(this.selectedComponent);
                    this.createSprites();
                    this.selectedSprite = this.children.list
                        .find(o => o instanceof Phaser.GameObjects.Sprite && o.getData('component') === this.selectedComponent)! as Phaser.GameObjects.Sprite;
                    this.selectedSprite.x = pointer.x + this.offset.x;
                    this.selectedSprite.y = pointer.y + this.offset.y;
                }
            }
        });

        this.socket.on(`game ${this.gameId}`, (msg)=>{
            if(msg.doneEditing) this.nextScene()
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
        const shipOffset = {x:0,y:0}

        this.children.list.filter(x => x instanceof Phaser.GameObjects.Sprite && x.getData('isComponent')).forEach(c=>c.destroy())

        this.spaceship.components.forEach((c) => {
            const sprite = this.add.sprite(0, 0, c.type.appearance, 0);
            sprite.setData('isComponent', true)
            sprite.setFrame(this.spaceship.id === '2' ? 2*c.type.health+2 : 0)
            sprite.setData('component', c)
            sprite.setScale(DRAW_SCALE * UNIT_SCALE / sprite.width * c.type.width, DRAW_SCALE * UNIT_SCALE / sprite.height * c.type.height);

            const { x, y } = c.getCoMInUnitSpace();
            sprite.setPosition(
                (x - shipOffset.x) * UNIT_SCALE * DRAW_SCALE + 400,
                (y - shipOffset.y) * UNIT_SCALE * DRAW_SCALE + 300
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
        let offset=50
        this.spaceship.shelf.forEach((shelfItem, index) => {
            const sprite = this.add.sprite(50, offset, shelfItem.type.appearance, 0);
            sprite.setData('isShelfComponent', true);
            sprite.setData('shelfIndex', index);
            sprite.setFrame(this.spaceship.id === '2' ? 2*shelfItem.type.health+2 : 0)
            sprite.setScale(DRAW_SCALE * UNIT_SCALE / sprite.width * shelfItem.type.width, DRAW_SCALE * UNIT_SCALE / sprite.height * shelfItem.type.height);
            sprite.setInteractive();
            if(shelfItem.type.isFlipped){
                sprite.setFlipX(true)
            }

            const countText = this.add.text(sprite.x + 50, sprite.y-5, `×${shelfItem.count}`, {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff'
            });
            countText.setData('isShelfCount', true);
            offset+= ( DRAW_SCALE * UNIT_SCALE * shelfItem.type.height) + 10
        });
    }

    update(time: number, delta: number){
      
    }
   

}


