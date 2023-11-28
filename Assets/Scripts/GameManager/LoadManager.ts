import { GameObject, JsonUtility, Rect, Resources, Sprite, TextAsset, Texture2D, Vector2 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
/**
 * Resource loading management class
 */
export default class LoadManager extends ZepetoScriptBehaviour {

    private static _instance: LoadManager;
    public static get instance(): LoadManager {
        if (LoadManager._instance === null) {
            LoadManager._instance = new LoadManager();
        }
        return LoadManager._instance;
    }
    Awake() {
        LoadManager._instance = this;
    }

    Init() {

    }

    ResLoad_jsonData(fileName: string): JSON {
        let txt = Resources.Load(fileName) as TextAsset;
        console.log("ResLoad_jsonData:" + txt);
        return JSON.parse(txt.text);
    }

    ResLoad_texture2d(fileName: string) {
        let texture2D = Resources.Load(fileName) as Texture2D;
        if (!texture2D) {
            console.error("can't find texture:", fileName);
        }
        return texture2D;
    }

    ResLoad_sprite(fileName: string) {
        let texture2D = this.ResLoad_texture2d(fileName);
        return Sprite.Create(texture2D, new Rect(0, 0, texture2D.width, texture2D.height), new Vector2(0.5, 0.5));
    }
    ResLoad_PrefabObj(fileName: string) {
        var pfb = Resources.Load("Prefabs/" + fileName);
        return GameObject.Instantiate(pfb) as GameObject;
    }
    ResLoad_InstancePfb(pfb: GameObject) {
        return GameObject.Instantiate(pfb) as GameObject;
    }


}