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
