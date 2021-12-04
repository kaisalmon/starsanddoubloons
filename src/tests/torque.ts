import Force, { calculateTorques } from "../game/Force";
import * as expect from "expect";

describe("Torque Calculations", function() {
    it("Calculates zero when given no forces", ()=>{
        const forces: Force[] = [];
        const torque: number = calculateTorques(forces);
        expect(torque).toBe(0);
    })
    it("Calculates zero when given a force AT the CoM", ()=>{
        const forces: Force[] = [
            {x: 4, y: 0, offsetX: 2, offsetY: 3},
        ]
        const torque: number = calculateTorques(forces, {x: 2, y: 3});
        expect(torque).toBeCloseTo(0);
    })
    it("Calcualtes zero when the force is perpendicular to the origin", ()=>{
        const forces: Force[] = [
            {x: 0, y: 4, offsetX: 2, offsetY: 3},
        ]
        const torque: number = calculateTorques(forces, {x: 2, y: 3});
        expect(torque).toBeCloseTo(0);
    });
    it("Calcualtes zero when the force is perpendicular to the origin, the other way", ()=>{
        const forces: Force[] = [
            {x: 0, y: -4, offsetX: 2, offsetY: 3},
        ]
        const torque: number = calculateTorques(forces, {x: 2, y: 3});
        expect(torque).toBeCloseTo(0);
    });
    it("Calculates zero when given balanced forces", ()=>{
        const forces: Force[] = [
            {x: 4, y: 0, offsetX: 1, offsetY: 3},
            {x: 4, y: 0, offsetX: -1, offsetY: 3},
        ]
        
        const torque: number = calculateTorques(forces, {x: 3, y: 3});
        expect(torque).toBeCloseTo(0);
    })

    it("Calculates the torque of one clockwise force correctly", ()=>{
        const forces: Force[] = [
            {x: 3, y: 0, offsetX: 0, offsetY: 2},
        ]
        const torque: number = calculateTorques(forces, {x: 0, y: 0});
        expect(torque).toBeCloseTo(6);
    })

    it("Calculates the torque of one counterclockwise force correctly", ()=>{
        const forces: Force[] = [
            {x: -3, y: 0, offsetX: 0, offsetY: 2},
        ]
        const torque: number = calculateTorques(forces, {x: 0, y: 0});
        expect(torque).toBeCloseTo(-6);
    })


    it("Calculates the torque of two forces, if one is rotated 180 deg", ()=>{
        const forces: Force[] = [
            {x: 3, y: 0, offsetX: 0, offsetY: 2},
            {x: -3, y: 0, offsetX: 0, offsetY: -2},
        ]
        const torque: number = calculateTorques(forces, {x: 0, y: 0});
        expect(torque).toBeCloseTo(12);
    })

    it("Calculates the torque of two forces, if one is rotated 90 deg", ()=>{
        const forces: Force[] = [
            {x: 3, y: 0, offsetX: 0, offsetY: 2},
            {x: 0, y: -3, offsetX: 2, offsetY: 0},
        ]
        const torque: number = calculateTorques(forces, {x: 0, y: 0});
        expect(torque).toBeCloseTo(12);
    })


});