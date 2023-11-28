import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import UIManager from "./GameManager/UIManager"
import MapManager from "./GameManager/MapManager"
import NetManager, { sEventArg, GameState } from "./GameManager/NetManager"
import PlayerManager, { ActionEvent } from "./GameManager/PlayerManager"
import ConfigManager from "./GameManager/ConfigManager"
import { AudioClip, GameObject, Vector3, Time, AsyncOperation } from "UnityEngine";
import AudioController from './GameController/AudioController'
import { sPlayer, sPlayerInfo, sGameInfo, sRoundResult } from "ZEPETO.Multiplay.Schema";
import { RoomData } from "ZEPETO.Multiplay";
import UIToast from "./UI/UIToast"
import FrameworkManager from './GameManager/FrameworkManager'
import { LoadSceneMode, SceneManager } from 'UnityEngine.SceneManagement'
import ActNodeManager from './GameController/ActNode/ActNodeManager'

/**
 * Game Mainstream Process
 * 1. Game state behavior machine switching
 * 2. Handling Client and Server Connection Intervals
 * 3. Game Local Event Handling
 */
export default class GameMain extends ZepetoScriptBehaviour {

    /* Singleton */
    private static _instance: GameMain;
    public static get Instance(): GameMain {
        if (!GameMain._instance) {
            const targetObj = GameObject.Find("GameMain");
            if (targetObj) GameMain._instance = targetObj.GetComponent<GameMain>();
        }
        return GameMain._instance;
    }

    /**
     * Manager
     */
    @HideInInspector()
    public mUIManager: UIManager;
    @HideInInspector()
    public mMapManager: MapManager;
    @HideInInspector()
    public mNetManager: NetManager;
    @HideInInspector()
    public mPlayerManager: PlayerManager;
    @HideInInspector()
    public mConfigManager: ConfigManager;
    @HideInInspector()
    public mGameInfo: sGameInfo;
    @HideInInspector()
    public mRoundResult: sRoundResult;
    @HideInInspector()
    public mPlayer: sPlayer;

    public mGameState: GameState;
    public mGameRule: GameRule;

    @HideInInspector()

    // Configure player initial point and camp initial point
    public SpawnPlayersPoints: GameObject; 

    private AsyncSceneProgress: AsyncOperation;

    private actNodeManager: ActNodeManager;

    Awake() {
        GameMain._instance = this;
    }

    DoInit() {
        // Dynamically adding game related management classes
        console.log("Gamemain start");
        let AudioController = FrameworkManager.loadManager.ResLoad_PrefabObj("0AudioController");
        AudioController.name = "AudioController";
        let netManager = FrameworkManager.loadManager.ResLoad_PrefabObj("0NetManager");
        netManager.name = "NetManager";
        let playManager = FrameworkManager.loadManager.ResLoad_PrefabObj("1PlayerManager");
        playManager.name = "PlayerManager";
        let mapManager = FrameworkManager.loadManager.ResLoad_PrefabObj("2MapManager");
        mapManager.name = "MapManager";
        let uiManager = FrameworkManager.loadManager.ResLoad_PrefabObj("3UIManager");
        uiManager.name = "UIManager";
        this.SpawnPlayersPoints = FrameworkManager.loadManager.ResLoad_PrefabObj("SpawnPlayersPoints");
        this.SpawnPlayersPoints.name = "SpawnPlayersPoints";
        console.log("Gamemain end");

        // Dynamically loading scenes
        this.AsyncSceneProgress = SceneManager.LoadSceneAsync("GameScene", LoadSceneMode.Additive);

        // Behavior machine management initialization
        this.actNodeManager = new ActNodeManager();
        this.actNodeManager.InitActNodeMap();
    }

    DoStart() {
        this.mNetManager = NetManager.Instance;
        this.mPlayerManager = PlayerManager.Instance;
        this.mUIManager = UIManager.Instance;
        this.mConfigManager = ConfigManager.Instance;
        this.mMapManager = MapManager.Instance;
        this.mGameState = GameState.None;
    }

    private heartTimer: number = 0;
    DoUpdate() {
        this.heartTimer += Time.deltaTime;
        if (this.heartTimer > ConfigManager.GAME_HEART_RATE) {
            this.heartTimer -= ConfigManager.GAME_HEART_RATE;
            this.OnGameHeartUpdate();
        }
    }

    public InitRoomSessionId(sessionId: string) {
        this.mPlayerManager.SetSessionId(sessionId);
    }

    /**
     * Calculate Client and Server Connection Interval
     */
    public OnGameHeartUpdate() {
        this.SendEvent(sEventArg.GameUpdate, null);
    }

    public OnStateUpdate(playerMap: any) {
        playerMap.ForEach((userId: string, player: sPlayer) => {
            console.log("[OnStateUpdate] " + userId + " -- " + player.id);
        })
    }

    /**
     * Handles game local events triggered by the specified eventName and message.
     * @param eventName 
     * @param message 
     */
    public OnActionEvent(eventName: string, message: any) {
        switch (eventName) {
            case ActionEvent.OnFinishLoad:
                let userId: string = message;
                AudioController.Instance.PlayReadyBGM();
                this.mUIManager.OnFinishLoad(userId);
                this.mMapManager.OnFinishLoad(userId);
                break;
            case ActionEvent.OnUpdateHP:
                if (this.mGameState >= GameState.GameStart) {
                    this.mUIManager.OnUpdateHP(message, this.mGameInfo.Elapsed);
                }
                break;
            case ActionEvent.OnUpdateStar:
                this.mUIManager.OnUpdateStar(message);
                break;
            case ActionEvent.OnUpdateBuff:
                this.mUIManager.OnUpdateBuff(message);
                break;
            case ActionEvent.OnLockCamera:
                let isLock: boolean = message;
                this.mPlayerManager.LockCamera(isLock);
                break;
            case ActionEvent.OnFreeCamera:
                let isFree: boolean = message;
                this.mPlayerManager.FreeCamera(isFree);
                break;
            case ActionEvent.OnWatchCamera:
                this.mPlayerManager.WatchCamera(true, message);
                break;
            case ActionEvent.OnDie:
                this.mUIManager.OnDie(message);
                break;
        }
    }

    /**
     * Event processing
     * @param eventName 
     * @param message 
     */
    public HandleEvent(eventName: sEventArg, message: any) {
        switch (eventName) {
            case sEventArg.DynamicMapChange:
                this.mMapManager.OnDynamicMapChange(message);
                break;
            case sEventArg.GameRule:
                this.mGameRule = JSON.parse(message);
                break;
            case sEventArg.PlayerChange:
                this.mPlayerManager.OnPlayerChange(message);
                break;
            case sEventArg.PlayerMove:
                this.mPlayerManager.OnReceiveMoveData(message);
                break;
            case sEventArg.PlayerJump:
                break;
            case sEventArg.PlayerInfoSync:
                this.mPlayerManager.UpdatePlayerInfo(message);
                break;
            case sEventArg.PlayerDie:
                this.mPlayerManager.OnPlayerDie(message);
                break;
            case sEventArg.RandomModel:
                this.mUIManager.OnShowRandomModel(message);
                break;
            case sEventArg.GameUpdate:
                this.mGameInfo = message;
                UIToast.Instance.UpdateElapsed(this.mGameInfo.Elapsed);
                this.GameStateChange();
                break;
            case sEventArg.SwitchLight:
                this.mPlayerManager.SyncLightAction(message);
                break;
            case sEventArg.SwitchSuperLight:
                this.mPlayerManager.SyncSuperLightAction(message);
                break;
            case sEventArg.BeScan:
                this.mPlayerManager.OnPlayerScan(message);
                break;
            case sEventArg.InitPlayerPos:
                this.mPlayerManager.SetPlayerInitPos(message);
                break;
        }
    }

    public GetGameState() {
        return this.mGameInfo.GameState;
    }

    /**
     * Handles game state changes, triggering behavior in the state machine.
     */
    private GameStateChange() {
        this.mPlayer = this.mPlayerManager.GetLocalPlayer();
        this.mUIManager.OnGameUpdate(this.mGameInfo, this.mPlayer);
        this.mPlayerManager.UpdateCheck(this.mGameInfo.GameState);
        if (this.mGameState != this.mGameInfo.GameState) {
            console.log("GameStateChange", this.mGameInfo.GameState);
            this.mGameState = this.mGameInfo.GameState;
            this.mMapManager.UpdateCheck();
            let actnode = this.actNodeManager.ActiveNode_GameStateMap.get(this.mGameInfo.GameState);
            if (actnode) {
                this.StartCoroutine(actnode.CoRun());
            }
        }
    }

    public SendEvent(eventName: sEventArg, message: any) {
        if (this.mGameState == GameState.GameOver) return;
        const roomData = new RoomData();
        switch (eventName) {
            case sEventArg.BeAttacked:
                this.mNetManager.SendEvent(eventName, message);
                break;
            case sEventArg.SwitchLight:
            case sEventArg.SwitchSuperLight:
                roomData.Add("state", message);
                roomData.Add("sid", this.mPlayerManager.mSessionId);
                this.mNetManager.SendEvent(eventName, roomData);
                break;

            case sEventArg.ChangeModel:
                roomData.Add("model", Number(message));
                this.mNetManager.SendEvent(eventName, roomData);
                break;
            case sEventArg.UseBuff:
                roomData.Add("buff", message);
                this.mNetManager.SendEvent(eventName, roomData);
                break;
            case sEventArg.PlayerJump:
                roomData.Add("sessionId", message)
                this.mNetManager.SendEvent(eventName, roomData);
                break;
            default:
                this.mNetManager.SendEvent(eventName, message);
        }
    }

    /**
     * Handles game end processing.
     * @param playerInfoMap 
     */
    OnGameOver(playerInfoMap: Map<number, sPlayerInfo>) {
        // After the game ends, save the game points. Those who exit midway will not receive points.
        playerInfoMap.forEach((info, id) => {
            if (info.sessionId == this.mPlayerManager.mSessionId) {
                console.log(`Update leaderboard data, found this round : ${info.hunterSum} people, alive ${info.liveSum} seconds`);
            }
        })
        this.mUIManager.OnGameOver();
        this.mPlayerManager.OnGameOver();
        UIToast.Instance.ShowGameOver(playerInfoMap);
    }

    // AudioController

    /**
     * Play background music (BGM)
     * @param clip 
     */
    public PlayBGM(clip: AudioClip) {
        AudioController.Instance.PlayBGM(clip);
    }

    /**
     * Play a sound effect once
     * @param clip 
     */
    public PlayOneShot(clip: AudioClip) {
        AudioController.Instance.PlayOneShot(clip);
    }

    /**
     * Play a sound effect once at a specific point.
     * @param clip 
     */
    public PlayAtPoint(clip: AudioClip, point: Vector3) {
        AudioController.Instance.PlayAtPoint(clip, point);
    }

    /**
     * Get player information.
     * @param player 
     * @returns 
     */
    public GetPlayerInfoVO(player: number): any {
        return this.mConfigManager.GetPlayerInfoVO(player);
    }

    /**
     * Manage popups and prompts in games.
     * @param msg 
     * @param duration 
     */
    public Toast(msg: string, duration: number) {
        this.mUIManager.Toast(msg, duration);
    }

    /**
     * Get configuration information for the transformation model.
     * @param name 
     * @returns 
     */
    public GetModelInfoVO(name: string): any {
        return this.mConfigManager.GetModelInfoVO(name);
    }

    /**
     * Check if there are enough stars to perform a model transformation.
     * @param cost 
     * @returns 
     */
    public CheckCanChangeModel(cost: number): boolean {
        return this.mPlayerManager.CheckCanChangeModel(cost);
    }
}

/**
 * Game Rule Configuration Fields
 */
export class GameRule {
    roundNumber: number;           // Number of game rounds  (- Indicates addition）
    roundLength: number;           // Game duration=seconds
    roundOverDelay: number;        // - Delay in waiting for the end of the turn
    gameOverDelay: number;         // - Game end waiting delay
    peakMomentLength: number;      // Peak duration=seconds
    minPlayer: number;             // Minimum number of matches
    maxPlayer: number;             // - Maximum number of matches
    matchDelay: number;            // - Match Countdown
    modelDelay: number;            // - Prop delay
    opendoorDelay: number;         // Door opening delay
    isTest: number;                // Test the game process on your own,=1hour，Skip gameover judgment
    initHP: number;                // Initialize Health
    initBuf: number;               // Initialize Buf quantity
    buffDuration: number;          // Buff duration
    buffCD: number;                // Buff CoolDown time
    peekHP: number;                // Peak Moment Health
    randomModelCost: number;       // Random item function Spend Star Ability Value
    addStarInerval: number;        // Hider increases star spacing
    hunterWinScore: number;        // Seeker Victory Points
    hunterNumScore: number;        // Finder found 1 person with points
    hiderWinScore: number;         // Hider Victory Points
    hiderLiveScore: number;        // Hider Survival Seconds Integral
}