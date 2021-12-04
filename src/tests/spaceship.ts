import { block } from "../game/Component/ComponentType";
import { SpaceShip } from "../game/SpaceShip";
import * as expect from "expect";import Component from "../game/Component";


describe("spaceship", ()=>{
    describe("When newly created it should...", ()=>{
        const top =  new Component(block, {x: 3, y: 1});
        const bottom = new Component(block, {x: 3, y: 0});
        const ship: SpaceShip = new SpaceShip([
            top,
            bottom,
        ]);

        it("Should be at 0,0", ()=>{
            expect(ship.position.x).toBe(0);
            expect(ship.position.y).toBe(0);
        });
        it("Should have no velocity", ()=>{
            expect(ship.velocity.x).toBe(0);
            expect(ship.velocity.y).toBe(0);
        })
        it("should have an angle of 0", ()=>{
            expect(ship.angle).toBe(0);
        });
        it("Should have no angular velocity", ()=>{
            expect(ship.angularVelocity).toBe(0);
        });
    })
});