import { GameObject } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

/**
 * Object pool
 */
export default class PoolManager extends ZepetoScriptBehaviour {

    private _pool: Map<string, GameObject[]> = new Map<string, GameObject[]>();

    private static _instance: PoolManager;
    public static get Instance(): PoolManager {
        return PoolManager._instance;
    }

    prefabs: GameObject[] = [];

    Awake() {
        PoolManager._instance = this;
    }

    public Init() {

    }

    /**
     * Get objects from object pool
     * @param prefabName
     * @returns
     */
    Spawn(prefabName: string): GameObject {
        let result: GameObject;
        if (!this._pool.has(prefabName)) {
            this._pool.set(prefabName, []);
        }
        let isGetObject: boolean = false;
        for (let i = 0; i < this._pool.get(prefabName).length; i++) {
            let item = this._pool.get(prefabName)[i];
            if (item.activeSelf === false) {
                result = item;
                isGetObject = true;
                break;
            }
        }
        // If not in the object pool, create one
        if (!isGetObject) {
            let prefab: GameObject;
            for (let i = 0; i < this.prefabs.length; i++) {
                if (this.prefabs[i].name === prefabName) {
                    prefab = this.prefabs[i];
                }
            }
            result = GameObject.Instantiate<GameObject>(prefab);
            result.name = prefabName;

            this._pool.get(prefabName).push(result);
        }
        result.SetActive(true);
        return result;
    }


    /**
     * Recycling objects
     * @param obj 
     */
    UnSpawn(obj: GameObject) {
        if (this._pool.has(obj.name)) {
            obj.transform.SetParent(this.transform);
            obj.SetActive(false);
            this._pool.get(obj.name).push(obj);
        }
    }

    /**
     * Creating Objects with Prefabricated Bodies
     * @param prefabName 
     * @returns 
     */
    CreatePrefab(prefabName: string): GameObject {
        let prefab: GameObject = null;
        for (let i = 0; i < this.prefabs.length; i++) {
            if (this.prefabs[i].name === prefabName) {
                prefab = this.prefabs[i];
            }
        }
        if (prefab == null) {
            console.error("prefab is null");
            return null;
        }
        return GameObject.Instantiate<GameObject>(prefab);
    }

}
