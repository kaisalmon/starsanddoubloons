import { createCombatAI } from "../AI/CombatAI";
import Component from "../Component";
import { block, leftLateralThruster, rightLateralThruster, thruster } from "../Component/ComponentType";
import { SpaceShip } from "../SpaceShip";

export const newBasicEnemy = ()=>new SpaceShip([
        new Component(block, {x: 0, y: 0}),
        new Component(leftLateralThruster, {x: -1, y: -1}),
        new Component(leftLateralThruster, {x: -1, y: 1}),
        new Component(rightLateralThruster, {x: 1, y: -1}),
        new Component(rightLateralThruster, {x: 1, y: 1}),
        new Component(thruster, {x: 0, y: -1}),
    ],
    createCombatAI()
);