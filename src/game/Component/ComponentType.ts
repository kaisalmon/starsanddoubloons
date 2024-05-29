import Component from ".";
import { CANNONBALL_AGE, CANNONBALL_SPEED } from "../Cannonball";
import { BoundingBox } from "../Collision";
import Force from "../Force";
import { SpaceShip, Weapon } from "../SpaceShip";
import SpaceshipIntent, { flipIntent } from "../SpaceshipIntent";

export const COMPONENT_TYPES_BY_NAME:Record<string, ComponentType> = {}
export default interface ComponentType{
    /* general */
    appearance: string;
    mass: number;
    drag: number;
    width: number;
    height: number;
    hitbox?: BoundingBox;
    health: number;

    /* weapon */
    weaponType?: Weapon;
    cannonballSpeed: number;
    cannonballMaxAge: number;
    cannonballFriction: number;
    inaccuracy: number;
    name: string;
    fireDelay(shotNumber:number): number;
    shots: number;
    bounces: number;
  
    /* tags */
    isBridge: boolean;
    isEngine: boolean;
    isThruster: boolean;

    /* shieldRadius */
    shieldRadius: number
    
    /* methods */
    isPowered(intent: SpaceshipIntent, component:Component, spaceship: SpaceShip):boolean;
    getThrust(powered: boolean, intent: SpaceshipIntent, component:Component, spaceship: SpaceShip): Force|undefined;
    decorateComponentType?(componentType: ComponentType): ComponentType
}

function register(componentType: ComponentType){
    COMPONENT_TYPES_BY_NAME[componentType.name] = componentType
}

export function flipped(base: ComponentType): ComponentType{
    return {
        ...base,
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
    isBridge: false,
    isEngine: false,
    isThruster: false,
    shieldRadius: 0,
    mass: 1,
    drag: 0.1,
    width: 1,
    height: 1,
    health: 1,
    shots: 1,
    bounces: 0,
    inaccuracy: 0,
    cannonballSpeed: CANNONBALL_SPEED,
    cannonballFriction: 0,
    cannonballMaxAge: CANNONBALL_AGE,
    isPowered: () => {
        return false;
    },
    getThrust(): Force|undefined {
        return undefined;
    },
    fireDelay(shotNumber:number): number {
        return 0
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
    appearance: 'wing',
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
export const grapeshot: ComponentType = {
    ...block,
    name: "Grapeshot",
    appearance: "grapecannon",
    weaponType: 'right',
    shots: 8,
    inaccuracy: Math.PI*.4,
    cannonballMaxAge: block.cannonballMaxAge / 10,
    fireDelay(shotNumber) {
        return shotNumber*1400
    },
}
register(grapeshot)

export const minicannon: ComponentType = {
    ...block,
    name: "Mini-Cannons",
    appearance: "minicannon",
    weaponType: 'right',
    shots: 5,
    inaccuracy: Math.PI/7,
    fireDelay(shotNumber) {
        return shotNumber*12000
    },
}
register(minicannon)

export const depthchargedropper: ComponentType = {
    ...block,
    name: "Depthcharge Dropper",
    appearance: "depthchargedropper",
    weaponType: 'back',
    shots: 10,
    inaccuracy: Math.PI/7,
    cannonballFriction: 0.2,
    cannonballMaxAge: CANNONBALL_AGE*3,
    cannonballSpeed: CANNONBALL_SPEED/5,
    fireDelay(shotNumber) {
        return shotNumber*8000
    },
}
register(depthchargedropper)

export const bouncingMagazine: ComponentType = {
    ...block,
    name: "Bouncing Magazine",
    appearance: "bouncingmagazine",
    health: 1,
    mass: 2,
    width: 2,
    height: 1, 
    decorateComponentType(component){
        return {
            ...component,
            bounces: component.bounces + 2
        }
    }
}   
register(bouncingMagazine)


export const multishotMagazine: ComponentType = {
    ...block,
    name: "Multishot Magazine",
    appearance: "multishotmagazine",
    health: 1,
    mass: 2,
    width: 2,
    height: 1, 
    decorateComponentType(component){
        return {
            ...component,
            shots: component.shots + 2,
            inaccuracy: component.inaccuracy + Math.PI/7,
            fireDelay(shotNumber): number{
                return component.fireDelay(shotNumber) * .75
            },
        }
    }
}   
register(multishotMagazine)

export const quickShotMagazine: ComponentType = {
    ...block,
    name: "Quickshot Magazine",
    appearance: "quickshotmagazine",
    health: 1,
    mass: 2,
    width: 2,
    height: 1, 
    decorateComponentType(component){
        return {
            ...component,
            inaccuracy: component.inaccuracy + Math.PI/9,
            cannonballSpeed: component.cannonballSpeed * 1.75,
        }
    }
}   
register(quickShotMagazine)

export const shields: ComponentType = {
    ...block,
    name: 'Shields',
    appearance: 'shield',
    shieldRadius: 3,
    isPowered: (_,__,spaceship)=>{
        return spaceship.areShieldsOnline()
    }
}
register(shields)

export type  ComponentTypeDump= string

export function componentTypefromDump(dump: ComponentTypeDump): ComponentType {
    const typeFromRegister = COMPONENT_TYPES_BY_NAME[dump];
    return typeFromRegister
}

export function dumpComponentType(componentType: ComponentType): ComponentTypeDump{
    return componentType.name
}
