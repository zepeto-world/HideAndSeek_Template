import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import FrameworkManager from './GameManager/FrameworkManager';
import GameMain from './GameMain';
enum FWState {
    NULL,
    DOAWAKE,
    DOSTART,
    LOADING,
    DOUPDATE,
}

/**
 * Program main entrance
 */
export default class FrameworkEnter extends ZepetoScriptBehaviour {
    private FWState: number;
    Awake() {

    }

    Start() {
        this.FWState = FWState.DOAWAKE;
    }

    Update() {
        switch (this.FWState) {
            case FWState.DOAWAKE:
                console.log("FrameworkEnter Init");
                // Framework initialization
                FrameworkManager.Init(); 
                // Game initialization
                GameMain.Instance.DoInit(); 
                console.log("FrameworkEnter Init success");
                this.FWState = FWState.DOSTART;
                console.log("FrameworkEnter start running");
                break;
            case FWState.DOSTART:
                GameMain.Instance.DoStart();
                this.FWState = FWState.DOUPDATE;
                break;
            case FWState.DOUPDATE:
                GameMain.Instance.DoUpdate();
                break;
        }
    }


    FixedUpdate() {
    }

}

