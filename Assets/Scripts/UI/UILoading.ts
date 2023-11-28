import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Text, Image } from 'UnityEngine.UI'
import * as UnityEngine from "UnityEngine";

/**
 * Loading interface
 */
export default class UILoading extends ZepetoScriptBehaviour {

    @Header("Tip")
    public mTipTexts: string[];

    @Header("UI")
    public mTipText: Text;
    public mPercentText: Text;
    public mPercentImg: UnityEngine.RectTransform;

    private mTipIndex: number = 0;
    @Header("Default loading time")
    public mDefaultLoadingTime: number;
    private mLoadingTimer: number;
    @Header("Prompt for switching time")
    public mTipInterval: number;
    private mFixedDeltaTime: number;
    private mMaxWidth: number;
    private mDefHeight: number;
    private mWaitingTime: number;
    private mIsFinish: boolean;
    Start() {
        this.mFixedDeltaTime = UnityEngine.Time.fixedDeltaTime;
        this.mLoadingTimer = 0;
        let parentRT = this.mPercentImg.GetComponent<UnityEngine.RectTransform>();
        this.mMaxWidth = parentRT.sizeDelta.x;
        this.mDefHeight = parentRT.sizeDelta.y;
        this.mWaitingTime = 0.9 * this.mDefaultLoadingTime;
    }

    public OnFinishLoad() {
        this.mIsFinish = true;
    }

    FixedUpdate() {
        if (!this.mIsFinish && this.mLoadingTimer <= this.mWaitingTime) {
            this.mLoadingTimer += this.mFixedDeltaTime;
            let percent = this.mLoadingTimer / this.mDefaultLoadingTime;
            let v = Math.ceil(percent * 100);
            if (v >= 100) v = 100;
            this.mPercentText.text = v.toString() + "%";
            this.mPercentImg.sizeDelta = new UnityEngine.Vector2(this.mMaxWidth * percent, this.mDefHeight);
        }

        if (this.mIsFinish && this.mLoadingTimer < this.mDefaultLoadingTime) {
            this.mLoadingTimer += this.mFixedDeltaTime;
            let percent = this.mLoadingTimer / this.mDefaultLoadingTime;
            if (percent >= 1) percent = 1;
            let v = Math.ceil(percent * 100);
            if (v >= 100) v = 100;
            this.mPercentText.text = v.toString() + "%";
            this.mPercentImg.sizeDelta = new UnityEngine.Vector2(this.mMaxWidth * percent, this.mDefHeight);
        }

        if (this.mIsFinish && this.mLoadingTimer >= this.mDefaultLoadingTime) {
            this.mPercentText.text = "100%";
            this.mPercentImg.sizeDelta = new UnityEngine.Vector2(this.mMaxWidth, this.mDefHeight);
            UnityEngine.GameObject.Destroy(this.gameObject, 0.25);
        }
        if (this.mLoadingTimer > this.mTipIndex * this.mTipInterval) {
            let index = (this.mTipIndex) % this.mTipTexts.length;
            this.mTipText.text = "Tip: " + this.mTipTexts[index];
            this.mTipIndex++;
        }
    }
}