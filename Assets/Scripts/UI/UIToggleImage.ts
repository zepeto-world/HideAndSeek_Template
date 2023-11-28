import { Sprite } from 'UnityEngine';
import { Toggle, Image, Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from '../Common/Localization/Scripts/Localization';

/**
 * Toggle Component encapsulation
 */
export default class UIToggleImage extends ZepetoScriptBehaviour {
    public Target: Image;
    public OnImage: Sprite;
    public OffImage: Sprite;
    private toggle: Toggle

    public mChangeText: boolean = false;
    public mTargetText: Text;
    public mOnTextKey: string;
    public mOffTextKey: string;


    Start() {
        this.toggle = this.GetComponent<Toggle>();
        this.toggle.onValueChanged.AddListener((v) => {
            if (v) {
                this.Target.sprite = this.OnImage;
                if (this.mChangeText) {
                    this.mTargetText.text = Localization.Instance.GetLocalizedText(this.mOnTextKey);
                }
            } else {
                this.Target.sprite = this.OffImage;
                if (this.mChangeText) {
                    this.mTargetText.text = Localization.Instance.GetLocalizedText(this.mOffTextKey);
                }
            }
        });
    }

}