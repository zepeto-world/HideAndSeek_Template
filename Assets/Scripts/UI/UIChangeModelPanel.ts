import { GameObject, RectTransform, Vector3 } from 'UnityEngine'
import { ZepetoScriptableObject, ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ChangeModelItem from './ChangeModelItem'
import { Button } from "UnityEngine.UI";
import { UnityEvent$1 } from "UnityEngine.Events";
import UIManager from "../GameManager/UIManager"
import ModelImageConverter from '../Model/ModelImageConverter';
/**
 * Change the UI of the transformed item
 */
export default class UIChangeModelPanel extends ZepetoScriptBehaviour {
    public mItem: GameObject;
    public mItemParent: RectTransform;
    public mChangeModelBtn: Button;
    public mRestoreBtn: Button;
    public modelImage: ZepetoScriptableObject<ModelImageConverter>;

    private mSelected: number = -1;
    private readonly DEF_MODEL: number = 99;

    Awake() {
        this.mChangeModelBtn.onClick.AddListener(() => {
            if (this.mSelected >= 0) {
                console.log("OnChanged!");
                UIManager.Instance.OnChangeModel(this.mSelected);
            }
            this.gameObject.SetActive(false);
        });

        this.mRestoreBtn.onClick.AddListener(() => {
            UIManager.Instance.OnChangeModel(this.DEF_MODEL);
            this.gameObject.SetActive(false);
        });
    }

    Start() {
        this.UIChangeModelPanel();
    }

    public UIChangeModelPanel() {
        for (var i = 0; i < this.modelImage.targetObject.modelList.length; i++) {
            if (!this.modelImage.targetObject.isHide[i]) {
                let go = GameObject.Instantiate<GameObject>(this.mItem);
                go.transform.SetParent(this.mItemParent);
                go.transform.localScale = Vector3.one;
                let img = this.modelImage.targetObject.modelList[i];
                let item = go.GetComponent<ChangeModelItem>();
                item.OnClickEvent = new UnityEvent$1<int>();

                item.OnClickEvent.AddListener((id) => {
                    this.mSelected = id;
                });
                item.SetData(img, i);
                go.SetActive(true);
            }

        }
    }


}