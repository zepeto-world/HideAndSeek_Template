import BaseManager from './BaseManager'
import { GameObject, Time, Vector3 } from 'UnityEngine';
import { GameState } from "./NetManager"
import { sDynamicMap } from 'ZEPETO.Multiplay.Schema';

/**
 * Map Scene Manager
 * 1. Scene loading completed
 * 2. Dynamic map changes
 * 3. Opening and closing doors
 */
export default class MapManager extends BaseManager {


    private static _instance: MapManager;
    public static get Instance(): MapManager {

        return MapManager._instance;
    }

    public mAudioCtrl: GameObject;

    public mDynamicModels: GameObject[];

    private dynamicMap: sDynamicMap;

    Awake() {
        MapManager._instance = this;
    }

    /* Collider */
    public mReadyWall: GameObject;
    private mStartAngle: Vector3;
    public mEndAngle: Vector3;

    private mIsOpenDoor: boolean = true;


    OnDisable() {
        if (this.gameObject == null)
            return;
        if (this.mIsOpenDoor && this.mReadyWall != null) {
            this.mReadyWall.transform.eulerAngles = this.mEndAngle;
        }
    }

    // Check if the door needs to be opened
    UpdateCheck() {
        if (this.mIsOpenDoor) {
            if (this.mGameState == GameState.GameStart) {
                this.OnCloseDoor();
            }
        }

        if (this.mGameState == GameState.OpenDoor && !this.mIsOpenDoor) {
            this.OnOpenDoor();
        }
    }

    /**
     * Open the door
     */
    OnOpenDoor() {
        console.error("OnOpenDoor");
        this.mIsOpenDoor = true;
        this.StartCoroutine(this.IE_DestoryWall());
    }

    /**
     * Close the door
     */
    OnCloseDoor() {
        console.error("OnCloseDoor");
        this.mIsOpenDoor = false;
        this.mReadyWall.transform.eulerAngles = this.mStartAngle;
    }

    *IE_DestoryWall() {
        let timer = 0;
        let animTime = 1;
        while (timer < animTime) {
            timer += Time.deltaTime;
            this.mReadyWall.transform.eulerAngles = Vector3.Lerp(
                this.mStartAngle, this.mEndAngle, timer
            );
            yield null;
        }
        this.mReadyWall.transform.eulerAngles = this.mEndAngle;
    }

    /**
     * Scene loading completed
     * @param userId 
     * @returns 
     */
    OnFinishLoad(userId: any) {
        let door = GameObject.Find("Room_BG/Door");
        if (door != null) {
            this.mStartAngle = door.transform.eulerAngles;
            this.mReadyWall = door;
            this.mReadyWall.transform.eulerAngles = this.mEndAngle;
        }
        // Scenario model configuration that requires dynamic changes
        let dynamicObjContent = GameObject.Find("DynamicObjects");
        if (dynamicObjContent == null) {
            return;
        }
        if (this.mDynamicModels == null) {
            this.mDynamicModels = new Array<GameObject>();
        }
        let childCount = dynamicObjContent.transform.childCount;
        for (var i = 0; i < childCount; i++) {
            let child = dynamicObjContent.transform.GetChild(i);
            if (child != null) {
                this.mDynamicModels.push(child.gameObject);
            }
        }
        this.DealDynamicMap();
    }

    /**
     * Dynamic map changes
     * @param dynamicMaps 
     */
    OnDynamicMapChange(dynamicMaps: sDynamicMap) {
        this.dynamicMap = dynamicMaps;
    }

    private DealDynamicMap() {
        if (this.dynamicMap == null || this.dynamicMap.models == null) {
            console.error("There are currently no random models referenced in the scene");
            return;
        }
        for (var i = 0; i < this.mDynamicModels.length; i++) {
            this.mDynamicModels[i].SetActive(false);
        }
        console.log(this.dynamicMap.models);
        let models = this.dynamicMap.models.split(',');
        for (var i = 0; i < models.length; i++) {
            let index = parseInt(models[i]);

            if (index < this.mDynamicModels.length) {
                this.mDynamicModels[index].SetActive(true);
            }
        }
    }
}