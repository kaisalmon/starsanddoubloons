import 'phaser';
import SpaceScene from './scenes/SpaceScene';

(async function(){
    while(!window.document.body){
        console.log('..')
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    const {width} = window.document.body.getClientRects()[0]
    const body = document.body,
    html = document.documentElement;

    const height = Math.max( body.scrollHeight, body.offsetHeight, 
                        html.clientHeight, html.scrollHeight, html.offsetHeight ); 
    const config:Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        backgroundColor: '#333333',
        width: width,
        height: height,
        pixelArt: true,
        scene: new SpaceScene(),
        
    };
    const game = new Phaser.Game(config);
})();