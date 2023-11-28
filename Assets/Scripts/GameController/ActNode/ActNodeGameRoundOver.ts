import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameMain from '../../GameMain';
import UIToast from '../../UI/UIToast';
import AudioController from '../AudioController';
import ActNodeBase from './ActNodeBase';

/**
 * Behavior processing: processing game round settlement status
 */
export default class ActNodeGameRoundOver extends ActNodeBase {
    Check(): boolean {
        // if (GameMain.Instance.GetGameState() == GameState.GameWait) {
        //     this.StopCoroutine(this.CoRun());
        //     return true;
        // }
        return false;
    }
    *CoRun() {
        AudioController.Instance.PlayReadyBGM();
        GameMain.Instance.mRoundResult = JSON.parse(GameMain.Instance.mGameInfo.RoundResult);
        GameMain.Instance.mUIManager.OnRoundOver(GameMain.Instance.mRoundResult);
        let myRoundScore = GameMain.Instance.mPlayerManager.GetMyRoundScore();
        UIToast.Instance.ShowRoundResult(GameMain.Instance.mRoundResult, GameMain.Instance.mGameInfo.GameRound, GameMain.Instance.mGameRule, myRoundScore);
        GameMain.Instance.mPlayerManager.OnRoundOver();
    }

}