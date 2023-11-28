import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Text, Button } from 'UnityEngine.UI'
import { GameObject, RectTransform, Vector3 } from "UnityEngine";
import UIManager from "../GameManager/UIManager"
import WatchItem from './WatchItem';

export class WatchGameNode {
    sessionId: string;
    name: string;
    isLive: boolean;
}

/**
 * Watch List Panel
 */
export default class UIWatchGameView extends ZepetoScriptBehaviour {

    public mItemPrefab: GameObject;
    public mContainer: RectTransform;
    public mDisplayName: Text;
    public mWatchViewObj: GameObject;
    public mWatchBtn: Button;

    private mItemList: Map<string, GameObject> = new Map<string, GameObject>();
    Awake() {
        this.mWatchBtn.onClick.AddListener(() => {
            this.mWatchViewObj.SetActive(true);
        });
        this.mItemPrefab.SetActive(false);
    }

    public UpdateContentData(data: Map<string, WatchGameNode>) {

        console.log("Update Watch List");

        this.ClearItem();
        let isFirst: boolean = false;
        data.forEach((node, sessionId) => {
            if (node.isLive) {
                let itemObj = GameObject.Instantiate<GameObject>(this.mItemPrefab, this.mContainer);
                itemObj.SetActive(true);
                itemObj.transform.localScale = Vector3.one;
                if (this.mDisplayName.text == "") this.mDisplayName.text = node.name;
                this.mItemList.set(sessionId, itemObj);
                let item = itemObj.GetComponent<WatchItem>();
                item.SetItem(node);
                let itemBtn = itemObj.GetComponent<Button>();
                if (!isFirst && node.isLive) {
                    isFirst = true;
                    this.ChooseWatchItem(item);
                }
                itemBtn.onClick.AddListener(() => {
                    this.ChooseWatchItem(item);
                })
            }
        })
    }

    private _currentChooseItem: WatchItem;
    private ChooseWatchItem(item: WatchItem) {
        if (this._currentChooseItem) {
            this._currentChooseItem.SetSelect(false);
        }
        let sessionId = item.data.sessionId;
        console.log(`Watch ${sessionId}`);
        this.mDisplayName.text = item.data.name;
        UIManager.Instance.OnWatchCamera(sessionId);
        this.mWatchViewObj.SetActive(false);
        this._currentChooseItem = item;
        this._currentChooseItem.SetSelect(true);
    }

    private ClearItem() {
        this._currentChooseItem = undefined;
        if (this.mItemList.size == 0) return;
        this.mItemList.forEach((item, sessionId) => {
            GameObject.Destroy(item);
        })
    }

}