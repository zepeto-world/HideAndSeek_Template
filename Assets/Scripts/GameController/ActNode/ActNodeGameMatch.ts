import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameMain from '../../GameMain';
import UIToast from '../../UI/UIToast';
import AudioController from '../AudioController';
import ActNodeBase from './ActNodeBase';
/**
 * Behavior processing: Confirm transformation model

 */
export default class ActNodeGameMatch extends ActNodeBase {
    Check(): boolean {
        // if (GameMain.Instance.GetGameState() == GameState.GameWait) {
        //     this.StopCoroutine(this.CoRun());
        //     return true;
        // }
        return false;
    }
    *CoRun() {
        console.log("actnode  ActNodeGameMatch");
        AudioController.Instance.PlayTimeout();
        GameMain.Instance.mUIManager.OnGameReady();
        UIToast.Instance.ShowReadyCountDown(GameMain.Instance.mGameInfo.GameMatchTime);
    }
}