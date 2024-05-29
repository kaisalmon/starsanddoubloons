export default interface SpaceshipIntent{
    readonly fireBack: boolean
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
    fireBack: false,
    fireLeft: false,
    fireRight: false
}

export function flipIntent(intent: SpaceshipIntent): SpaceshipIntent{
    return {
        ...intent,
        rotateLeft: intent.rotateRight,
        rotateRight: intent.rotateLeft,
        fireLeft: intent.fireRight,
        fireRight: intent.fireLeft,
    }
}