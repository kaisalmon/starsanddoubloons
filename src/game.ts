import 'phaser';
import SpaceScene from './scenes/SpaceScene';
import ShipEditorScene from './scenes/ShipEditorScene';
import MatchManager from './game/matchmanager';

(async function(){
    while(!window.document.body){
        console.log('..')
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const socket = io(location.hostname === "localhost"  ? 'http://localhost:3000': 'https://starsanddoubloons.fly.dev/');
   
    const match = new MatchManager()
    const config:Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        backgroundColor: '#333333',
        width: 800,
        height: 600,
        pixelArt: true,
        scene: [new ShipEditorScene(socket, match), new SpaceScene(socket, match)],
        
    };
    const game = new Phaser.Game(config);
    match.attachListener(state=>{
        if(state==='space'){
            game.scene.start('SpaceScene');
        }else if(state==='red_edit' || state=='blue_edit'){
            game.scene.start('ShipEditorScene');
        }
    })
})();