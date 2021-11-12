import 'phaser';
import { createEnemies, GameState, getAllGameObjects, ObjectInfo, stepGameState } from './gameState';
import { GRAPHIC_COORDS } from './graphic_coords';
import { Input } from './updateMovement';

type TileSprite = Phaser.GameObjects.TileSprite;

export default class Demo extends Phaser.Scene
{
    private gameState: GameState;
    private sprites = new Map<string, TileSprite>();
    text: Phaser.GameObjects.Text;

    constructor ()
    {
        super('demo');
        this.gameState = {
            player: {
                key: 'PLAYER',
                pos: { x: 400, y: 400 },
                vel: { x: 0, y: 0 },
                accel: 0.007,
                friction: 0.007,
                graphic: 'player',
            },
            enemies: [],
            bullets: [],
        }
    }

    preload ()
    {
        this.load.image('spritesheet', 'assets/kenney_scribbleplatformer/Spritesheet/spritesheet_retina.png');

    }

    create ()
    {
        this.scale.setZoom(0.5)
        this.text  = this.add.text(10, 10, 'Move the mouse', { font: '16px Courier'});
        var keys: any = this.input.keyboard.addKeys({
            up: 'up',
            down: 'down',
            left: 'left',
            right: 'right',
        });

        this.createSprite(this.gameState.player, 9, 3);

        createEnemies(this.gameState);

        this.game.events.on('step', ()=>{
            const fps = this.game.loop.actualFps.toFixed(2);
            this.text.setText(`${fps}FPS`)
        })

        //UPDATE
        this.game.events.on('step', (time, delta) => {
            const input:Input = {
                x: keys.left.isDown ? -1 : keys.right.isDown ? 1 : 0,
                y: keys.up.isDown ? -1 : keys.down.isDown ? 1 : 0,
            }
            stepGameState(this.gameState, delta, input);
        });

        //SYNC GAMESTATE
        this.game.events.on('step',(time, delta) => {
            getAllGameObjects(this.gameState).forEach(gameObject => {
                const sprite = this.getOrCreateSprite(gameObject);
                sprite.x = gameObject.pos.x;
                sprite.y = gameObject.pos.y;
                sprite.flipX = gameObject.vel.x < 0;
                sprite.setDepth(gameObject.pos.y);
            });
        });
    }
    getOrCreateSprite(gameObject: ObjectInfo): TileSprite{
        const sprite = this.sprites.get(gameObject.key);
        if (sprite) {
            return sprite;
        }
        const {x,y} = GRAPHIC_COORDS[gameObject.graphic];
        return this.createSprite(gameObject, x, y);
    }

    createSprite(gameObject: ObjectInfo, spriteX: number, spriteY: number): TileSprite {
        const sprite = this.add.tileSprite(NaN, NaN, 128, 128, 'spritesheet')
        sprite.tilePositionX = spriteX * 128;
        sprite.tilePositionY = spriteY * 128;
        this.sprites.set(gameObject.key, sprite);
        return sprite;
    }
}

const config:Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    backgroundColor: '#125555',
    width: 1920,
    height: 1080,
    scene: Demo,
    
};
const game = new Phaser.Game(config);
