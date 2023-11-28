import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World'
import { Room, RoomData, RoomErrorEvent, RoomLeaveEvent } from 'ZEPETO.Multiplay'
import GameMain from '../GameMain';

/**
 * Server Event Name
 */
export enum sEventArg {
    GameRule = "GameRule",
    PlayerChange = "PlayerChange",
    PlayerMove = "PlayerMove",
    PlayerJump = "PlayerJump",
    PlayerInfoSync = "PlayerInfoSync",
    ClientReady = "ClientReady",
    GameUpdate = "GameUpdate",  // Client and Server Connection Interval 5s
    ChangeModel = "ChangeModel", // Hiding and replacing models: tables, chairs, etc
    BeAttacked = "BeAttacked",
    BeScan = "BeScan", // Scanned to    
    UseBuff = "UseBuff",
    PlayerDie = "PlayerDie",
    RandomModel = "RandomModel",
    SwitchLight = "SwitchLight",
    SwitchSuperLight = "SwitchSuperLight",
    RoomStateDelayTest = "RoomStateDelayTest",
    MessageDelayTest = "MessageDelayTest",
    DynamicMapChange = "DynamicMapChange",
    InitPlayerPos = "InitPlayerPos",
}

/**
 * Game State
 */
export enum GameState {
    None = -1,
    GameWait = 0,                   // Just entered the game waiting state
    GameOver = 1,                   // End state of this game
    GameRoundOver = 2,              // End state of small turn
    GameMatch = 3,                  // Game matching status
    GameStart = 4,                  // Game Start Status
    ConfirmedModel = 5,             // Determine model
    OpenDoor = 6,                   // Game opening status
    PeakMoment = 7,                 // Peak state
}

/**
NetManager is responsible for managing network data，Only responsible for sending and receiving data，Not responsible for handling logic
After receiving the information, report it to the superior
Define all server events, Send to server through Room
 */
export default class NetManager extends ZepetoScriptBehaviour {
    private mMultiplay: ZepetoWorldMultiplay;
    private mRoom: Room;
    private mElapsedTime: number;

    /* Singleton */
    private static _instance: NetManager;
    public static get Instance(): NetManager {
        return NetManager._instance;
    }


    Awake() {
        NetManager._instance = this;
        this.mMultiplay = this.gameObject.GetComponent<ZepetoWorldMultiplay>();
        if (this.mMultiplay == null) {
            this.mMultiplay = this.gameObject.AddComponent<ZepetoWorldMultiplay>();
        }
    }

    Start() {
        this.mMultiplay.RoomCreated += this.OnRoomCreated;
        this.mMultiplay.RoomJoined += this.OnRoomJoined;
        this.mMultiplay.RoomError += this.OnRoomError;
        this.mMultiplay.RoomLeave += this.OnRoomLeave;
    }

    OnDestroy() {
        if (this.mRoom.IsConnected) {
            this.mRoom.Leave();
            console.error("room Leave!");
        }
    }

    private OnRoomCreated(room: Room) {
        this.mRoom = room;
        this.BindServerEvent();
        console.log("OnRoomCreated!");
    }

    private OnRoomJoined(room: Room) {

        let gameInfo = this.mRoom.State.gameInfo;
        gameInfo.OnChange += (changeValues) => {
            this.OnReceiveEvent(sEventArg.GameUpdate, this.mRoom.State.gameInfo);
        }

        let playerChange = this.mRoom.State.playerChange;
        playerChange.OnChange += (changeValues) => {
            console.log("PlayerChange!");
            this.OnReceiveEvent(sEventArg.PlayerChange, this.mRoom.State.players);
        }

        this.mRoom.State.dynamicMaps.OnChange += (changeValues) => {
            this.OnReceiveEvent(sEventArg.DynamicMapChange, this.mRoom.State.dynamicMaps);
        }

        this.OnReceiveEvent(sEventArg.DynamicMapChange, this.mRoom.State.dynamicMaps);

        GameMain.Instance.InitRoomSessionId(this.mRoom.SessionId);
        console.log(`OnRoomJoined! , sessionId = ${this.mRoom.SessionId}`);
    }

    private OnRoomError(error: RoomErrorEvent) {
        // TODO 
        console.error(error.Message);
    }

    private OnRoomLeave(leave: RoomLeaveEvent) {
        // TODO
        // Stop sending data after leaving the room
        this.mRoom = null;
        console.warn("OnRoomLeave!")
    }

    /**
     * Binding Events
     */
    private BindServerEvent() {
        this.mRoom.AddMessageHandler<string>(sEventArg.GameRule, message => {
            this.OnReceiveEvent(sEventArg.GameRule, message);
        });
        this.mRoom.AddMessageHandler<string>(sEventArg.InitPlayerPos, message => {
            this.OnReceiveEvent(sEventArg.InitPlayerPos, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.PlayerMove, message => {
            this.OnReceiveEvent(sEventArg.PlayerMove, message);
        });

        this.mRoom.AddMessageHandler<string>(sEventArg.PlayerInfoSync, message => {
            this.OnReceiveEvent(sEventArg.PlayerInfoSync, message);
        });

        this.mRoom.AddMessageHandler<string>(sEventArg.PlayerJump, message => {
            this.OnReceiveEvent(sEventArg.PlayerJump, message);
        });

        this.mRoom.AddMessageHandler<string>(sEventArg.SwitchLight, message => {
            this.OnReceiveEvent(sEventArg.SwitchLight, message);
        });
        this.mRoom.AddMessageHandler<string>(sEventArg.SwitchSuperLight, message => {
            this.OnReceiveEvent(sEventArg.SwitchSuperLight, message);
        });

        this.mRoom.AddMessageHandler<string>(sEventArg.BeAttacked, message => {
            this.OnReceiveEvent(sEventArg.BeAttacked, message);
        });

        this.mRoom.AddMessageHandler<number>(sEventArg.RandomModel, message => {
            this.OnReceiveEvent(sEventArg.RandomModel, message);
        });

        this.mRoom.AddMessageHandler<string>(sEventArg.PlayerDie, message => {
            this.OnReceiveEvent(sEventArg.PlayerDie, message);
        });

        this.mRoom.AddMessageHandler(sEventArg.BeScan, message => {
            this.OnReceiveEvent(sEventArg.BeScan, message);
        });
    }

    /**
     * Received server event
     * @param eventName 
     * @param message 
     */
    private OnReceiveEvent(eventName: sEventArg, message: any) {
        GameMain.Instance.HandleEvent(eventName, message);
    }

    /* Public API */
    public GetRoomElapsedTime(): number {
        return this.mElapsedTime;
    }

    private mEmptyData = new RoomData();
    public SendEvent(eventName: string, data: RoomData) {
        if (data == null) {
            data = this.mEmptyData;
        }
        if (this.mRoom && this.mRoom.IsConnected) {
            this.mRoom.Send(eventName, data.GetObject());
        }
        else {
            console.error("[SendEvent] room unconnected");
            // TODO :  Cache data ， some event Resend after network recovery
        }
    }

    //TEST--------------

    // 20 times per second
    // private mMinMsgDelay: number = 1;
    // private mMaxMsgDelay: number = 0;
    // private mAvgMsgDelay: number = 0;
    // private mSumMsgDelay: number = 0;
    // private mMsgRate: number = 3;     // Send every 3 frames
    // private mMsgSendTime: number;
    // private mMsgReceiveTime: number;
    // private mMsgFrame: number = 0;
    // private mMsgIsOk: boolean = true;
    // private mMsgCount: number = 0;
    // public mText: Text;
    // private mMsgRoomData: RoomData = new RoomData();

    // FixedUpdate() {
    //     if (this.mRoom == null) return;

    //     this.mMsgFrame++;
    //     if (this.mMsgFrame >= this.mMsgRate && this.mMsgIsOk) {
    //         this.mMsgFrame = 0;
    //         this.mMsgRoomData = new RoomData();
    //         this.mMsgRoomData.Add("Test", "TTestTTestTTestTTestTTestTTestTTestTTestTTestTTestTTestTTestTTestTTestTTestTTestTTestTTest" + Time.time);
    //         this.SendEvent(sEventArg.MessageDelayTest, this.mMsgRoomData);
    //         //this.mMsgSendTime = Time.time;
    //         //this.mMsgIsOk = false;
    //     }
    // }


    // OnMsgDelayTest() {
    //     this.mMsgReceiveTime = Time.time;

    //     let delay = this.mMsgReceiveTime - this.mMsgSendTime;

    //     if (delay < this.mMinMsgDelay) this.mMinMsgDelay = delay;

    //     if (delay > this.mMaxMsgDelay) this.mMaxMsgDelay = delay;

    //     this.mSumMsgDelay += delay;

    //     this.mMsgCount++;
    //     if (this.mMsgCount >= 16) {
    //         this.mAvgMsgDelay = this.mSumMsgDelay / this.mMsgCount;

    //         this.mMsgCount = 0;
    //         this.mSumMsgDelay = 0;
    //         this.mText.text = "MinDelay : " + this.mMinMsgDelay.toFixed(4) + "\r\n" + "MaxDelay : " + this.mMaxMsgDelay.toFixed(4) + "\r\n" + "AveDelay : " + this.mAvgMsgDelay.toFixed(4);
    //         this.mMinMsgDelay = 1;
    //         this.mMaxMsgDelay = 0;
    //     }

    //     this.mMsgIsOk = true;
    //     this.mMsgSendTime = Time.time;

    // }

    //--------------TEST
}