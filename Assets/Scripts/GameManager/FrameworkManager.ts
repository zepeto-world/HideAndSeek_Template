import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import LoadManager from './LoadManager';

/**
 * Framework Management Class
 */
export default class FrameworkManager extends ZepetoScriptBehaviour {
    public static loadManager: LoadManager;

    public static Init() {
        console.log("FrameworkManager Init");
        this.loadManager = LoadManager.instance;
        this.loadManager.Init();
        console.log("FrameworkManager Init succeeded");
    }
}
