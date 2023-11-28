import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { WatchGameNode } from './UIWatchGameView';
import { Text } from 'UnityEngine.UI'

/**
 * Watch List Item
 */
export default class WatchItem extends ZepetoScriptBehaviour {

    public nameText: Text;
    public data: WatchGameNode;

    public SetItem(data: WatchGameNode) {
        this.data = data;
        this.nameText.text = data.name;
    }

    public SetSelect(isSelect: boolean) {
        this.transform.GetChild(0).gameObject.SetActive(isSelect);
    }

}