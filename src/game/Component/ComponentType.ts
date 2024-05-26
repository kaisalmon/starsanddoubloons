import Component from ".";
import { BoundingBox } from "../Collision";
import Force from "../Force";
import { SpaceShip, Weapon } from "../SpaceShip";
import SpaceshipIntent, { flipIntent } from "../SpaceshipIntent";

const COMPONENT_TYPES_BY_NAME:Record<string, ComponentType> = {}
export default interface ComponentType{
    health: number;
    fireDelay(): number;
    weaponType?: Weapon;
    appearance: string;
    name: string;
    mass: number;
    drag: number;
    width: number;
    height: number;
    hitbox?: BoundingBox;
    isBridge: boolean;
    isEngine: boolean;
    isThruster: boolean;
    isFlipped: boolean;
    isPowered(intent: SpaceshipIntent, component:Component, spaceship: SpaceShip):boolean;
    getThrust(powered: boolean, intent: SpaceshipIntent, component:Component, spaceship: SpaceShip): Force|undefined;
}

function register(componentType: ComponentType){
    COMPONENT_TYPES_BY_NAME[componentType.name] = componentType
}

export function flipped(base: ComponentType): ComponentType{
    return {
        ...base,
        isFlipped: true,
        weaponType: base.weaponType === 'left' ? 'right' : 
                    base.weaponType === 'right' ? 'left' :
                    base.weaponType,
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
    isBridge: false,
    isEngine: false,
    isThruster: false,
    mass: 1,
    drag: 0.1,
    width: 1,
    height: 1,
    health: 1,
    isPowered: () => {
        return false;
    },
    getThrust(): Force|undefined {
        return undefined;
    },
    fireDelay(): number {
        return Math.random() * 300;
    }
}
register(block)

export const engine: ComponentType = {
    ...block,
    name: "Engine",
    appearance: "engineRoom",
    health: 2,
    mass: 4,
    width: 2,
    height: 2, 
    isEngine: true,
}   
register(engine)

export const bridge: ComponentType = {
    ...block,
    name: "Bridge",
    appearance: "bridge",
    health: 2,
    isBridge: true,
    mass: 4,
    width: 2,
    height: 2, 
}   
register(bridge)

export const wing: ComponentType = {
    ...block,
    name: "Wing",
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
register(wing)

export const leftWing = flipped(wing);

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
                x: 1.8,
                y: 0
            }
        }
    }
}
register(lateralThruster)

export const thruster: ComponentType = {
    ...block,
    name: "Thruster",
    appearance: "thruster",
    isThruster: true,
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
                y: 2
            }
        }
    }
}
register(thruster)
export const cannon: ComponentType = {
    ...block,
    name: "Cannon",
    appearance: "cannon",
    weaponType: 'right',
}
register(cannon)

export type  ComponentTypeDump={
    name: string,
    flipped: boolean
}

export function componentTypefromDump(dump: ComponentTypeDump): ComponentType {
    const typeFromRegister = COMPONENT_TYPES_BY_NAME[dump.name];
    if(dump.flipped) return flipped(typeFromRegister)
    return typeFromRegister
}

export function dumpComponentType(componentType: ComponentType){
    return {
        name: componentType.name,
        flipped: componentType.isFlipped
    }
}