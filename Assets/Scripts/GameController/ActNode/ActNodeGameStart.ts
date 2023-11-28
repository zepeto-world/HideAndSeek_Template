import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameMain from '../../GameMain';
import UIToast from '../../UI/UIToast';
import AudioController from '../AudioController';
import ActNodeBase from './ActNodeBase';
/**
 * Behavior processing: handling the start state of the game
 */
export default class ActNodeGameStart extends ActNodeBase {
    Check(): boolean {
        return false;
    }
    *CoRun() {
        GameMain.Instance.mPlayer = GameMain.Instance.mPlayerManager.GetLocalPlayer();
        GameMain.Instance.mUIManager.OnGameStart(GameMain.Instance.mGameInfo, GameMain.Instance.mGameRule, GameMain.Instance.mPlayer);
        AudioController.Instance.PlayStartGameBGM();
        UIToast.Instance.ShowGameStart(GameMain.Instance.mPlayer.isHunter, GameMain.Instance.mGameRule.opendoorDelay);
        GameMain.Instance.mPlayerManager.OnGameStart();
    }

}