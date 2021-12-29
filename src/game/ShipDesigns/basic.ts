import { createCombatAI } from "../AI/CombatAI";
import Component from "../Component";
import { block, bridge, cannon, engine, flipped, lateralThruster, thruster } from "../Component/ComponentType";
import { SpaceShip } from "../SpaceShip";

export const newBasicEnemy = ()=>new SpaceShip([
        new Component(thruster, {x: 0, y: -1}),
        new Component(thruster, {x: 1, y: -1}),
        new Component(engine, {x: 0, y: 0}),
        new Component(lateralThruster, {x: -1, y: 0}),
        new Component(flipped(lateralThruster), {x: 2, y: 0}),
        new Component(cannon, {x: -1, y: 1}),
        new Component(flipped(cannon), {x: 2, y: 1}),
        new Component(cannon, {x: -1, y: 2}),
        new Component(flipped(cannon), {x: 2, y: 2}),

        new Component(block, {x: 0, y: 2}),
        new Component(block, {x: 1, y: 2}),
        new Component(block, {x: 0, y: 3}),
        new Component(block, {x: 1, y: 3}),

        new Component(lateralThruster, {x: -1, y: 3}),
        new Component(flipped(lateralThruster), {x: 2, y: 3}),
        new Component(bridge, {x: 0, y: 4}),
    ],
    createCombatAI()
);

export const newPlayerShip = ()=>new SpaceShip([
    new Component(thruster, {x: 0, y: -1}),
    new Component(thruster, {x: 1, y: -1}),
    new Component(engine, {x: 0, y: 0}),
    new Component(lateralThruster, {x: -1, y: 0}),
    new Component(flipped(lateralThruster), {x: 2, y: 0}),
    new Component(cannon, {x: -1, y: 1}),
    new Component(flipped(cannon), {x: 2, y: 1}),
    new Component(cannon, {x: -1, y: 2}),
    new Component(flipped(cannon), {x: 2, y: 2}),

    new Component(block, {x: 0, y: 2}),
    new Component(block, {x: 1, y: 2}),
    new Component(block, {x: 0, y: 3}),
    new Component(block, {x: 1, y: 3}),

    new Component(block, {x: -1, y: 3}),
    new Component(block, {x: 2, y: 3}),
    new Component(block, {x: -1, y: 4}),
    new Component(block, {x: 2, y: 4}),
    new Component(block, {x: -1, y: 5}),
    new Component(block, {x: 2, y: 5}),

    new Component(lateralThruster, {x: -2, y: 3}),
    new Component(flipped(lateralThruster), {x: 3, y: 3}),
    new Component(bridge, {x: 0, y: 4}),
],
createCombatAI()
);

export const newSpinnyBlock = ()=>new SpaceShip([
        new Component(engine, {x: 0, y: 0}),
        new Component(cannon, {x: -1, y: 0}),
        new Component(flipped(cannon), {x: 2, y: 1}),
        new Component(lateralThruster, {x: -1, y: 1}),
        new Component(flipped(lateralThruster), {x: 2, y: 0}),
    ],
    createCombatAI()
);