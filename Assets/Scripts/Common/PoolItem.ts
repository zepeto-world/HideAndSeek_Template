import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import * as UnityEngine from "UnityEngine";
import PollManager from "../GameManager/PoolManager"
/**
 * Targets in the target pool
 */
export default class PoolItem extends ZepetoScriptBehaviour {

    public mAutoDestory: boolean;
    public mDelayTime: number;
    public mAutoPlay: boolean;
    public mFX: UnityEngine.ParticleSystem;

    private mtimer: number;

    OnEnable() {
        if (this.mAutoPlay) {
            if (this.mFX != null) this.mFX.Play();
        }
        if (this.mAutoDestory) {
            this.StartCoroutine(this.AutoDestroy(this.mDelayTime));
        }
    }

    OnDisable() {
        this.StopAllCoroutines();
    }


    *AutoDestroy(t: number) {
        yield new UnityEngine.WaitForSeconds(t);
        PollManager.Instance.UnSpawn(this.gameObject);
    }
}