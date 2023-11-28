import { Camera, GameObject, RenderTexture, Vector3, Quaternion, Transform, LayerMask, Animator, AnimatorOverrideController, RuntimeAnimatorController } from 'UnityEngine';
import { RawImage, ScrollRect, Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import LeaderboardItem from './LeaderboardItem';
import { sPlayerInfo } from "ZEPETO.Multiplay.Schema";
import PlayerManager from "../GameManager/PlayerManager"
import AudioController from '../GameController/AudioController';
import { SpawnInfo, ZepetoCharacterCreator } from 'ZEPETO.Character.Controller';

/**
 * Game Settlement Panel
 */
export default class UIGameOverPanel extends ZepetoScriptBehaviour {

    public mFirstName: Text;
    public mMyRank: Text;
    public mMyScore: Text;
    public mCoundDownTimer: Text;
    public mLeaderboardItem: GameObject
    public mScrollView: ScrollRect;
    private leaderboardItemObjs: GameObject[];
    public mRawImage: RawImage;
    public mRTCamera: Camera;
    public mCheerAnimatorController: RuntimeAnimatorController;

    private characterObj: GameObject;

    Awake() {
        this.leaderboardItemObjs = [];
        this.leaderboardItemObjs.push(this.mLeaderboardItem);
        this.mLeaderboardItem.SetActive(false);
    }

    public Show(playerInfoMap: Map<number, sPlayerInfo>) {
        // playerInfoMap.forEach((playerInfo, id) => {
        //     console.error("playerInfo:", JSON.stringify(playerInfo), "id:", id);
        // });
        AudioController.Instance.PlayGameOver();
        let playerInfoArray = [];
        playerInfoMap.forEach((playerInfo, id) => {
            if (id != 0) {        
                // Remove an empty data
                playerInfoArray.push(playerInfo);
            }
        });
        playerInfoArray.sort((a, b) => {
            return b.score - a.score;
        });

        for (let i = 0; i < this.leaderboardItemObjs.length; i++) {
            const obj = this.leaderboardItemObjs[i];
            obj.SetActive(false);
        }

        let myRank = 0;
        let myScore = 0;
        for (let i = 0; i < playerInfoArray.length; i++) {
            var go: GameObject;
            if (i > this.leaderboardItemObjs.length - 1) {
                go = GameObject.Instantiate<GameObject>(this.mLeaderboardItem, this.mScrollView.content);
                this.leaderboardItemObjs.push(go);
            }
            else {
                go = this.leaderboardItemObjs[i];
            }
            let playerInfo = playerInfoArray[i];
            if (playerInfo.sessionId == PlayerManager.Instance.mSessionId) {
                myScore = playerInfo.score;
                myRank = i + 1;
            }
            let rank = i + 1;
            go.GetComponent<LeaderboardItem>().SetPlayerInfoData(playerInfo, rank);
            go.SetActive(true);
        }
        this.mFirstName.text = playerInfoArray[0].nickName;
        this.ShowPlayer(playerInfoArray[0].sessionId);
        this.mMyRank.text = myRank.toString();
        this.mMyScore.text = myScore.toString();
    }

    /**
     * Create a player model
     * @param sessionId 
     * @returns 
     */
    private ShowPlayer(sessionId: string) {
        let zepetoPlayer = PlayerManager.Instance.GetPlayer(sessionId);
        if (!zepetoPlayer) {
            return;
        }
        let zepetoContext = zepetoPlayer.character.Context;
        let parent = zepetoContext.transform.parent;
        let spawnInfo: SpawnInfo = new SpawnInfo();
        spawnInfo.position = parent.position;
        spawnInfo.rotation = parent.rotation;
        ZepetoCharacterCreator.CreateModelByUserId(zepetoPlayer.userId, spawnInfo, (go) => {
            this.characterObj = go;
            let playerTransforms = this.characterObj.GetComponentsInChildren<Transform>();
            playerTransforms.forEach(e => {
                e.gameObject.layer = LayerMask.NameToLayer("RTPlayer");
            });
            go.transform.SetParent(parent);
            go.transform.localPosition = Vector3.zero;
            go.transform.localScale = Vector3.one;
            go.transform.localRotation = Quaternion.identity;
            // Set camera mount point
            let cameraPos = new GameObject("RTCameraPos");
            cameraPos.transform.parent = this.characterObj.transform;
            cameraPos.transform.localPosition = Vector3.zero;
            cameraPos.transform.localRotation = Quaternion.identity;
            this.mRTCamera.gameObject.transform.parent = cameraPos.transform;
            this.mRTCamera.gameObject.transform.localPosition = new Vector3(0, 0.62, 4.3);
            this.mRTCamera.gameObject.transform.localEulerAngles = new Vector3(0, 180, 0);
            this.PlayerCheerAnimation();
        });
    }

    /**
     * Play player celebration animation
     */
    PlayerCheerAnimation() {
        let animator = this.characterObj.GetComponentInChildren<Animator>(true);
        if (animator) {
            let overrideController = new AnimatorOverrideController();
            overrideController.runtimeAnimatorController = this.mCheerAnimatorController;
            animator.runtimeAnimatorController = overrideController;
        }
    }

    OnEnable() {
        this.mRTCamera.targetTexture = this.mRawImage.texture as RenderTexture;
        this.mRTCamera.gameObject.SetActive(true);
    }

    OnDisable() {
        this.mRTCamera.targetTexture = null;
        this.mRTCamera.gameObject.SetActive(false);
        GameObject.DestroyImmediate(this.characterObj);
    }
}
