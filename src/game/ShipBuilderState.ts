import { newPlayerShip } from "./ShipDesigns/basic";
import { SpaceShip } from "./SpaceShip";

export class ShipBulderState{
    ship: SpaceShip = newPlayerShip();
}