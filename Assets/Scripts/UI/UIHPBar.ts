import { Input, KeyCode, RectTransform, Vector2 } from 'UnityEngine';
import { Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class UIHPBar extends ZepetoScriptBehaviour {
    public redImage: Image;
    public peakImage: Image;
    private _maxValue: number;
    private _currentValue: number;
    private _peakAddValue: number;
    private _peakMaxValue: number;

    public InitHPBar(maxValue: number, peakAddValue: number) {
        this._maxValue = maxValue;
        this._peakAddValue = peakAddValue;
        this._peakMaxValue = maxValue + peakAddValue;
    }

    public SetValue(currentValue: number) {
        if (isNaN(currentValue) || currentValue < 0) {
            console.error("current HPValue is error:", currentValue);
            currentValue = 0;
        }

        this._currentValue = currentValue;
        let img: Image;
        let maxValue;
        if (this._currentValue <= this._maxValue) {
            img = this.redImage;
            maxValue = this._maxValue;
            if (this.peakImage.gameObject.activeSelf) {
                this.peakImage.gameObject.SetActive(false);
            }
            if (!this.redImage.gameObject.activeSelf) {
                this.redImage.gameObject.SetActive(true);
            }
        }
        else if (this._currentValue > this._maxValue) {
            img = this.peakImage;
            maxValue = this._peakMaxValue;
            if (!this.peakImage.gameObject.activeSelf) {
                this.peakImage.gameObject.SetActive(true);
            }
            if (this.redImage.gameObject.activeSelf) {
                this.redImage.gameObject.SetActive(false);
            }
        }
        // console.error("maxValue:", maxValue, "currentValue:", currentValue);
        if (maxValue) {
            img.fillAmount = currentValue / maxValue;
        }
    }

}