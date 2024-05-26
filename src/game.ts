import 'phaser';
import SpaceScene from './scenes/SpaceScene';

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
        scene: new SpaceScene(socket),
        
    };
    new Phaser.Game(config);
})();