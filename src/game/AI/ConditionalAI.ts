import { Level } from "../Level";
import { SpaceShip } from "../SpaceShip";
import SpaceshipIntent from "../SpaceshipIntent";
import { AI } from "./ai";

export type ConditionalAIClause = [AI, (ship:SpaceShip, level:Level)=>boolean];

export default class ConditionalAI implements AI {
    private clauses: ConditionalAIClause[];
    private fallback: AI;
    private level:Level;
    constructor(clauses:ConditionalAIClause[], fallback:AI) {
        this.clauses = clauses;
        this.fallback = fallback;
    }

    getIntent(ship:SpaceShip, level:Level): SpaceshipIntent {
        for (let clause of this.clauses) {
            if (clause[1](ship, this.level)) {
                return clause[0].getIntent(ship, level);
            }
        }
        return this.fallback.getIntent(ship, level);
    }
}