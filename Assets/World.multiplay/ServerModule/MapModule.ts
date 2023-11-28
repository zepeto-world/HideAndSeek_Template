import { SandboxPlayer } from "ZEPETO.Multiplay";
import { IModule } from "./IModule";

/**
 * Map Scene Module
 * 1. Placement of items in random scenes.
 */
export default class MapModule extends IModule {
    // Total number of dynamic models.
    private readonly mDynamicModelTotal: number = 150;  

    // Number of models to be randomly placed.
    private readonly mRandomModelTotal: number = 10;    

    private mMapDynamicArray: number[] = new Array(this.mDynamicModelTotal);

    async OnCreate() {
        for (var i = 0; i < this.mDynamicModelTotal; i++) {
            this.mMapDynamicArray[i] = i;
        }
        this.onRandomDynamicModel();
    }

    async OnJoin(client: SandboxPlayer) {
    }

    async OnLeave(client: SandboxPlayer) {
    }

    async OnTick(deltaTime: number) {
    }

    /**
     * Shuffle dynamic models for random placement.
     */
    private onRandomDynamicModel() {
        for (var i = this.mDynamicModelTotal - 1; i > 1; i--) {
            // Generate a random index
            let r = Math.random() * i + "";  
            let index = parseInt(r);
            if (index >= 0 && index < this.mDynamicModelTotal) {
                let temp = this.mMapDynamicArray[i];
                this.mMapDynamicArray[i] = this.mMapDynamicArray[index];
                this.mMapDynamicArray[index] = temp;
            }
        }
        let dMaps = this.server.state.dynamicMaps;
        dMaps.models = this.mMapDynamicArray[0].toString();
        for (var i = 1; i < this.mRandomModelTotal; i++) {
            dMaps.models += "," + this.mMapDynamicArray[i].toString();
        }
        console.log("onRandomDynamicModel", dMaps.models);
    }

    /**
     * Shuffle dynamic models again after the game ends.
     */
    onGameOver() {
        this.onRandomDynamicModel();
    }


}