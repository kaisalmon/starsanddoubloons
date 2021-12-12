export default interface SpaceshipIntent{
    moveForward: boolean;
    rotateLeft: boolean;
    rotateRight: boolean;
}

export const EMPTY_INTENT = {
    moveForward: false,
    rotateLeft: false,
    rotateRight: false
}

export function flipIntent(intent: SpaceshipIntent): SpaceshipIntent{
    return {
        moveForward: intent.moveForward,
        rotateLeft: intent.rotateRight,
        rotateRight: intent.rotateLeft
    }
}