import { Scene } from "phaser";

export function preload_sprites(scene: Scene) {
    scene.load.spritesheet('block', 'assets/components/block.png', { frameWidth: 16, frameHeight: 16 });
    scene.load.spritesheet('thruster', 'assets/components/thruster.png', { frameWidth: 16, frameHeight: 16 });
    scene.load.spritesheet('lateralThrusters', 'assets/components/laterialThrusters.png', { frameWidth: 16, frameHeight: 16 });
    scene.load.spritesheet('engineRoom', 'assets/components/engineRoom.png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('bridge', 'assets/components/bridge.png', { frameWidth: 32, frameHeight: 32 });
    scene.load.spritesheet('cannon', 'assets/components/cannon.png', { frameWidth: 16, frameHeight: 16 });
    scene.load.spritesheet('grapecannon', 'assets/components/grapecannon.png', { frameWidth: 16, frameHeight: 16 });
    scene.load.spritesheet('minicannon', 'assets/components/minicannon.png', { frameWidth: 16, frameHeight: 16 });
    scene.load.spritesheet('depthchargedropper', 'assets/components/depthchargedropper.png', { frameWidth: 16, frameHeight: 16 });
    scene.load.spritesheet('multishotmagazine', 'assets/components/multishotmagazine.png', { frameWidth: 32, frameHeight: 16 });
    scene.load.spritesheet('bouncingmagazine', 'assets/components/bouncingmagazine.png', { frameWidth: 32, frameHeight: 16 });
    scene.load.spritesheet('quickshotmagazine', 'assets/components/quickshotmagazine.png', { frameWidth: 32, frameHeight: 16 });

    scene.load.spritesheet('cannonball', 'assets/bullet.png', { frameWidth: 8, frameHeight: 8 });
    scene.load.spritesheet('smoke', 'assets/smoke.png', { frameWidth: 8, frameHeight: 8 });
    scene.load.spritesheet('arrow', 'assets/arrow.png', { frameWidth: 32, frameHeight: 32 });

    scene.load.image('space1', 'assets/backgrounds/space1.jpeg');
    scene.load.image('space2', 'assets/backgrounds/space2.jpeg');
    scene.load.image('grid', 'assets/backgrounds/grid.png');
}
