import { Vector } from "matter";
import Force, { rotate, sum } from "../Force";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";
import Vector2, { getLinearVelocityFromAngularVelocity } from "../Vector2";
import ComponentType from "./ComponentType";

const EPSILON = 0.001;
export const UNIT_SCALE = 40;

export default class Component {
    type: ComponentType;
    position: Vector2; // Relative position of the component to the spaceship's top left corner

    constructor(type: ComponentType, position: Vector2) {
        this.type = type;
        this.position = position;
    }

    get width(): number {
        return this.type.width;
    }
    get height(): number {
        return this.type.height;
    }
    get mass(): number {
        return this.type.mass;
    }

    //Calculate the thrust of the component, offset to this component's center x,y (not the x,y of the component)
    getThrust(intent: SpaceshipIntent, spaceship: SpaceShip): Force|undefined {
        const force: Force = this.type.getThrust(intent, spaceship);
        if(!force){
            return undefined;
        }
        const offsetForce: Force = {
            offsetX: force.offsetX + this.position.x + this.type.width / 2,
            offsetY: force.offsetY + this.position.y + this.type.height / 2,
            x: force.x,
            y: force.y
        };
        return rotate(offsetForce, spaceship.angle);
    }

    //Calculate the drag of the component, offset to this component's center x,y (not the x,y of the component)
    getDrag(spaceship: SpaceShip): Force {
        const dragCoefficient: number = this.type.drag;
        const velocity = this.getEffectiveVelocity(spaceship);
        const {x: ox, y: oy} = this.getCenterOfMassInWorldSpace(spaceship);
        const force: Force = {
            x: -velocity.x * dragCoefficient,
            y: -velocity.y * dragCoefficient,
            offsetX: ox - spaceship.position.x, 
            offsetY: oy - spaceship.position.y
        };
       
        return force;
    }

    getTotalForce(intent: SpaceshipIntent, spaceship: SpaceShip): Force {
        const thrust = this.getThrust(intent, spaceship);
        if(!thrust){
            return this.getDrag(spaceship);
        }
        return sum([this.getDrag(spaceship), thrust]);
    }

    // Get effective velcolity, taking into account the spaceship velocity and spaceship rotation
    getEffectiveVelocity(spaceship: SpaceShip):Vector2 {
        const baseVelocity: Vector2 = {x: spaceship.velocity.x, y: spaceship.velocity.y};
        const velocityFromRotation: Vector2 = this.getVelocityFromRotation(spaceship);
        return { 
            x: baseVelocity.x + velocityFromRotation.x,
            y: baseVelocity.y + velocityFromRotation.y
        }
    }

    // Given the spaceship, the position of the component, and the center of mass, calculate the amount the rotational velocity of the spaceship contributes to the 
    // components velocity
    // EXAMPLE
    // Component is at x: 3, y: 3
    // Center of mass is at x: 3, y: 0
    // Rotational velocity is 10
    // Then the relative position is (0, 3)
    // So the angle relative to the center of mass is 0
    // so the component velocity is (10 * 3, 0) or (30, 0)
    getVelocityFromRotation(spaceship: SpaceShip): Vector2 {
        const shipCoM = spaceship.getCenterOfMassWorldSpace();
        const componentCoM = this.getCenterOfMassInWorldSpace(spaceship);
        const relativePosition = {
            x: componentCoM.x - shipCoM.x,
            y: componentCoM.y - shipCoM.y        };
        const radius = Math.sqrt(relativePosition.x * relativePosition.x + relativePosition.y * relativePosition.y);
        const angle = Math.atan2(relativePosition.x, relativePosition.y);

        return getLinearVelocityFromAngularVelocity({
            angle,
            radius,
            angularVelocity: spaceship.angularVelocity
        })

    }

    getCenterOfMassInWorldSpace(spaceship: SpaceShip): Vector2 {
        const centerOfMass = spaceship.getCenterOfMassUnitSpace();
        let x = this.position.x - centerOfMass.x + this.width/2;
        let y = this.position.y - centerOfMass.y + this.height/2;
        let rotatedX = x * Math.cos(spaceship.angle) - y * Math.sin(spaceship.angle);
        let rotatedY = x * Math.sin(spaceship.angle) + y * Math.cos(spaceship.angle);
        return {x: rotatedX * UNIT_SCALE + spaceship.position.x, y: rotatedY * UNIT_SCALE+ spaceship.position.y};
    }

    getKeneticEnergy(spaceship:SpaceShip): number {
        const vel = this.getEffectiveVelocity(spaceship);
        return 0.5 * this.mass * (vel.x * vel.x + vel.y * vel.y);
    }
}


