import Component from "../game/Component";
import { block, leftWing, rightWing } from "../game/Component/ComponentType";
import { sum } from "../game/Force";
import { SpaceShip } from "../game/SpaceShip"
import { EMPTY_INTENT } from "../game/SpaceshipIntent";
import * as expect from "expect";
import { constantAI } from "../game/AI/ai";

const startingPosition = { x: 100, y: 400}
const FORWARD_INTENT = {
    ...EMPTY_INTENT,
    moveForward: true,
}
describe("Physics Sanity Test - Thrust", () => {
    describe("Test Case One", () => {
        let ship:SpaceShip;
        beforeEach(() => {
            ship = new SpaceShip([
                new Component(block, {x: 0, y: 1}),
                new Component(block, {x: 0, y: 0}),
                new Component(leftWing, {x: -2, y: 0}),
                new Component(rightWing, {x: 1, y: 0}),
            ]);
            ship.position = {...startingPosition}
        });

        it("should have a thrust of 0, with no intent", () => {
            const forces = ship.getAllForces()
            const totalForce = sum(forces);
            expect(totalForce.x).toBe(0);
            expect(totalForce.y).toBe(0);
        });

        it("Should have positive thrust, with intent to go forward", () => {
            ship.ai = constantAI(FORWARD_INTENT);
            const forces = ship.getAllForces()
            const totalForce = sum(forces);
            expect(totalForce.x).toBe(0);
            expect(totalForce.y).toBeGreaterThan(0);
        });

        it("Should have zero torque, with intent to go forwards", () => {
            ship.ai = constantAI(FORWARD_INTENT);
            const torque = ship.getTorque();
            expect(torque).toBe(0);
        });

        it("Should rapidly accelorate", () => {
            ship.ai = constantAI(FORWARD_INTENT);
            for(let i = 0; i < 1000; i++){
                const prevY = ship.position.y;
                const prevVelY = ship.velocity.y;
                ship.update( 0.1)
                try{
                    expect(ship.getTorque()).toBe(0);
                    expect(ship.angle).toBe(0);
                    expect(ship.position.y).toBeGreaterThan(prevY);
                    expect(ship.velocity.y).toBeGreaterThanOrEqual(prevVelY);
                    expect(ship.position.x).toBeCloseTo(startingPosition.x, 1)
                }catch(e){
                    console.log(ship.angle)
                    console.log(ship.getAllForces())
                    throw e;
                }
            }

        });
    });
});