import { Socket } from "socket.io"
import { newBasicEnemy } from "./ShipDesigns/basic"
import { SpaceShip } from "./SpaceShip"

type MatchState= 'blue_edit' | 'red_edit' | 'space'
type MatchStateListener = (from:MatchState|null, to:MatchState)=>void
export default class MatchManager {

    blueShip: SpaceShip
    redShip: SpaceShip

    private state: MatchState = 'blue_edit'
    private stateListeners: Array<MatchStateListener> = []
    private socket: Socket
    gameId: string

    constructor(socket:Socket){
        this.blueShip = newBasicEnemy("1")
        this.redShip = newBasicEnemy("2")
        this.socket = socket

        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('gameId')!
        this.gameId = gameId

        socket.on(`game ${this.gameId}`, (msg)=>{
            if(!msg.state) return
            this.setState(msg.state, false)
        })
    }

    attachListener(listener:MatchStateListener){
        this.stateListeners.push(listener)
        listener(null, this.state)
    }

    setState(state: MatchState, emit=true){
        const oldState = this.state
        this.state = state
        this.stateListeners.forEach(l=>l(oldState, state))
        if(emit)this.socket.emit(`game ${this.gameId}`, {
            state
        })
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