import { IDLE_AI } from "../AI/ai";
import { createCombatAI } from "../AI/CombatAI";
import Component from "../Component";
import { block, bridge, engine, flipped, lateralThruster, thruster } from "../Component/ComponentType";
import { SpaceShip } from "../SpaceShip";

export const newBasicEnemy = ()=>new SpaceShip([
        new Component(engine, {x: 0, y: 0}),
        new Component(thruster, {x: 0, y: -1}),
        new Component(thruster, {x: 1, y: -1}),
        new Component(lateralThruster, {x: -1, y: 2}),
        new Component(flipped(lateralThruster), {x: 2, y: 2}),
        new Component(lateralThruster, {x: -1, y: 0}),
        new Component(flipped(lateralThruster), {x: 2, y: 0}),
        new Component(bridge, {x: 0, y: 2}),
    ],
    createCombatAI()
);