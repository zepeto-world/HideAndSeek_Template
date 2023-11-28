import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameMain from '../../GameMain';
import UIToast from '../../UI/UIToast';
import AudioController from '../AudioController';
import ActNodeBase from './ActNodeBase';
/**
 * Behavior processing: handling game peak states
 */
export default class ActNodePeakMoment extends ActNodeBase {
    Check(): boolean {
        // if (GameMain.Instance.GetGameState() == GameState.GameWait) {
        //     this.StopCoroutine(this.CoRun());
        //     return true;
        // }
        return false;
    }
    *CoRun() {
        AudioController.Instance.PlayPeakBGM();
        let isHunter = GameMain.Instance.mPlayerManager.GetLocalPlayer().isHunter;
        GameMain.Instance.mUIManager.OnPeakMoment(GameMain.Instance.mGameInfo.PeekHP, isHunter);
        UIToast.Instance.ShowPeakMoment(GameMain.Instance.mGameRule.peakMomentLength, GameMain.Instance.mGameInfo.Elapsed);
        GameMain.Instance.mPlayerManager.OnPeakMoment();
    }

}