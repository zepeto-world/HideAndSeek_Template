import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameMain from '../../GameMain';

import ActNodeBase from './ActNodeBase';
import AudioController from '../AudioController';
import PlayerManager from '../../GameManager/PlayerManager';
/**
 * Behavior handling: handling of the game's end state
 */
export default class ActNodeGameOver extends ActNodeBase {
    Check(): boolean {
        // if (GameMain.Instance.GetGameState() == GameState.GameWait) {
        //     this.StopCoroutine(this.CoRun());
        //     return true;
        // }
        return false;
    }
    *CoRun() {
        AudioController.Instance.PlayReadyBGM();
        GameMain.Instance.OnGameOver(GameMain.Instance.mPlayerManager.PlayerInfoMap);
    }

}