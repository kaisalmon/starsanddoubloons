import { createCombatAI } from "../AI/CombatAI";
import { PLAYER_AI } from "../AI/PlayerAI";
import Component from "../Component";
import { block, bridge, cannon, engine, flipped, lateralThruster, thruster } from "../Component/ComponentType";
import { SpaceShip } from "../SpaceShip";

export const newBasicEnemy = (id:string)=>new SpaceShip(id, [
        new Component(thruster, {x: 0, y: -1}),
        new Component(thruster, {x: 1, y: -1}),
        new Component(engine, {x: 0, y: 0}),
        new Component(lateralThruster, {x: -1, y: 0}),
        new Component(lateralThruster, {x: 2, y: 0},true),
        new Component(cannon, {x: -1, y: 1}),
        new Component(cannon, {x: 2, y: 1},true),

        new Component(lateralThruster, {x: -1, y: 2}),
        new Component(lateralThruster, {x: 2, y: 2}, true),
        new Component(bridge, {x: 0, y: 2}),
    ],
    createCombatAI()
);

export const newPlayerShip = (id: string)=>new SpaceShip(id, [
    new Component(thruster, {x: 0, y: -1}),
    new Component(thruster, {x: 1, y: -1}),
    new Component(block, {x: -1, y: -1}),
    new Component(block, {x: 2, y: -1}),
    new Component(block, {x: -1, y: 0}),
    new Component(block, {x: 2, y: 0}),
    new Component(thruster, {x: -1, y: -2}),
    new Component(thruster, {x: 2, y: -2}),
    new Component(engine, {x: 0, y: 0}),
    new Component(lateralThruster, {x: -2, y: 0}),
    new Component(lateralThruster, {x: 3, y: 0}),
    new Component(cannon, {x: -1, y: 1}),
    new Component(cannon, {x: 2, y: 1}),
    new Component(cannon, {x: -1, y: 2}),
    new Component(cannon, {x: 2, y: 2}),

    new Component(block, {x: 0, y: 2}),
    new Component(block, {x: 1, y: 2}),
    new Component(block, {x: 0, y: 3}),
    new Component(block, {x: 1, y: 3}),
    new Component(block, {x: 0, y: 4}),
    new Component(block, {x: 1, y: 4}),
    new Component(block, {x: 0, y: 5}),
    new Component(block, {x: 1, y: 5}),
    new Component(cannon, {x: -1, y: 5}),
    new Component(cannon, {x: 2, y: 5}),


    new Component(lateralThruster, {x: -1, y: 4}),
    new Component(lateralThruster, {x: 2, y: 4}),

    new Component(bridge, {x: 0, y: 6}),
],
createCombatAI()
);

export const newSpinnyBlock = (id:string)=>new SpaceShip(id, [
        new Component(engine, {x: 0, y: 0}),
        new Component(cannon, {x: -1, y: 0}),
        new Component(cannon, {x: 2, y: 1}),
        new Component(lateralThruster, {x: -1, y: 1}),
        new Component(lateralThruster, {x: 2, y: 0}),
    ],
    createCombatAI()
);