import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject, Vector3, Time } from "UnityEngine";
import PlayerManager from "../GameManager/PlayerManager"

/**
 * Scan detection component
 */
export default class RadarController extends ZepetoScriptBehaviour {

    public mNormalFX: GameObject;
    public mFoundFX: GameObject;

    public mRadius: number;
    public mRepateRate: number;

    private mTimer: number = 0;

    public mSessionId: string = "";

    Update() {
        this.mTimer += Time.deltaTime;
        if (this.mTimer > this.mRepateRate) {
            this.mTimer = 0;
            this.CheckRadar();
        }
    }

    public CheckRadar() {
        let result = PlayerManager.Instance.CheckRadar(this.transform.position, this.mRadius, this.mSessionId);
        this.mNormalFX.transform.localPosition = result ? Vector3.right * 10000 : Vector3.zero;
        this.mFoundFX.transform.localPosition = !result ? Vector3.right * 10000 : Vector3.zero;
    }
}