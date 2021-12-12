import 'phaser';
import SpaceScene from './scenes/SpaceScene';


const config:Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    backgroundColor: '#333333',
    width: 800,
    height: 800,
    pixelArt: true,
    scene: new SpaceScene(),
    
};
const game = new Phaser.Game(config);
