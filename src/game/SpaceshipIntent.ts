export default interface SpaceshipIntent{
    readonly moveForward: boolean;
    readonly rotateLeft: boolean;
    readonly rotateRight: boolean;
    readonly fireLeft: boolean;
    readonly fireRight: boolean;
}

export const EMPTY_INTENT: SpaceshipIntent = {
    moveForward: false,
    rotateLeft: false,
    rotateRight: false,
    fireLeft: false,
    fireRight: false
}

export function flipIntent(intent: SpaceshipIntent): SpaceshipIntent{
    return {
        moveForward: intent.moveForward,
        rotateLeft: intent.rotateRight,
        rotateRight: intent.rotateLeft,
        fireLeft: intent.fireRight,
        fireRight: intent.fireLeft
    }
}