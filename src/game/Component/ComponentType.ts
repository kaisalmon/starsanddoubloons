import Force from "../Force";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";

export default interface ComponentType{
    name: string;
    mass: number;
    drag: number;
    width: number;
    height: number;
    getThrust(intent: SpaceshipIntent, spaceship: SpaceShip): Force|undefined;
}

export const leftWing: ComponentType = {
    name: "Left Wing",
    mass: 1,
    drag: 0.1,
    width: 2,
    height: 2,
    getThrust(intent: SpaceshipIntent, spaceship: SpaceShip): Force|undefined {
        if(intent.rotateLeft || intent.moveForward){
            return {
                offsetY: 0,
                offsetX: 0,
                x: 0,
                y: 1
            }
        }
    }
}

export const rightWing: ComponentType = {
    name: "Right Wing",
    mass: 1,
    drag: 0.01,
    width: 2,
    height: 2,
    getThrust(intent: SpaceshipIntent, spaceship: SpaceShip): Force|undefined {
        if(intent.rotateRight || intent.moveForward){
            return {
                offsetY: 0,
                offsetX: 0,
                x: 0,
                y: 1
            }
        }
    }
}

export const block: ComponentType = {
    name: "Block",
    mass: 1,
    drag: 1,
    width: 1,
    height: 1,
    getThrust(intent: SpaceshipIntent, spaceship: SpaceShip): Force|undefined {
        return undefined;
    }
}