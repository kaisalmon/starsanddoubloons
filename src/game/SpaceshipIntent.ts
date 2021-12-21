export default interface SpaceshipIntent{
    readonly moveForward: boolean;
    readonly rotateLeft: boolean;
    readonly rotateRight: boolean;
}

export const EMPTY_INTENT: SpaceshipIntent = {
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