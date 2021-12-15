import Component from ".";
import { BoundingBox } from "../Collision";
import Force from "../Force";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent, { flipIntent } from "../SpaceshipIntent";


export default interface ComponentType{
    appearance: string;
    name: string;
    mass: number;
    drag: number;
    width: number;
    height: number;
    hitbox?: BoundingBox;
    isFlipped: boolean;
    isPowered(intent: SpaceshipIntent, component:Component, spaceship: SpaceShip):boolean;
    getThrust(powered: boolean, intent: SpaceshipIntent, component:Component, spaceship: SpaceShip): Force|undefined;
}

export function flipped(base: ComponentType): ComponentType{
    return {
        ...base,
        isFlipped: true,
        hitbox: base.hitbox && {
            ...base.hitbox,
            angle: base.hitbox.angle + Math.PI,
            position:{
                x: -base.hitbox.position.x,
                y: -base.hitbox.position.y
            }
        },
        isPowered(intent: SpaceshipIntent, component:Component, spaceship: SpaceShip):boolean{
            const flippedIntent = flipIntent(intent);
            return base.isPowered(flippedIntent, component, spaceship);
        },
        getThrust(powered: boolean, intent:SpaceshipIntent, component:Component, spaceship: SpaceShip): Force|undefined{
            const flippedIntent = flipIntent(intent);
            const baseThrust = base.getThrust(powered, flippedIntent, component, spaceship);
            if(!baseThrust) return undefined;
            return {
                x: -1 * baseThrust.x,
                y: baseThrust.y,
                offsetX: -1 * baseThrust.offsetX,
                offsetY: baseThrust.offsetY
            }
        }
    }
}

export const block: ComponentType = {
    name: "Block",
    appearance: "block",
    isFlipped: false,
    mass: 1,
    drag: 0.1,
    width: 1,
    height: 1,
    isPowered: (intent: SpaceshipIntent, component:Component, spaceship: SpaceShip) => {
        return false;
    },
    getThrust(): Force|undefined {
        return undefined;
    }
}

export const engine: ComponentType = {
    ...block,
    name: "Engine",
    appearance: "engineRoom",
    mass: 4,
    width: 2,
    height: 2, 
}   

export const bridge: ComponentType = {
    ...block,
    name: "Bridge",
    appearance: "bridge",
    mass: 4,
    width: 2,
    height: 2, 
}   

export const wing: ComponentType = {
    name: "Wing",
    ...block,
    height: 2,
    width: 2,
    getThrust(powered: boolean): Force|undefined {
        if(powered){
            return {
                offsetY: 0,
                offsetX: 0,
                x: 0,
                y: 1
            }
        }
    },
    isPowered: (intent: SpaceshipIntent) => {
        return intent.rotateLeft || intent.moveForward;
    }
}


export const lateralThruster: ComponentType = {
    ...block,
    mass: 0,
    drag: 0,
    name: "Lateral Thruster",
    appearance: "lateralThrusters",
    hitbox: {
        position: {x: 0.5 - 0.25/2, y:0},
        angle: 0,
        width: 0.25,
        height: 1
    },
    isPowered: (intent: SpaceshipIntent, component:Component, spaceship: SpaceShip) => {
        const isAheadOfShipCom = component.isAheadOfShipCoM(spaceship);
        if((intent.rotateLeft && isAheadOfShipCom) || (intent.rotateRight && !isAheadOfShipCom)){
            return true;
        }
        return false;
    },
    getThrust(powered: boolean): Force|undefined {
        if(powered){
            return {
                offsetY: 0,
                offsetX: 0,
                x: 0.3,
                y: 0
            }
        }
    }
}

export const thruster: ComponentType = {
    ...block,
    name: "Thruster",
    appearance: "thruster",

    hitbox: {
        position: {x: 0, y: 0.25},
        angle: 0,
        width: 1,
        height: 0.5
    },
    
    isPowered: (intent: SpaceshipIntent) => {
        return intent.moveForward;
    },
    getThrust(powered: boolean): Force|undefined {
        if(powered){
            return {
                offsetY: 0,
                offsetX: 0,
                x: 0,
                y: 1
            }
        }
    }
}