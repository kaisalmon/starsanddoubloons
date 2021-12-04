import Component, { UNIT_SCALE } from "./Component";
import Force, { calculateTorques, sum } from "./Force";
import SpaceshipIntent from "./SpaceshipIntent";
import Vector2 from "./Vector2";


export class SpaceShip { 
    components: Component[];
    
    position: Vector2;
    velocity: Vector2; //Absolute velocity
    angle: number;
    angularVelocity: number;

    get mass(): number {
        return this.components.reduce((acc, component) => acc + component.mass, 0);
    }

    get keneticEnergy(): number {
        return this.components.reduce((acc, component) =>
            acc + component.getKeneticEnergy(this), 0);
    }

    constructor(components: Component[]) {
        this.components = components;
        this.velocity = {x: 0, y: 0};
        this.angle = 0;
        this.angularVelocity = 0;
        this.position = {x: 0, y: 0};
    }

    // Return center of mass, measured in component units (not worldspace)
    getCenterOfMassUnitSpace(): Vector2 {
        let centerOfMass: Vector2 = {x: 0, y: 0};
        for(let component of this.components){
            centerOfMass.x += (component.position.x + component.width / 2) * component.mass;
            centerOfMass.y += (component.position.y + component.height / 2) * component.mass;
        }
        centerOfMass.x /= this.mass;
        centerOfMass.y /= this.mass;
        return centerOfMass;
    }

    getCenterOfMassInRotatedShipSpace(): Vector2 {
        const centerOfMass: Vector2 = this.getCenterOfMassUnitSpace();
        const angle = this.angle;
        return {
            x: centerOfMass.x * Math.cos(angle) * UNIT_SCALE - centerOfMass.y * Math.sin(angle) * UNIT_SCALE,
            y: centerOfMass.x * Math.sin(angle) * UNIT_SCALE + centerOfMass.y * Math.cos(angle) * UNIT_SCALE
        };
    }

    getCenterOfMassWorldSpace(): Vector2 {
        const centerOfMass: Vector2 = this.getCenterOfMassInRotatedShipSpace();
        return {
            x: this.position.x,
            y: this.position.y
        };
    }

    getAllForces(intent: SpaceshipIntent): Force[] {
        return this.components.map(component => component.getTotalForce(intent, this));
    }

    getTorque(intent: SpaceshipIntent): number {
        const forces: Force[] = this.getAllForces(intent);
        return  calculateTorques(forces);
    }

    update(intent: SpaceshipIntent, delta: number): void {
        const forces: Force[] = this.getAllForces(intent);
        const torque: number = this.getTorque(intent);
        const totalForce: Vector2 = sum(forces);
        this.velocity.x += totalForce.x / this.mass * delta;
        this.velocity.y += totalForce.y / this.mass * delta;
        this.angularVelocity += torque / this.mass * delta;
        this.position.x += this.velocity.x * delta;
        this.position.y += this.velocity.y * delta;
        this.angle += this.angularVelocity * delta;
    }
}
