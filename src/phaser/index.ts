import 'phaser';
import SpaceScene from '../scenes/SpaceScene';


const config:Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    backgroundColor: '#125555',
    width: 1920,
    height: 1080,
    scene: new SpaceScene(),
    
};
new Phaser.Game(config);
