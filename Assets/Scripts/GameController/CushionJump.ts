import { Collider, GameObject } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import PlayerManager from '../GameManager/PlayerManager';
import AudioController from './AudioController';
import ZepetoNetPlayer from '../NetTransform/ZepetoNetPlayer';

/**
 * Spring pad jump
 */
export default class CushionJump extends ZepetoScriptBehaviour {

    private _originalJumpPower: number;
    private _originalGravity: number;

    OnTriggerEnter(collider: Collider) {
        if (collider.gameObject.tag != "Player") return;
        if (PlayerManager.Instance == null)
            return;
        let netPlayer = collider.gameObject.GetComponent<ZepetoNetPlayer>();
        if (netPlayer == null) return;
        let canJump = PlayerManager.Instance.CheckCanJump(netPlayer.sessionId);
        if (canJump == false) return;
        this._originalJumpPower = netPlayer.mJumpPower;
        this._originalGravity = netPlayer.mGravity;
        netPlayer.mJumpPower = 14;
        netPlayer.mGravity = 2;
        netPlayer.SetJumpOver();
        netPlayer.sessionId
        netPlayer.Jump();
        AudioController.Instance.PlayJump();
    }

    OnTriggerExit(collider: Collider) {
        if (collider.gameObject.tag != "Player")
            return;
        let netPlayer = collider.gameObject.GetComponent<ZepetoNetPlayer>();
        if (netPlayer == null) return;
        netPlayer.mJumpPower = this._originalJumpPower;
        netPlayer.mGravity = this._originalGravity;
    }


}