import { newBasicEnemy } from "./ShipDesigns/basic"
import { SpaceShip } from "./SpaceShip"

type MatchState= 'blue_edit' | 'red_edit' | 'space'

export default class MatchManager {

    blueShip: SpaceShip
    redShip: SpaceShip

    private state: MatchState = 'blue_edit'
    private stateListeners: Array<(state:MatchState)=>void> = []

    constructor(){
        this.blueShip = newBasicEnemy("1")
        this.redShip = newBasicEnemy("2")
    }

    attachListener(listener:(state:MatchState)=>void){
        this.stateListeners.push(listener)
        listener(this.state)
    }

    setState(state: MatchState){
        this.state = state
        this.stateListeners.forEach(l=>l(state))
    } 
    getState():MatchState{
        return this.state
    }
    getEditingSpaceship(): SpaceShip {
        if(this.state == 'blue_edit'){
            return this.blueShip
        }else if(this.state == 'red_edit'){
            return this.redShip
        }
        throw new Error("No editing spaceship in match state "+this.state)
    }
}