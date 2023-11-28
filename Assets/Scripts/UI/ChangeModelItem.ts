import { GameObject, Sprite } from 'UnityEngine';
import { Toggle, Image } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { UnityEvent$1 } from "UnityEngine.Events";

/**
 * Change the UI component of the transformed item
 */
export default class ChangeModelItem extends ZepetoScriptBehaviour {

    public mId: number;
    public mSelectBorder: GameObject;
    public mImg: Image;
    public mClickBtn: Toggle;
    public OnClickEvent: UnityEvent$1<int> = null;
    Start() {
        this.mClickBtn.onValueChanged.AddListener((value) => {
            if (this.mClickBtn.isOn) {
                this.mSelectBorder?.SetActive(value);
                if (this.OnClickEvent != null) {
                    this.OnClickEvent.Invoke(this.mId);
                }
            }
            else {
                this.mSelectBorder?.SetActive(value);
            }
        });
    }
    //id Must correspond to model
    public SetData(img: Sprite, id: number) {
        this.mId = id;
        this.mImg.sprite = img;
    }

    public Show() {
        this.mImg.enabled = true;
    }

    public Hide() {
        this.mImg.enabled = false;
    }
}