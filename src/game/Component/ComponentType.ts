import Component from ".";
import Force from "../Force";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";

export default interface ComponentType{
    name: string;
    mass: number;
    drag: number;
    width: number;
    height: number;
    getThrust(intent: SpaceshipIntent, component:Component, spaceship: SpaceShip): Force|undefined;
}

export const block: ComponentType = {
    name: "Block",
    mass: 1,
    drag: 0.1,
    width: 1,
    height: 1,
    getThrust(): Force|undefined {
        return undefined;
    }
}
export const leftWing: ComponentType = {
    name: "Left Wing",
    ...block,
    height: 2,
    width: 2,
    getThrust(intent: SpaceshipIntent): Force|undefined {
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
    ...leftWing,
    getThrust(intent: SpaceshipIntent): Force|undefined {
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

export const leftLateralThruster: ComponentType = {
    ...block,
    name: "Left Lateral Thruster",
    getThrust(intent: SpaceshipIntent, component:Component, spaceship: SpaceShip): Force|undefined {
        const isAheadOfShipCom = component.isAheadOfShipCoM(spaceship);
        if((intent.rotateLeft && isAheadOfShipCom) || (intent.rotateRight && !isAheadOfShipCom)){
            return {
                offsetY: 0,
                offsetX: 0,
                x: 1,
                y: 0
            }
        }
    }
}
export const rightLateralThruster: ComponentType = {
    ...leftLateralThruster,
    name: "Left Lateral Thruster",
    getThrust(intent: SpaceshipIntent, component:Component, spaceship: SpaceShip): Force|undefined {
        const isAheadOfShipCom = component.isAheadOfShipCoM(spaceship);
        if((intent.rotateRight && isAheadOfShipCom) || (intent.rotateLeft && !isAheadOfShipCom)){
            return {
                offsetY: 0,
                offsetX: 0,
                x: -1,
                y: 0
            }
        }
    }
}

export const thruster: ComponentType = {
    ...block,
    name: "Thruster",
    getThrust(intent: SpaceshipIntent, component:Component, spaceship: SpaceShip): Force|undefined {
        if(intent.moveForward){
            return {
                offsetY: 0,
                offsetX: 0,
                x: 0,
                y: 1
            }
        }
    }
}