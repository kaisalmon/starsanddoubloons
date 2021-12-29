import Vector2 from "./Vector2";

export default interface Force{
    offsetX: number;
    offsetY: number;
    x: number;
    y: number;
}

export function fromMagnitudeAndAngle(magnitude: number, angle: number): Force{
    const force: Force = {
        offsetX: 0,
        offsetY: 0,
        x: 0,
        y: 0
    };
    force.x = magnitude * Math.cos(angle);
    force.y = magnitude * Math.sin(angle);
    return force;
}

// Returns a new force, where the offset and the force direction are rotated arround the origin 
export function rotate(force: Force, angle: number): Force{
    const rotatedForce: Force = {
        offsetX: 0,
        offsetY: 0,
        x: 0,
        y: 0
    };
    rotatedForce.offsetX = force.offsetX * Math.cos(angle) - force.offsetY * Math.sin(angle);
    rotatedForce.offsetY = force.offsetX * Math.sin(angle) + force.offsetY * Math.cos(angle);
    rotatedForce.x = force.x * Math.cos(angle) - force.y * Math.sin(angle);
    rotatedForce.y = force.x * Math.sin(angle) + force.y * Math.cos(angle);
    return rotatedForce;
}

// Given an array of forces, return a new force which is the sum of all forces, and with an offset of 0
export function sum(forces: Force[]): Force{
    const sumForce: Force = {
        offsetX: 0,
        offsetY: 0,
        x: 0,
        y: 0
    };
    for(const force of forces){
        sumForce.x += force.x;
        sumForce.y += force.y;
        sumForce.offsetX += force.offsetX;
        sumForce.offsetY += force.offsetY;
    }
    sumForce.offsetX /= forces.length;
    sumForce.offsetY /= forces.length;
    return sumForce;
}

// Calculate the torque, of a force applied at an offset, with the point of rotation at (0,0)
export function calculateTorque(force: Force): number{
    return force.x * force.offsetY - force.y * force.offsetX;
}

// Given an array of forces, calculate the torque acted upon the origin point
export function calculateTorques(forces: Force[], offset?:Vector2): number{
    let torque = 0;
    for(const force of forces){
        const offsetForce = offset ? {
            offsetX: force.offsetX - offset.x,
            offsetY: force.offsetY - offset.y,
            x: force.x,
            y: force.y
        } : force;
        torque += calculateTorque(offsetForce);
    }
    return torque;
}