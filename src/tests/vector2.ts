import { dot, getLinearVelocityFromAngularVelocity,  getMagnitude } from "../game/Vector2";
import * as expect from "expect";

describe("getLinearVelocityFromAngularVelocity", () => {
    it("Should calculate correct magnitude, useing circumrerence to check", () => {
        const radius = 10;
        const angularVelocity = 0.12;
        const angle = 1;

        const result = getLinearVelocityFromAngularVelocity({
            radius,
            angularVelocity,
            angle
        });

        const circumference = 2 * Math.PI * radius;

        const timePerRotation = Math.PI * 2 / angularVelocity;

        const magnitude = getMagnitude(result);

        const timeToTravelCircumference =  circumference / magnitude;

        expect(timeToTravelCircumference).toBeCloseTo(timePerRotation, 2);
    });

    it("should return a vector with the correct angle, which is perpendicular to the origin", ()=>{
        const radius = 10;
        const angularVelocity = 0.12;
        const angle = 1.2; 

        const result = getLinearVelocityFromAngularVelocity({
            radius,
            angularVelocity,
            angle
        });

        const point = {
            x: Math.sin(angle) * radius,
            y: Math.cos(angle) * radius
        };
        
        const dotProduct = dot(result, point);
        expect(dotProduct).toBeCloseTo(0);
    })
});
        