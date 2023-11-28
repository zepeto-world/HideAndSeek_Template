import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import * as UnityEngine from "UnityEngine";

/**
 * Configuration management
 */
export default class ConfigManager extends ZepetoScriptBehaviour {

    public mPlayerInfoJson: UnityEngine.TextAsset;
    public mModelInfoJson: UnityEngine.TextAsset;

    // Movement speed and camera distance configuration of different factions
    private mPlayerInfoVO: PlayerInfoVO[]; 
    // The configuration of the initial model. (The collision of the transformation model can be directly set in the prefabricated body of the transformation model)    
    private mModelInfoVO: ModelInfoVO[]; 
    static GAME_HEART_RATE = 5;


    /* Singleton */

    private static _instance: ConfigManager;
    public static get Instance(): ConfigManager {
        return ConfigManager._instance;
    }

    Awake() {
        ConfigManager._instance = this;
        this.mPlayerInfoVO = JSON.parse(this.mPlayerInfoJson.text);
        this.mModelInfoVO = JSON.parse(this.mModelInfoJson.text);
    }

    /**
     * Obtain configuration information for different faction characters
     * @param playerRole 
     * @returns 
     */
    public GetPlayerInfoVO(playerRole: number): PlayerInfoVO {
        for (var i = 0; i < this.mPlayerInfoVO.length; i++) {
            if (this.mPlayerInfoVO[i].playerRole == playerRole) {
                return this.mPlayerInfoVO[i];
            }
        }
    }

    /**
     * Obtain configuration information for the model
     * @param name 
     * @returns 
     */
    public GetModelInfoVO(name: string): ModelInfoVO {
        for (var i = 0; i < this.mModelInfoVO.length; i++) {
            if (this.mModelInfoVO[i].name === name) {
                return this.mModelInfoVO[i];
            }
        }
    }
}

class PlayerInfoVO {
    playerRole: number;
    runSpeed: number;
    jumpPower: number;
    zoomMin: number;
    zoomMax: number;
}

class ModelInfoVO {
    name: string;
    centerY: number;
    radius: number;
    height: number;
}
