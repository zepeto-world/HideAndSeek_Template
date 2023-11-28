import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameMain from '../../GameMain';
import UIToast from '../../UI/UIToast';
import ActNodeBase from './ActNodeBase';
/**
 * Behavior processing: Confirm transformation model
 */
export default class ActNodeConfirmedModel extends ActNodeBase {
    Check(): boolean {
        // if (GameMain.Instance.GetGameState() == GameState.GameWait) {
        //     this.StopCoroutine(this.CoRun());
        //     return true;
        // }
        return false;
    }
    *CoRun() {
        GameMain.Instance.mUIManager.OnConfirmedModel();
    }

}