import Component, { UNIT_SCALE } from "../game/Component";
import { block } from "../game/Component/ComponentType";
import { SpaceShip } from "../game/SpaceShip";
import * as expect from "expect";
import { calculateTorques } from "../game/Force";
import { EMPTY_INTENT } from "../game/SpaceshipIntent";

const radToDeg = (rad: number) => rad * 180 / Math.PI;


describe("Space Ship Sanity tests", () => {
  describe("Case 1 - Block thrown into space", () => {
    let ship: SpaceShip;
    beforeEach(() => {
      ship = new SpaceShip([new Component(block, { x: 0, y: 0 })]);
      ship.position = {
        x: 100,
        y: 600,
      };
      ship.velocity.x = 10;
    });

    it("Expect there to only be one force acting on the ship", () => {
      const forces = ship.getAllForces(1);
      expect(forces.length).toBe(1);
    });

    it("The force position should be the same as the center position of the first component", () => {
      const forces = ship.getAllForces(1);
      const comp = ship.components[0];
      expect(forces[0].offsetX).toBe(0);
    });

    it("Expect there to be no y component to the drag", () => {
      const forces = ship.getAllForces(1);
      expect(forces[0].y).toBeCloseTo(0);
    });
    it("Expect there to be a x component to the drag, which should be negative", () => {
      const forces = ship.getAllForces(1);
      expect(forces[0].x).toBeLessThan(1);
    });

    it("Expect no torque", () => {
      const torque = ship.getTorque(1);
      expect(torque).toBeCloseTo(0);
    });

    it("Expect the block velocity to match the ship velocity", () => {
        const block = ship.components[0];
        const vel = block.getEffectiveVelocity(ship);
        expect(vel.x).toBeCloseTo(ship.velocity.x);
        expect(vel.y).toBeCloseTo(ship.velocity.y);
    });

    it("Should move towards positive x with measured velocity decreasing", () => {
      for (let i = 0; i < 100; i++) {
        const lastX = ship.position.x;
        const lastVel = ship.velocity.x;
        const lastEnergy = ship.keneticEnergy;
        ship.update(0.1);
        expect(ship.angle).toBeCloseTo(0);
        expect(ship.position.x).toBeGreaterThan(lastX);
        expect(ship.velocity.x).toBeLessThan(lastVel);
        expect(ship.keneticEnergy).toBeLessThan(lastEnergy);
      }
    });
  });

  describe("Case 2 - Blocks spinning clockwise", () => {
    let ship: SpaceShip;
    let top: Component;
    let bottom: Component;
    const startingPosition = {
      x: 100,
      y: 600,
    }
    beforeEach(() => {
      top = new Component(block, { x: 3, y: 1 });
      bottom = new Component(block, { x: 3, y: 0 });
      ship = new SpaceShip([top, bottom]);

      ship.position = {...startingPosition };
      ship.angularVelocity = 3;
    });

    it("The space ship have a center of mass, in unit space, of (3.5, 1) because each block is 1x1", () => {
      expect(ship.getCenterOfMassUnitSpace().x).toBeCloseTo(3.5);
      expect(ship.getCenterOfMassUnitSpace().y).toBeCloseTo(1);
    });
    it("The top position should be half a UNIT_SCALE above ship's origin", () => {
      const { x, y } = top.getCenterOfMassInWorldSpace(ship);
      expect(x).toBeCloseTo(ship.position.x);
      expect(y).toBeCloseTo(ship.position.y + UNIT_SCALE / 2);
    });
    it("The bottom position should be half a UNIT_SCALE bellow ship's origin", () => {
      const { x, y } = bottom.getCenterOfMassInWorldSpace(ship);
      expect(x).toBeCloseTo(ship.position.x);
      expect(y).toBeCloseTo(ship.position.y - UNIT_SCALE / 2);
    });

    it("The top should be moving towards positive X", () => {
      const vel = top.getEffectiveVelocity(ship);
      expect(vel.x).toBeCloseTo(3 * UNIT_SCALE/2);
        expect(vel.y).toBeCloseTo(0);
    });
    it("The bottom should be moving towards negative X", () => {
      const vel = bottom.getEffectiveVelocity(ship);
      expect(vel.x).toBeCloseTo(-3 * UNIT_SCALE/2);
        expect(vel.y).toBeCloseTo(0);
    });

    it("Expect two forces acting on the ship", () => {
      const forces = ship.getAllForces(1);
      expect(forces.length).toBe(2);
    });


    const startingAngles = [
        0,
        Math.PI / 2,
        Math.PI / 4,
        Math.PI,
        2 * Math.PI,
        Math.E // arbitrary number that's not 0 or PI
    ]
    for(var i = 0; i < startingAngles.length; i++) describe(
        `Sub Case ${i+1} - Starting angle ${radToDeg(startingAngles[i]).toFixed(0)}°`,
    () => {
        const startingAngle = startingAngles[i];
        beforeEach(() => {
            ship.angle = startingAngle;
        });

      it("Expect the torque to still be counter clockwise, even after setting the angle", () => {
        const torque = ship.getTorque(1)
        expect(torque).toBeCloseTo(-1.5 * UNIT_SCALE * block.drag);
      });

      it("expect the forces to be perpendicular to the origin", () => {
        const forces = ship.getAllForces(1);
        forces.forEach((f) => {
          const vectorToOrigin = { x: f.offsetX, y: f.offsetY };
          const forceVector = { x: f.x, y: f.y };
          const dotProduct =
            vectorToOrigin.x * forceVector.x + vectorToOrigin.y * forceVector.y;
          expect(dotProduct).toBeCloseTo(0);
        });
      });

      it("After one update, it should be close to 0,0 and close to stationary", () => {
        ship.update(0.1);
        expect(ship.position.x).toBeCloseTo(startingPosition.x);
        expect(ship.position.y).toBeCloseTo(startingPosition.y);
        expect(ship.velocity.x).toBeCloseTo(0);
        expect(ship.velocity.y).toBeCloseTo(0);
      });

      it("Should slowly reduce it's angular velocity, but it's angle should be going up", () => {
        for (let i = 0; i < 2000; i++) {
          const lastAngVel = ship.angularVelocity;
          const lastAngle = ship.angle;
          const lastEnergy = ship.keneticEnergy;
          const lastForces = ship.getAllForces(1);
          const lastTorque = calculateTorques(
            lastForces,
            ship.getCenterOfMassUnitSpace()
          );
          ship.update(0.2);
          if (ship.angularVelocity < 0.001) {
            return;
          }
          const forces = ship.getAllForces(1);
          const torque = calculateTorques(
            forces,
            ship.getCenterOfMassUnitSpace()
          );
          expect(Math.abs(torque)).toBeLessThan(Math.abs(lastTorque));
          expect(torque).toBeGreaterThan(lastTorque);
          expect(ship.angularVelocity).toBeLessThanOrEqual(lastAngVel);
          expect(ship.angle).toBeLessThanOrEqual(lastAngle);
          expect(ship.keneticEnergy).toBeLessThan(lastEnergy);
          expect(ship.position.x).toBeCloseTo(startingPosition.x);
          expect(ship.position.y).toBeCloseTo(startingPosition.y);
        }
        expect(ship.angularVelocity).toBeCloseTo(0);
        expect(ship.keneticEnergy).toBeCloseTo(0);
      });
    });
  });
});
