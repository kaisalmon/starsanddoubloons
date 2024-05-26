import 'phaser';
import SpaceScene from './scenes/SpaceScene';
import ShipEditorScene from './scenes/ShipEditorScene';

(async function(){
    while(!window.document.body){
        console.log('..')
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const socket = io(location.hostname === "localhost"  ? 'http://localhost:3000': 'https://starsanddoubloons.fly.dev/');
    const config:Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        backgroundColor: '#333333',
        width: 800,
        height: 600,
        pixelArt: true,
        scene: [new ShipEditorScene(socket, "1"), new SpaceScene(socket)],
        
    };
    const game = new Phaser.Game(config);
})();