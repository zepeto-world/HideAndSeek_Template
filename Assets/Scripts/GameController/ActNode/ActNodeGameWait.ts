import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameMain from '../../GameMain';
import UIToast from '../../UI/UIToast';
import ActNodeBase from './ActNodeBase';

/**
 * Behavior processing: handling game waiting states
 */
export default class ActNodeGameWait extends ActNodeBase {
    Check(): boolean {
        // if (GameMain.Instance.GetGameState() == GameState.GameWait) {
        //     this.StopCoroutine(this.CoRun());
        //     return true;
        // }
        return false;
    }
    *CoRun() {
        console.log("actnode  gamewait");
        UIToast.Instance.ShowGameWait();
        GameMain.Instance.mUIManager.OnGameWait();
    }

}