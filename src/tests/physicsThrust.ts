import Component from "../game/Component";
import { leftWing, rightWing } from "../game/Component/ComponentType";
import { sum } from "../game/Force";
import { SpaceShip } from "../game/SpaceShip"
import { EMPTY_INTENT } from "../game/SpaceshipIntent";
import * as expect from "expect";

describe("Physics Sanity Test - Thrust", () => {
    describe("Test Case One", () => {
        let ship:SpaceShip;
        beforeEach(() => {
            ship = new SpaceShip([
                new Component(leftWing, {x:0, y:0}),
                new Component(rightWing, {x:2, y:0}),
            ]);
        });

        it("should have a thrust of 0, with no intent", () => {
            const forces = ship.getAllForces(EMPTY_INTENT)
            const totalForce = sum(forces);
            expect(totalForce.x).toBe(0);
            expect(totalForce.y).toBe(0);
        });
    });
});