import Component from "../game/Component";
import { cannon, flipped } from "../game/Component/ComponentType";
import { SpaceShip } from "../game/SpaceShip";
import * as expect from "expect";
import { GameLevel } from "../game/Level";
import * as sinon from 'sinon'
import { calculateTorque } from "../game/Force";

describe("Spaceaship with two cannon just firing to spin in a circle", ()=>{
   let ship:SpaceShip;

    beforeEach(()=>{
        const top =  new Component(cannon, {x: 0, y: 1});
        const bottom = new Component(cannon, {x: 0, y: 0});
        ship = new SpaceShip([
            top,
            bottom,
        ]);
        ship.level = sinon.createStubInstance(GameLevel);
    });

    const angles = [
        0,
        0.1,
        Math.PI,
        Math.PI + 0.1,
        Math.PI * 2 - 0.1,
        Math.PI * 4,
    ]
    for(const angle of angles){
        it(`Should have a positive torque when firing, even with an angle of ${angle}`, ()=>{
            ship.angle = 0.123;
            ship.fire("left");
            ship.fire("right");
            const torque = ship.getTorque(1);
            expect(torque).toBeGreaterThan(0);
        });
    }
       
    it("Should not slow down spinning if it keeps having an impulse added at 0,1 to the right", ()=>{
        for(let i = 0; i < 100; i++){
            const prevAngularVelocity = ship.angularVelocity;
            ship.impulses.push({
                x: 10,
                y: 0,
                offsetX: 0,
                offsetY: 1
            });
            ship.update(0.01);
            const angularVelocity = ship.angularVelocity;
            expect(angularVelocity).toBeGreaterThan(prevAngularVelocity);
        }
    });
    it("Should not slow down spinning if it keeps having an impulse added at 0,-1 to the left", ()=>{
        for(let i = 0; i < 100; i++){
            const prevAngularVelocity = ship.angularVelocity;
            ship.impulses.push({
                x: -10,
                y: 0,
                offsetX: 0,
                offsetY: -1
            });
            ship.update(0.01);
            const angularVelocity = ship.angularVelocity;
            expect(angularVelocity).toBeGreaterThan(prevAngularVelocity);
        }
    });


    it("Should not slow down spinning if it keeps having an impulse added at 0,1 to the right *relative to the ship*", ()=>{
        ship.angle = 0;
        for(let i = 0; i < 100; i++){
            const prevAngularVelocity = ship.angularVelocity;
            const theta = ship.angle;
            const f = {
                x: 10 * Math.sin(theta + Math.PI/2),
                y: 10 * Math.cos(theta + Math.PI/2),
                offsetX: Math.sin(theta),
                offsetY: Math.cos(theta)
            }
            const torqueBeforeImpulse = ship.getTorque(0.01);
            ship.impulses.push(f);
            const torque = ship.getTorque(0.01);
            const torqueFromImpulse = torque - torqueBeforeImpulse;
            expect(torqueFromImpulse).toBeCloseTo(10)
            ship.update(0.01);
            const angularVelocity = ship.angularVelocity;
            expect(angularVelocity).toBeGreaterThan(prevAngularVelocity)
        }
    });

    it("Should not slow down spinning if it keeps firing", ()=>{
        for(let i = 0; i < 100; i++){
            const prevAngularVelocity = ship.angularVelocity;
            ship.fire("left");
            ship.fire("right");
            expect(ship.impulses.length).toBe(2);
            const impulse = ship.impulses[0]
            const torqueFromImpulse = calculateTorque(impulse);
            expect(torqueFromImpulse).toBeGreaterThan(0);
            ship.update(0.01);
            const angularVelocity = ship.angularVelocity;
            expect(angularVelocity).toBeGreaterThan(prevAngularVelocity);
        }
    });
})