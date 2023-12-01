import { SpawnInfo, ZepetoCamera, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { AudioListener, CharacterController, GameObject, HumanBodyBones, LayerMask, Material, MeshRenderer, Quaternion, Time, Transform, Vector2, Vector3, WaitForSeconds, Camera, CapsuleCollider, Renderer } from "UnityEngine";
import { sGameInfo, sPlayer, sPlayerInfo, sVector3 } from "ZEPETO.Multiplay.Schema";
import { sEventArg, GameState } from "./NetManager"
import { RoomData } from "ZEPETO.Multiplay";
import BaseManager from './BaseManager'
import PoolManager from '../GameManager/PoolManager'
import { WatchGameNode } from '../UI/UIWatchGameView'
import { ZepetoWorldHelper, Users } from 'ZEPETO.World'
import ZepetoNetPlayer from '../NetTransform/ZepetoNetPlayer';
import TransformHelper from '../Common/TransformHelper';
import IKCtrl from '../Common/IKCtrl';
import UIToast from '../UI/UIToast';
import UIHunterOperation from '../UI/UIHunterOperation';
import RadarController from '../GameController/RadarController';
import { ItemWeightMap } from '../Data/ItemWeight';
import GameMain from '../GameMain';
import LoadManager from './LoadManager';

/**
 * player status
 * 1、Character creation
 * 2、Mobile state control
 * 3、Character State Control
 * 4、Character camera switching
 * 5、Player flashlight status control 
 * 6、Calculation of flashlight injury
 * 7、Player Game Logic Processing
 */
class PlayerGameStatus {
    public model: number;
    public isOnDragEnd: boolean;
    public star: number = 0;
    public HP: number = 0;
    public buff: number = 0;
    public buffNum: number = 0;
}

export enum ActionEvent {
    OnDie = "OnDie",
    OnUpdateHP = "OnUpdateHP",
    OnUpdateStar = "OnUpdateStar",
    OnFinishLoad = "OnFinishLoad",
    OnUpdateBuff = "OnUpdateBuff",
    OnLockCamera = "OnLockCamera",
    OnFreeCamera = "OnFreeCamera",
    OnWatchCamera = "OnWatchCamera",
}

/**
 * Flashlight status
 */
export enum LightState {
    ON = 1,
    OFF = 2,
}

/**
 * Player Movement Status
 */
enum MoveState {
    DragEnd = 0,
    DragBegin = 1,
    DragMove = 2,
    Rotate = 3,
    Attack = 4,
}

/**
 * Player camp
 */
enum PlayerRole {
    Free = 0,
    Hider = 1,
    Hunter = 2,
}

/**
 * Invisible Buff
 */
enum BuffState {
    None = 0,
    Hide = 1,
}

const mChangeModelFX: string = "FX_ChangeModel";
const mModelRunFX: string = "FX_Run";
const mDieFX: string = "FX_Die";
const mAddHPFX: string = "FX_AddHP";
const mRadarFX: string = "FX_Radar";
const mRadarInFX: string = "FX_RadarIn";

/**
 * Character creation、move、State switching、Control of operation
 */
export default class PlayerManager extends BaseManager {

    /* Singleton */
    private static _instance: PlayerManager;
    public static get Instance(): PlayerManager {
        return PlayerManager._instance;
    }

    private GoodsData = new ItemWeightMap();
    public mGunPrefab: GameObject;
    public mLightPfb: GameObject;

    public mOutlineMat: Material;
    public mGoodMat: Material;
    public mGoodHideMat: Material;
    public mFreeCamera: Transform;
    public mHunterCamera: Camera;
    public ThrDCanvas: GameObject;
    public mHunterCameraPos: Vector3;
    public mGhost: GameObject;

    /* Player Map */
    private mPlayerInfoMap: Map<number, sPlayerInfo> = new Map<number, sPlayerInfo>();
    private mPlayerSessionMap: Map<string, sPlayer> = new Map<string, sPlayer>();
    private mPlayerGameStatusMap: Map<number, PlayerGameStatus> = new Map<number, PlayerGameStatus>(); // player status

    public mSessionId: string;
    public saveSessionId: string;
    private mUserId: string;
    private mId: number;
    private mLocalPlayer: ZepetoPlayer;
    private mLocalCamera: ZepetoCamera;
    private mLockMove: boolean;

    private mInitCameraAngle: Vector3;

    public get LocalPlayer(): ZepetoPlayer { return this.mLocalPlayer; }
    public get LocalCamera(): ZepetoCamera { return this.mLocalCamera; }

    public get GetUserId(): string { return this.mUserId; }

    public get PlayerInfoMap(): Map<number, sPlayerInfo> { return this.mPlayerInfoMap; }


    /* Sync setting */
    // Continuously moving in a certain direction, synchronizing every x seconds
    private mKeepMoveInterval: number = 0.05;
    private mMoveTimer: number = 0;
    private muiMoveDir: Vector2;
    private mMoveState: MoveState = MoveState.DragEnd;
    private mZepetoNetPlayerMap: Map<string, ZepetoNetPlayer> = new Map<string, ZepetoNetPlayer>();
    public mLocalZepetoNetPlayer: ZepetoNetPlayer = null;
    /* Load */
    private mLoadedPlayerNum: number = 0;

    public wallmat: Material;
    public mSuperLightPfb: GameObject;
    public mInitPos: GameObject;

    Awake() {
        PlayerManager._instance = this;
    }

    Start() {

        ZepetoPlayers.instance.OnAddedLocalPlayer.AddListener(() => {
            this.OnAddLocalPlayer();
        });

        ZepetoPlayers.instance.OnAddedPlayer.AddListener((sessionId: string) => {
            this.OnAddPlayer(sessionId);
        });
    }

    OnAddLocalPlayer() {
        this.mLocalPlayer = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer;
        this.mLocalCamera = ZepetoPlayers.instance.LocalPlayer.zepetoCamera;
        this.mLocalCamera.camera.gameObject.tag = "MainCamera";
        this.mHunterCamera.transform.SetParent(this.mLocalCamera.camera.transform);
        this.mHunterCamera.transform.localPosition = this.mHunterCameraPos;
        this.mHunterCamera.transform.localEulerAngles = Vector3.zero;
        this.mHunterCamera.transform.localScale = Vector3.one;
        this.SetHunterCamera(true);
        this.mLocalCamera.cameraParent.localEulerAngles = this.mInitCameraAngle;
        GameObject.Instantiate<GameObject>(
            this.ThrDCanvas, this.mLocalCamera.camera.transform
        );
    }

    private mIsFirstFinishLoad: bool = false;
    OnAddPlayer(sessionId: string) {
        this.mLoadedPlayerNum++;
        if (this.mLoadedPlayerNum == (this.mPlayerInfoMap.size - 1)) {
            if (!this.mIsFirstFinishLoad) {
                this.OnActionEvent(ActionEvent.OnFinishLoad, this.mUserId);
                let ids: string[] = [this.mUserId];
                ZepetoWorldHelper.GetUserInfo(ids, (info: Users[]) => {
                    const data = new RoomData();
                    data.Add("nickName", info[0].name);
                    this.SendEvent(sEventArg.ClientReady, data);
                }, (error) => {
                    console.log(error);
                });
                this.mIsFirstFinishLoad = true;
            }
        }
        const player = this.mPlayerSessionMap.get(sessionId);
        player.OnChange += (changeValues) => this.OnStateSync(sessionId, player);
        let character = this.GetCharacter(sessionId);
        character.name = player.id.toString();
        character.gameObject.layer = LayerMask.NameToLayer("Player");
        character.gameObject.tag = "Player";
        character.enabled = false;
        let isLocal = this.mSessionId == sessionId;
        let zepetoNetPlayer = character.gameObject.AddComponent<ZepetoNetPlayer>();
        zepetoNetPlayer.sessionId = sessionId;
        let IKCmp = character.gameObject.transform.GetChild(0).gameObject;
        let ikboj = new GameObject("WeaponRoot");
        zepetoNetPlayer.weaponInRoot = character.ZepetoAnimator.GetBoneTransform(HumanBodyBones.RightHand);
        zepetoNetPlayer.weaponOutRoot = IKCmp.transform;
        ikboj.transform.parent = zepetoNetPlayer.weaponOutRoot;
        ikboj.transform.localPosition = new Vector3(0.158, 0.591, 0.066);
        ikboj.transform.localEulerAngles = new Vector3(55.7, 48.45, -36.5);
        zepetoNetPlayer.SetIKCtrl(IKCmp.AddComponent<IKCtrl>());
        zepetoNetPlayer.GetIKCtrl().ikActive = false;
        zepetoNetPlayer.weaponObj = GameObject.Instantiate<GameObject>(this.mGunPrefab, zepetoNetPlayer.weaponInRoot);
        zepetoNetPlayer.weaponObj.name = "Weapon";
        zepetoNetPlayer.HandLightObj = zepetoNetPlayer.weaponObj.transform.GetChild(0).gameObject;
        zepetoNetPlayer.IKCtrl.ikObj = ikboj.transform;
        zepetoNetPlayer.mLightTar = this.mHunterCamera.transform.GetChild(0).transform;

        //Add a scanning light
        zepetoNetPlayer.objLight = GameObject.Instantiate<GameObject>(
            this.mLightPfb, zepetoNetPlayer.weaponObj.transform);
        zepetoNetPlayer.objLight.name = "Light";
        zepetoNetPlayer.objLight.SetActive(false);

        //Super light column
        zepetoNetPlayer.objSuperLight = GameObject.Instantiate<GameObject>(
            this.mSuperLightPfb, zepetoNetPlayer.weaponObj.transform);
        zepetoNetPlayer.objSuperLight.name = "SuperLight";
        zepetoNetPlayer.objSuperLight.SetActive(false);

        this.mZepetoNetPlayerMap.set(sessionId, zepetoNetPlayer);
        if (isLocal) {
            this.mLocalZepetoNetPlayer = zepetoNetPlayer;
            this.mLocalZepetoNetPlayer.mId = player.id;
            this.mLocalZepetoNetPlayer.mIsLocal = true;
            character.gameObject.AddComponent<AudioListener>();
            if (this.mInitPos) {
                var zptChar = this.GetCharacter(this.mSessionId);
                //console.log("SetPlayerInitPos", msg, posobj, this.mSessionId, zptChar);
                zptChar.Teleport(this.mInitPos.transform.position, this.mInitPos.transform.rotation);
                this.mLocalZepetoNetPlayer.transform.localRotation = this.mInitPos.transform.localRotation;
                this.mLocalZepetoNetPlayer.transform.position = this.mInitPos.transform.position;
            }
        }


        this.OnSetPlayerInfoByVO(sessionId, 0);
        // Need to delay for a while to initialize user status
        if (!isLocal) {
            this.StartCoroutine(this.CoDealyOnSyncRomotePlayer(sessionId, player));
        }
    }

    /**
     * Synchronize flashlight status
     * @param msg 
     */
    SyncLightAction(msg: string) {
        var d = msg.split("|");
        let netPlayer = this.GetZepetoNetPlayer(d[0]);
        let sta = (Number)(d[1]);
        netPlayer.SetLightAction(sta);
    }

    /**
     * Sending flashlight status
     * @param sta 
     */
    SendLightState(sta: LightState) {
        this.SendEvent(sEventArg.SwitchLight, sta);
    }

    SendSuperLightState(sta: LightState) {
        this.SendEvent(sEventArg.SwitchSuperLight, sta);
    }

    OnSetPlayerInfoByVO(sessionId: string, playerLevel: number) {
        if (sessionId != null) {
            let playerInfoVO = this.GetPlayerInfoVO(playerLevel);
            let player = this.GetZepetoNetPlayer(sessionId);
            if (player != null) {
                player.mRunSpeed = playerInfoVO.runSpeed;
                player.mJumpPower = playerInfoVO.jumpPower;
            }
            if (sessionId == this.mSessionId) {
                ZepetoPlayers.instance.cameraData.minZoomDistance = playerInfoVO.zoomMin;
                ZepetoPlayers.instance.cameraData.maxZoomDistance = playerInfoVO.zoomMax;
                console.log("Set the camera, distance : " + playerInfoVO.zoomMax);
            }
        }
    }

    Update() {
        if (this.mLocalPlayer == null) return;
        this.UpdateCamera();
    }

    FixedUpdate() {
        if (this.mLocalPlayer == null) return;
        this.OnUpdateDragMove();
    }

    /**
     * Reset camera to initialization state
     */
    ResetCamera() {
        this.mIsWatchCamera = false;
        this.mIsFreeCamera = false;
        this.mIsLockCamera = false;
        this.mFreeCamera.gameObject.SetActive(false);
        this.ShowGhost(false);
    }

    /**
     * Switch viewing angles, free views, and locked views
     */
    UpdateCamera() {
        if (this.mIsWatchCamera) {
            this.OnWatchCameraUpdate();
        } else if (this.mIsFreeCamera) {
            this.OnFreeCameraUpdate();
        } else if (!this.mIsLockCamera) {
            this.OnUpdateCharacterAngle();
        }
    }

    /* Player Camera Control start */
    private mIsLockCamera: boolean = false;
    private mIsFreeCamera: boolean = false;
    private mIsWatchCamera: boolean = false;
    private mWatchTarget: Transform = null;
    private mWatchOffsetPos: Vector3 = new Vector3(0, 3, -2);
    private mWatchOffsetRot: Vector3 = new Vector3(45, 0, 0);
    private mIsFollowCamera: boolean = false;
    private mFollowCamera: Transform = null;
    private mFreeCameraTarget: Vector3;
    private mLockAngle: Vector3 = Vector3.zero;

    /**
     * Lock perspective
     * @param isLock 
     */
    public LockCamera(isLock: boolean) {
        console.log("Lock perspective", isLock);
        this.mIsLockCamera = isLock;
        if (isLock) {
            this.mLockAngle = this.mLocalCamera.cameraParent.eulerAngles;
            this.mLocalZepetoNetPlayer.StopMoving();
        }
        else {
            this.mLocalCamera.cameraParent.eulerAngles = this.mLockAngle;
        }
    }

    /**
     * Free camera perspective
     * @param isOn 
     */
    public FreeCamera(isOn: boolean) {
        console.log("Free perspective", isOn);
        this.mIsFreeCamera = isOn;
        this.mFreeCamera.gameObject.SetActive(isOn);
        if (isOn) {
            this.mFreeCameraTarget = Vector3.zero;
            this.mFreeCamera.position = this.mLocalCamera.cameraParent.position;
            // this.mFreeCamera.LookAt(this.mLocalCamera.cameraParent.position);
            this.mFreeCamera.eulerAngles = this.mLocalCamera.cameraParent.eulerAngles;
        }
    }

    /**
     * Free camera perspective after death     
     */
    public DieFreeCamera() {
        this.FreeCamera(true);
        this.ShowGhost(true);
    }

    /**
     * Display Ghost Status
     * @param visiable 
     */
    private ShowGhost(visiable: boolean) {
        this.mGhost.SetActive(visiable);
    }

    public OnFreeCameraUpdate() {
        this.mFreeCamera.position += this.mFreeCameraTarget * Time.deltaTime * 4;
        this.mFreeCamera.transform.eulerAngles = this.mLocalCamera.cameraParent.eulerAngles;
    }

    public WatchCamera(isWatch: boolean, sessionId: string) {
        console.log("Spectator view", isWatch);
        this.mIsWatchCamera = isWatch;
        this.mFreeCamera.gameObject.SetActive(isWatch);
        if (isWatch) {
            this.mWatchTarget = this.GetZepetoNetPlayer(sessionId).transform;

        } else {
            this.mWatchTarget = null;
        }
    }

    public OnWatchCameraUpdate() {
        if (this.mWatchTarget != null) {
            TransformHelper.SetCameraFlower(this.mFreeCamera, this.mWatchTarget, 2.5, 2.5, 3);
        }
    }

    /**
     * Set Finder Camera
     * @param isOn 
     */
    public SetHunterCamera(isOn: boolean) {
        this.mLocalCamera.camera.enabled = true;
        this.mHunterCamera.enabled = false;
        if (isOn) {
            this.mHunterCamera.gameObject.SetActive(true);
        } else {
            this.mHunterCamera.gameObject.SetActive(false);
        }
    }
    /* Player Camera Control end */


    /* Jump start */
    Jump() {
        if (this.mLockMove || this.mIsLockCamera) return;
        this.mLocalZepetoNetPlayer.Jump();
    }
    /* Jump end */

    /* Player Character Control Start */
    private mPreCameraAngleY: number = 0;
    // 1 degree error  
    private mAngleBlance: number = 100;

    /**
     * Synchronize player rotation angle
     */
    OnUpdateCharacterAngle() {
        // 1 degree error 
        let angle_y = Math.round(this.mLocalCamera.cameraParent.eulerAngles.y * 100);
        let angle_dis = Math.abs(angle_y - this.mPreCameraAngleY);
        if (angle_dis > this.mAngleBlance) {
            this.mPreCameraAngleY = angle_y;
            this.mLocalZepetoNetPlayer.UpdateAngel(this.mPreCameraAngleY * 0.01)
        }
    }

    /**
     * Start dragging
     * @returns 
     */
    OnDragBegin() {
        if (this.mLockMove || this.mIsLockCamera) return;
        this.mMoveState = MoveState.DragBegin;
    }

    /**
     * Drag End, Move End
     */
    OnDragEnd() {
        this.mFreeCameraTarget = Vector3.zero;
        this.mMoveState = MoveState.DragEnd;
        this.mLocalZepetoNetPlayer.StopMoving();
    }

    /**
     * Move in the direction of drag
     * @param moveDir 
     * @returns 
     */
    OnDragMove(moveDir: Vector2) {
        // Control camera movement
        if (this.mIsFreeCamera) {
            this.mFreeCameraTarget = (this.mFreeCamera.transform.forward * moveDir.y + this.mFreeCamera.transform.right * moveDir.x);
            return;
        }
        if (this.mLockMove || this.mIsLockCamera) return;
        this.mMoveState = MoveState.DragMove;
        this.mLocalZepetoNetPlayer.StartMove(moveDir);
        this.muiMoveDir = moveDir;
        this.mMoveTimer = 0;
    }

    /**
     * Fixed time interval synchronous movement
     */
    OnUpdateDragMove() {
        if (this.mMoveState == MoveState.DragMove && !this.mLockMove && !this.mIsLockCamera) {
            this.mMoveTimer += Time.fixedDeltaTime;
            if (this.mMoveTimer > this.mKeepMoveInterval) {
                this.OnDragMove(this.muiMoveDir);
                this.mMoveTimer = 0;
            }
        }
    }

    /**
     * @description: Synchronize player information status
     */
    public OnPlayerChange(players: any) {
        players.ForEach((sessionId: string, player: sPlayer) => {
            if (!this.mPlayerSessionMap.has(sessionId)) {
                this.mPlayerSessionMap.set(sessionId, player);
                if (!this.mPlayerInfoMap.has(player.id)) {
                    this.SendEvent(sEventArg.PlayerInfoSync, new RoomData());
                }
            }
        });
    }

    /**
     * @description: Accept player mobile data
     * 
     * @param: id -> id
     * @param: index -> packageIndex
     * @param: data : moveDataJson
     */
    OnReceiveMoveData(message: any) {
        let result = JSON.parse(message.data);
        let id = result.id;
        if (this.mPlayerInfoMap.has(id)) {
            let userInfo = this.mPlayerInfoMap.get(id);
            let netPlayer = this.mZepetoNetPlayerMap.get(userInfo.sessionId);
            if (netPlayer != null) netPlayer.ReceiveMoveData(message.data);
        }
    }

    /**
     * @description: Synchronize player status
     */
    OnStateSync(sessionId: string, player: sPlayer) {
        // console.error(`[${"OnSyncRomotePlayer"}] ${player.moveState}`);
        const zepetoCharacter = this.GetCharacter(sessionId);
        let playerStatus = this.mPlayerGameStatusMap.get(player.id);
        if (player.model != playerStatus.model) {
            playerStatus.model = player.model;
            this.OnChangeModel(zepetoCharacter, player.model);
            if (sessionId == this.mSessionId) {
                this.OnChangeModelCamera(player.model);
            } else if (this.mGameState >= GameState.GameStart) {
                // After the game starts, As a seeker, Synchronize and add outline    
                let isOk = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
                if (!isOk && !player.isHunter) {
                    this.OnAddModelOutline(zepetoCharacter);
                }
            }
        }

        if (player.buff != playerStatus.buff) {
            playerStatus.buff = player.buff;
            this.OnChangeBuff(zepetoCharacter, player.buff);
        }

        if (sessionId == this.mSessionId) {
            // Synchronize star values
            if (player.star != playerStatus.star) {
                playerStatus.star = player.star;
                this.OnActionEvent(ActionEvent.OnUpdateStar, player.star);
            }
            // Synchronize HP
            if (player.HP != playerStatus.HP) {
                playerStatus.HP = player.HP;
                this.OnActionEvent(ActionEvent.OnUpdateHP, player.HP);
            }
            // Number of synchronization buffs
            if (player.buffNum != playerStatus.buffNum) {
                playerStatus.buffNum = player.buffNum;
                this.OnActionEvent(ActionEvent.OnUpdateBuff, player.buffNum);
            }
        }
    }

    /**
     * Add a stroke to the dodger
     * @param character s
     * @returns 
     */
    OnAddModelOutline(character: ZepetoCharacter) {
        if (character.transform.childCount <= 1) {
            return;
        }
        let model = character.transform.GetChild(1).gameObject;
        if (model == null) {
            console.error("model is null!!!!");
            return;
        }
        let meshs = model.GetComponentsInChildren<MeshRenderer>();
        for (let i = 0; i < meshs.length; i++) {
            let count = meshs[i].sharedMaterials.length;
            let tempMats: Material[] = new Array(count);
            for (let j = 0; j < count; j++) {
                tempMats[j] = meshs[i].sharedMaterials[j];
            }
            tempMats[count] = this.mOutlineMat;
            meshs[i].sharedMaterials = tempMats;
        }
    }

    /**
     * Handling of player death
     * @param message 
     */
    OnPlayerDie(message: string) {
        let deadData = JSON.parse(message);
        let sessionId = deadData.deadId;
        let killerId = deadData.killerId;
        const zepetoCharacter = this.GetCharacter(sessionId);
        let dieFX = PoolManager.Instance.Spawn(mDieFX);
        dieFX.transform.position = zepetoCharacter.transform.position;
        if (sessionId == this.mSessionId || this.mIsWatchCamera) {
            this.mLockMove = true;
            let watchData: Map<string, WatchGameNode> = new Map<string, WatchGameNode>();
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                if (!player.isHunter) {
                    let node: WatchGameNode = new WatchGameNode();
                    node.sessionId = sessionId;
                    let playerInfo = this.mPlayerInfoMap.get(player.id);
                    node.name = playerInfo.nickName;
                    node.isLive = player.HP > 0 && playerInfo.liveTime == this.mGameRule.roundLength;
                    watchData.set(sessionId, node);
                    console.log("Player nickname :", node.name);
                }
            });
            let data = { watchData: watchData, isSelf: sessionId == this.mSessionId };
            this.OnActionEvent(ActionEvent.OnDie, data);
        }

        if (killerId == this.mSessionId) {
            UIToast.Instance.ShowHunterKill();
        }
    }

    // Player is scanned
    OnPlayerScan(message) {
        let beScanIds: string[] = JSON.parse(message.beScanIds);
        for (let i = 0; i < beScanIds.length; i++) {
            if (beScanIds[i] == this.mSessionId) {
                UIToast.Instance.ShowHiderBeScan();
                break;
            }
        }
    }
    /* Player Character Control End */

    /* Start Game Logic */
    /**
     * Handling peak moments
     */
    OnPeakMoment() {
        try {
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                let character = this.GetZepetoNetPlayer(sessionId);
                if (character != null && player.isHunter) {
                    if (character.transform.Find(mRadarFX) == null) {
                        // character.mRunSpeed *= 1.5;
                        let radar = PoolManager.Instance.Spawn(mRadarFX);
                        radar.name = mRadarFX;
                        radar.transform.SetParent(character.transform);
                        radar.transform.localPosition = Vector3.zero;
                        radar.GetComponent<RadarController>().mSessionId = sessionId;
                        console.log("OnPeakMoment, update hunter radar");
                    }
                }
                let isHunter = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
                if (character != null && !player.isHunter && !isHunter) {
                    let addHP = PoolManager.Instance.Spawn(mAddHPFX);
                    addHP.transform.SetParent(character.transform);
                    addHP.transform.localPosition = Vector3.zero;
                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * End of small round processing
     */
    OnRoundOver() {
        this.mLockMove = false;
        if (this.mIsLockCamera) {
            this.LockCamera(false);
        }
        this.FreeCamera(false);
        try {
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                let character = this.GetZepetoNetPlayer(sessionId);
                character.InitLight();
                if (character != null) {
                    character.StopMoving();
                    let rader = character.transform.Find(mRadarFX);
                    if (rader != null) PoolManager.Instance.UnSpawn(rader.gameObject);
                }
            });
        } catch (err) {
            console.error(err);
        }
    }

    GetLocalPlayer(): sPlayer {
        try {
            let playerInfo = this.mPlayerSessionMap.get(this.mSessionId);
            return playerInfo;
        } catch (err) {
            console.error(err);
        }
        return null;
    }

    /**
     * Game start processing
     */
    OnGameStart() {
        this.ResetCamera();
        try {
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                let character = this.GetZepetoNetPlayer(sessionId);
                character.InitLight();
                if (this.GetCharacter(sessionId) != null) {
                    this.OnChangeModel(this.GetCharacter(sessionId), this.DEF_MODEL);
                }
                this.OnSetPlayerInfoByVO(sessionId, player.isHunter ? PlayerRole.Hunter : PlayerRole.Hider);
                if (character != null) {
                    character.StopMoving();
                    this.mMoveState = MoveState.DragEnd;
                    // let sp = this.GetStartPoint(player.id - 1, player.isHunter ? PlayerRole.Hunter : PlayerRole.Hider);
                    // let pos = this.DecodeVector3(sp.pos);
                    // let rot = this.DecodeVector3(sp.rot);
                    // this.StartCoroutine(this.IE_DelaySetPosition(character, pos, rot));
                }

                if (this.mSessionId == sessionId) {
                    this.SetHunterCamera(player.isHunter);
                }
            });
            UIHunterOperation.Instance.ObjSuperLight.SetActive(true);
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * End of overall situation handling
     */
    OnGameOver() {
        this.OnRoundOver();
        this.ResetCamera();
        try {
            this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
                let character = this.GetZepetoNetPlayer(sessionId);
                character.InitLight();
                if (this.GetCharacter(sessionId) != null) {
                    if (player.model === this.DEF_DIE_MODEL) {// Dead Hider, Transforming into the Initial Model
                        this.OnChangeModel(this.GetCharacter(sessionId), player.targetModel);
                    }
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    private mIsCheckedHunterPos: boolean = false;
    private mIsCheckedrader: boolean = false;
    UpdateCheck(gameState: GameState) {
        if (gameState >= GameState.GameStart && gameState <= GameState.OpenDoor) {
            if (!this.mIsCheckedHunterPos && this.mLocalZepetoNetPlayer != null) {
                let player = this.mPlayerSessionMap.get(this.mSessionId);
                this.mIsCheckedHunterPos = true;
                console.log("player UpdateCheck, update hunter pos");
            }
        } else if (gameState == GameState.PeakMoment) {
            if (!this.mIsCheckedrader) {
                let character = this.GetZepetoNetPlayer(this.mSessionId);
                let player = this.mPlayerSessionMap.get(this.mSessionId);
                this.mIsCheckedrader = true;
                if (player.isHunter) {
                    if (character.transform.Find(mRadarFX) == null) {
                        //  character.mRunSpeed *= 1.5;
                        let radar = PoolManager.Instance.Spawn(mRadarFX);
                        radar.name = mRadarFX;
                        radar.transform.SetParent(character.transform);
                        radar.transform.localPosition = Vector3.zero;
                        radar.GetComponent<RadarController>().mSessionId = this.mSessionId;
                        console.log("player UpdateCheck, update hunter radar");
                    }
                }
            }
        }
        else {
            this.mIsCheckedHunterPos = false;
            this.mIsCheckedrader = false;
        }

    }

    private hasShowTip: boolean = false;
    /**
     * Scanning inspection
     * @param pos 
     * @param dis 
     * @param sessionId 
     * @returns 
     */
    public CheckRadar(pos: Vector3, dis: number, sessionId: string): boolean {
        let result = false;
        let beScanIds = [];
        this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
            if (!player.isHunter) {
                if (player.HP > 0) {
                    var character = this.GetZepetoNetPlayer(sessionId);
                    let d = Vector3.Distance(pos, character.transform.position);
                    if (d <= dis) {
                        result = true;
                        beScanIds.push(sessionId);
                    }
                }
            }
        })

        if (result) {
            if (sessionId == this.mSessionId) {
                const data = new RoomData();
                data.Add("scanId", this.mSessionId);
                data.Add("beScanIds", JSON.stringify(beScanIds));
                this.SendEvent(sEventArg.BeScan, data);
                let isHunter = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
                if (isHunter) {
                    if (!this.hasShowTip) {
                        this.hasShowTip = true;
                        UIToast.Instance.ShowHunterScan();
                    }
                }
            }
        }
        else {
            this.hasShowTip = false;
        }
        return result;
    }

    /* Game Logic end */

    * CoDealyOnSyncRomotePlayer(sessionId: string, player: sPlayer) {
        yield new WaitForSeconds(0.1);
        const zepetoCharacter = this.GetCharacter(sessionId);
        this.SetPosition(zepetoCharacter, this.ParseVector3(player.position));
        yield new WaitForSeconds(0.4);
        this.OnStateSync(sessionId, player);
    }

    CheckCanChangeModel(cost: number) {
        let player = this.mPlayerSessionMap.get(this.mSessionId);
        return player.star >= cost;
    }

    /**
     * Stealth Buff Processing
     * @param character 
     * @param buffId 
     * @returns 
     */
    OnChangeBuff(character: ZepetoCharacter, buffId: number) {
        if (character.transform.childCount <= 1) return;
        if (character.transform.GetChild(1) == null) return;

        console.log("OnChangeBuff!!!!" + buffId);

        var model = character.transform.GetChild(1).gameObject;
        if (model == null) {
            console.error("model is null!!!!");
            return;
        }

        let go = PoolManager.Instance.Spawn(mChangeModelFX);
        go.transform.position = character.transform.position;
        switch (buffId) {
            case BuffState.None:
                // restore
                model.SetActive(true);
                this.TryHideModel(model, false);
                break;
            case BuffState.Hide:
                let isHunter = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
                if (isHunter) {
                    model.SetActive(false);
                } else {
                    this.TryHideModel(model, true);
                }
                break;
        }
    }

    private mHideBuffMatCache: Map<string, Material> = new Map<string, Material>();
    /**
     * Processing of model stealth
     * @param model 
     * @param isHide 
     */
    TryHideModel(model: GameObject, isHide: boolean) {
        let meshs = this.GetMeshRenderer(model.transform);
        if (isHide) {
            for (var i = 0; i < meshs.length; i++) {
                if (meshs[i].transform.root.tag === "Player") {
                    if (!this.mHideBuffMatCache.has(meshs[i].gameObject.name)) {
                        this.mHideBuffMatCache.set(meshs[i].gameObject.name, meshs[i].sharedMaterial);
                    }
                    meshs[i].sharedMaterial = this.mGoodHideMat;
                }
            }
        } else {
            for (var i = 0; i < meshs.length; i++) {
                if (meshs[i].transform.root.tag === "Player") {
                    if (this.mHideBuffMatCache.has(meshs[i].gameObject.name)) {
                        meshs[i].sharedMaterial = this.mHideBuffMatCache.get(meshs[i].gameObject.name);
                    }
                }
            }
        }
    }

    private GetMeshRenderer(modelTrans: Transform): Renderer[] {
        if (modelTrans == null) return null;
        let meshs = modelTrans.GetComponentsInChildren<Renderer>();
        if (meshs == null || meshs.length <= 0) {
            let childCount = modelTrans.childCount;
            if (childCount <= 0) return null;
            let child = modelTrans.GetChild(0);
            if (child == null) return null;
            return this.GetMeshRenderer(child);
        }
        else {
            for (var i = 0; i < meshs.length; i++) {
                if (meshs[i].transform.parent.name === "FX_Run(Clone)") {
                    meshs.splice(i);
                }
            }
            return meshs;
        }
    }

    // Replacement Model
    readonly DEF_MODEL: number = 99;
    readonly DEF_DIE_MODEL: number = 100;
    OnChangeModelCamera(modelId: number) {
        if (this.mGameState < GameState.GameStart) {
            if (modelId != this.DEF_MODEL) {
                // Item perspective
                this.mHunterCamera.transform.localPosition = new Vector3(0, 0, -0.5);
                this.SetHunterCamera(false);
                this.OnSetPlayerInfoByVO(this.mSessionId, PlayerRole.Hider);
            } else {
                this.mHunterCamera.transform.localPosition = this.mHunterCameraPos;
                this.SetHunterCamera(true);
                this.OnSetPlayerInfoByVO(this.mSessionId, PlayerRole.Free);
            }
        }
    }


    /**
     * Transforming into an item
     * @param character 
     * @param modelId 
     * @returns 
     */
    OnChangeModel(character: ZepetoCharacter, modelId: number) {
        var body = character.transform.GetChild(0);
        // Display Body
        for (var i = 0; i < body.childCount; i++) {
            body.GetChild(i).gameObject.SetActive(true);
        }
        // Transformation special effects
        if (this.DEF_MODEL != modelId) {
            let go = PoolManager.Instance.Spawn(mChangeModelFX);
            go.transform.position = character.transform.position;
        }
        // console.log("OnChangeModel", modelId, character.transform.childCount);
        // Delete Model/Mobile special effects
        if (character.transform.childCount > 1) {
            let model = character.transform.GetChild(1).gameObject;
            let fx = model.transform.Find(mModelRunFX);
            if (fx != null) {
                //PoolManager.Instance.UnSpawn(fx.gameObject);
                GameObject.Destroy(fx.gameObject);
            }
            if (model != null) GameObject.Destroy(model);
        }
        let cc = character.GetComponent<CharacterController>();
        cc.enabled = true;
        let modelInfo = this.GetModelInfoVO(this.DEF_MODEL.toString());
        let modelInst: GameObject;
        switch (modelId) {
            case this.DEF_DIE_MODEL:
                for (let i = 0; i < body.childCount; i++) {
                    body.GetChild(i).gameObject.SetActive(false);
                }
                if (character != this.GetCharacter(this.mSessionId)) {
                    //Add restrictions to prevent local player character controllers from getting stuck
                    cc.enabled = false;
                }
                console.log("Death invisibility");
                return;
            case this.DEF_MODEL:
                break;
            default:
                for (let i = 0; i < body.childCount; i++) {
                    body.GetChild(i).gameObject.SetActive(false);
                }
                // this.mGoods[modelId];
                let modelPrefab = this.GoodsData.data.get(modelId).name
                //GameObject.Instantiate<GameObject>(modelPrefab, character.transform);
                modelInst = LoadManager.instance.ResLoad_PrefabObj("Change_Prefab/" + modelPrefab);
                modelInst.transform.parent = character.transform;
                modelInst.SetActive(true);
                modelInst.transform.localEulerAngles = Vector3.zero;
                modelInst.transform.localPosition = Vector3.zero;
                let fx_run = PoolManager.Instance.CreatePrefab(mModelRunFX);
                if (fx_run != null) {
                    fx_run.transform.SetParent(modelInst.transform);
                    fx_run.transform.localPosition = Vector3.zero;
                    fx_run.transform.localEulerAngles = Vector3.zero;
                }
                break;
        }

        let b = modelId == this.DEF_MODEL;
        if (modelInst) {
            let modecharControl = modelInst.GetComponent<CapsuleCollider>();
            // modelInfo.radius * 0.1;
            cc.skinWidth = b ? modelInfo.radius * 0.1 : modecharControl.radius * 0.1
            cc.center = new Vector3(0, b ? modelInfo.centerY : modecharControl.center.y, 0);
            cc.radius = b ? modelInfo.radius : modecharControl.radius;
            cc.height = b ? modelInfo.height : modecharControl.height;
            modecharControl.enabled = false;
        } else {
            cc.skinWidth = modelInfo.radius * 0.1
            cc.center = new Vector3(0, modelInfo.centerY, 0);
            cc.radius = modelInfo.radius;
            cc.height = modelInfo.height;
        }
        console.log(`Changing Models ID = ${modelId}, height = ${cc.height}, radius = ${cc.radius}, center = ${cc.center}`);
    }

    /**
     * Flashlight damage range detection
     * @param aHunterblood 
     * @param aAngle 
     * @param aDis 
     */
    public CheckPlayerInSectorArea(aHunterblood: number, aAngle: number, aDis: number) {
        let distance = aDis;
        let angle = aAngle;
        let localply = this.LocalPlayer.character.gameObject;
        for (let entry of this.mPlayerSessionMap.entries()) {
            let ply = this.GetPlayer(entry[0]).character.gameObject;
            let b = TransformHelper.SectorCheck(localply, ply, distance, angle);
            if (b && localply.name != ply.name) {
                console.log("Fan Sector detection");
                console.log("Trigger damage");
                this.OnShootExplosion(ply, localply, aHunterblood);
            }

        }
    }

    /**
     * Notify the server that the player has been attacked
     * @param target 
     * @param Killer 
     * @param hunterBlood 
     */
    OnShootExplosion(target: GameObject, Killer: GameObject, hunterBlood: number) {
        console.log("player has been attacked: ", target.name);
        if (this.mGameState >= GameState.OpenDoor) {
            let targetId: number = Number(target.name);
            let killerId: number = Number(Killer.name)
            let playerInfo = this.mPlayerInfoMap.get(targetId);
            let player = this.mPlayerSessionMap.get(playerInfo.sessionId);
            if (!player.isHunter) {
                const data = new RoomData();
                data.Add("targetId", targetId);
                data.Add("killerId", killerId);
                data.Add("huntblood", hunterBlood);
                data.Add("id", this.mId);
                this.SendEvent(sEventArg.BeAttacked, data);
            }
        }
    }

    /* UpdatePlayerInfo */
    Obj2Map(obj) {
        let strMap = new Map<number, sPlayerInfo>();

        for (let k of Object.keys(obj)) {
            strMap.set(Number(k), obj[k]);
        }
        return strMap;
    }

    public SetSessionId(sessionId: string) {
        this.mSessionId = sessionId;
    }

    // Instantiating Players
    public UpdatePlayerInfo(playerMapJson: string) {
        let playerObj = JSON.parse(playerMapJson);
        let playerMap = this.Obj2Map(playerObj);

        let join = new Map<number, sPlayerInfo>();
        let leave = new Map<number, sPlayerInfo>(this.mPlayerInfoMap);
        //console.error(playerMapJson);
        playerMap.forEach((_player: sPlayerInfo, _id: number) => {
            if (_id > 0) {
                if (!this.mPlayerInfoMap.has(_id)) {
                    join.set(_id, _player);
                }
                // if(this.mId == _id){
                //     this.OnActionEvent(ActionEvent.OnUpdateHP, _player.HP);
                // }
            }
            leave.delete(_id);
        })
        this.mPlayerInfoMap = playerMap;
        join.forEach((_player: sPlayerInfo, _id: number) => {
            this.CreatePlayer(_player.sessionId, _player.userId, _id);
            this.mPlayerGameStatusMap.set(_id, new PlayerGameStatus());
        });
        leave.forEach((_player: sPlayerInfo, _id: number) => {
            this.RemovePlayer(_player.sessionId, _id);
            this.mPlayerGameStatusMap.delete(_id);
        });

        // this.OnActionEvent(ActionEvent.OnUpdatePlayerNum, this.mPlayerInfoMap.size - 1);
    }

    /* CreatePlayer */
    CreatePlayer(sessionId: string, userId: string, id: number) {
        let spawnInfo: SpawnInfo = new SpawnInfo();
        let player = this.mPlayerSessionMap.get(sessionId);
        if (player == null) {
            this.mPlayerInfoMap.delete(id);
            console.log("no session info");
        }
        else {
            // id Starting from 1，0 is occupied
            // let sp = this.GetStartPoint(id - 1, PlayerRole.Free);
            // let pos = this.ParseVector3(player.position);
            // spawnInfo.position = pos;   // Synchronize location from server
            // sp.rot = this.DecodeVector3(sp.rot);
            // spawnInfo.rotation = Quaternion.Euler(sp.rot.x, sp.rot.y, sp.rot.z);
            ZepetoPlayers.instance.CreatePlayerWithUserId(sessionId, userId, spawnInfo, sessionId == this.mSessionId);
            if (sessionId == this.mSessionId) {
                // this.mInitCameraAngle = this.DecodeVector3(sp.camAngle);
                this.mId = player.id;
                this.mUserId = userId;
            }
        }

    }

    RemovePlayer(sessionId: string, id: number) {
        ZepetoPlayers.instance.RemovePlayer(sessionId);
        if (this.mPlayerSessionMap.has(sessionId)) {
            this.mPlayerSessionMap.delete(sessionId);
        }
        if (this.mPlayerInfoMap.has(id)) {
            this.mPlayerInfoMap.delete(id);
        }
        if (this.mZepetoNetPlayerMap.has(sessionId)) {
            this.mZepetoNetPlayerMap.delete(sessionId);
            this.mLoadedPlayerNum--;
        }
    }

    GetPlayer(sessionId: string): ZepetoPlayer {
        if (ZepetoPlayers.instance.HasPlayer(sessionId)) {
            return ZepetoPlayers.instance.GetPlayer(sessionId);
        }
        return null;
    }

    GetCharacter(sessionId: string): ZepetoCharacter {
        if (ZepetoPlayers.instance.HasPlayer(sessionId)) {
            return ZepetoPlayers.instance.GetPlayer(sessionId).character;
        }
        return null;
    }

    GetZepetoNetPlayer(sessionId: string): ZepetoNetPlayer {
        if (this.mZepetoNetPlayerMap.has(sessionId)) {
            return this.mZepetoNetPlayerMap.get(sessionId);
        }
        return null;
    }

    SetPosition(character: ZepetoCharacter, position: Vector3) {
        character.transform.position = position;
    }

    private ParseVector3(vector3: sVector3): Vector3 {
        return new Vector3
            (
                vector3.x * 0.01,
                vector3.y * 0.01,
                vector3.z * 0.01
            );
    }

    GetMyRoundScore(): number {
        let player = this.GetLocalPlayer();
        if (this.mPlayerInfoMap.has(player.id)) {
            let playerInfo = this.mPlayerInfoMap.get(player.id);
            return playerInfo.roundScore;
        }
        return 0;
    }

    ShowScaneRound(zptPlayer: ZepetoNetPlayer) {
        try {
            let character = this.GetZepetoNetPlayer(this.mSessionId);
            let radar = PoolManager.Instance.Spawn(mRadarInFX);
            radar.name = mRadarInFX;
            radar.transform.SetParent(character.transform);
            radar.transform.localPosition = Vector3.zero;
            radar.GetComponent<RadarController>().mSessionId = this.mSessionId;
            // let isHunter = this.mPlayerSessionMap.get(this.mSessionId).isHunter;
        } catch (err) {
            console.error(err);
        }
    }

    SyncSuperLightAction(msg: string) {
        var d = msg.split("|");
        if (d[0] != this.mSessionId) {
            // let netPlayer = this.GetZepetoNetPlayer(d[0]);
            let sta = Number(d[1]);
            let sid = d[0];
            // netPlayer.SetSuperLightAction(sta);
            let character = this.GetZepetoNetPlayer(sid);
            if (sta == LightState.OFF) {
                PoolManager.Instance.UnSpawn(character.transform.Find(mRadarInFX).gameObject);
            } else {
                let radar = PoolManager.Instance.Spawn(mRadarInFX);
                radar.name = mRadarInFX;
                radar.transform.SetParent(character.transform);
                radar.transform.localPosition = Vector3.zero;
                radar.GetComponent<RadarController>().mSessionId = sid;
            }
        }

    }

    /**
     * Set player initial position
     * @param msg 
     */
    SetPlayerInitPos(msg: string) {
        let data = msg.split("|");
        let posidx = data[0];
        let sid = data[1];
        console.log("SetPlayerInitPos000::", posidx, sid, this.mSessionId);
        this.mInitPos = TransformHelper.GetTransformInDeep(GameMain.Instance.SpawnPlayersPoints.transform, posidx).gameObject;
        var zptChar = this.mZepetoNetPlayerMap.get(sid);
        if (zptChar) {
            console.log("SetPlayerInitPos111:", msg, this.mInitPos.name, this.mSessionId, this.mInitPos.transform.position);
            zptChar.transform.position = this.mInitPos.transform.position;
            zptChar.transform.rotation = this.mInitPos.transform.rotation;
            this.StartCoroutine(this.IE_DelaySetPosition(zptChar,
                this.mInitPos.transform.position,
                this.mInitPos.transform.eulerAngles));
        }
    }

    * IE_DelaySetPosition(character: ZepetoNetPlayer, pos: Vector3, rot: Vector3) {
        this.mMoveState = MoveState.DragEnd;
        this.mLockMove = true;
        character.StopMoving();
        character.enabled = false;
        yield null;
        yield new WaitForSeconds(0.2);
        character.transform.position = pos;
        character.transform.eulerAngles = rot;
        console.log("SetPlayerInitPos222", pos, rot);
        yield new WaitForSeconds(0.2);
        character.enabled = true;
        this.mLockMove = false;
    }

    CloseScaneRound() {
        let character = PlayerManager.Instance.GetZepetoNetPlayer(PlayerManager.Instance.mSessionId);
        if (character != null) {
            character.StopMoving();
            let rader = character.transform.Find(mRadarInFX);
            if (rader != null) PoolManager.Instance.UnSpawn(rader.gameObject);
        }
    }

    ResetSuperLight() {
        this.mPlayerSessionMap.forEach((player: sPlayer, sessionId: string) => {
            let character = this.GetZepetoNetPlayer(sessionId);
            if (character && character.transform.Find(mRadarInFX))
                PoolManager.Instance.UnSpawn(character.transform.Find(mRadarInFX).gameObject);
        });
    }

    public CheckCanJump(sessionId: string): boolean {
        if (this.mPlayerSessionMap == null)
            return false;
        let player = this.mPlayerSessionMap.get(sessionId);
        if (player == null)
            return false;
        if (this.mGameState == GameState.GameMatch)
            return true;
        else
            return player.model != this.DEF_DIE_MODEL;
    }
}