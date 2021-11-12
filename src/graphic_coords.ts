

export const GRAPHIC_COORDS = {
    player: {
        x: 9,
        y: 3,
    },
    normal_enemy: {
        x: 9,
        y: 1,
    },
    bullet: {
        x: 9,
        y: 9,
    }
}

type Graphic = keyof typeof GRAPHIC_COORDS;
export default Graphic;