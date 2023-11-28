import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import Queue, { sNetTransform, ZepetoNetTransformPackage } from "./ZepetoNetTransformPackage";
import { Animator, CharacterController, GameObject, Time, Vector2, Vector3, Transform } from "UnityEngine";
import NetManager, { sEventArg } from "../GameManager/NetManager";
import { RoomData } from 'ZEPETO.Multiplay';
import PlayerManager, { LightState } from '../GameManager/PlayerManager';
import IKCtrl from '../Common/IKCtrl';
import UIHunterOperation from '../UI/UIHunterOperation';


enum MoveDirState {
    None = 0,   // Stop moving
    Forward = 1,
    Back = 2,
    Left = 3,
    Right = 4,
    Jump = 5,
}

abstract class ZepetoNetPlayerBase extends ZepetoScriptBehaviour {

    @HideInInspector()
    public MaxLightBattle: number = 10;
    public LightBattle: number = this.MaxLightBattle;
    public mId: number;
    public mIsLocal: boolean = false;
    public mMinMoveDis: number = 0.05;
    public mMaxMoveDis: number = 3;

    // SuperLight
    //60 ych
    public SuperLightCDTime = 60;
    public SuperLightCurCDTime = this.SuperLightCDTime;
    // 2 uses per game
    public SuperLightMaxUseTimes = 2;
    //Current usage times
    public SuperLightCurTimes = this.SuperLightMaxUseTimes;

    public MaxSuperLightBattle = 20;//Usage duration 20
    public SuperLightBattle: number = this.MaxSuperLightBattle;
    public bSuperLightOpen: bool = false;
    // Send every 3 frames, Test Package
    // @HideInInspector()
    // Send once every 60ms = 16.6FPS
    protected readonly mSendPakRate: number = 3;
    protected mFrameIndex: number = 0;
    // Whether to use pre judgment
    protected mUsePredict: boolean = true;
    // Frame counter
    protected mSendPakCount: number = 0;
    // Network Packet 
    protected mSendLocalPackage: ZepetoNetTransformPackage = new ZepetoNetTransformPackage();

    // Controllers Character controller
    protected mAnimator: Animator;
    protected mCharacterController: CharacterController;
    protected mAnimatorState: number = 0;
    public objLight: GameObject;
    public objSuperLight: GameObject;
    public IKCtrl: IKCtrl;
    public weaponInRoot: Transform;
    public weaponOutRoot: Transform;
    public weaponObj: GameObject;
    public mLightTar: Transform;
    public LightState: number = LightState.OFF;
    public SuperLightState: number = LightState.OFF;

    public lightTime: number = 0;
    public lightSuperTime: number = 0;
    public HandLightObj: GameObject;

    private readonly ANIMATOR_STATE_PARAM: string = "Move";

    /**
     * @description: attribute
     */
    public mRunSpeed: number = 0.5;

    // Assuming 1 parameter Special logic special processing
    UpdateAnimatorState(state: number) {
        if (this.mAnimatorState != state) {
            this.mAnimatorState = state;
            switch (state) {
                case MoveDirState.Jump:
                    this.mAnimator.SetTrigger("Jump");
                    break;
                default:
                    this.mAnimator.SetInteger(this.ANIMATOR_STATE_PARAM, this.mAnimatorState);
                    break;
            }
        }
    }

    SendMoveData() {
        this.mSendPakCount++;
        let dataJson = this.mSendLocalPackage.mDatas.toJson(this.mId, this.mSendPakCount);
        this.mSendLocalPackage.mDatas.Clear();
        let roomData = new RoomData();
        roomData.Add("data", dataJson);
        NetManager.Instance.SendEvent(sEventArg.PlayerMove, roomData);
    }

    /**
     * @description: Return to Movement Speed
     */
    protected GetMoveSpeedByDir(moveState: MoveDirState): number {
        let factor: number = 0;
        switch (moveState) {
            case MoveDirState.Forward:
                factor = 1.5;
                break;
            case MoveDirState.Back:
                factor = 1;
                break;
            case MoveDirState.Left:
                factor = 1.2;
                break;
            case MoveDirState.Right:
                factor = 1.2;
                break;
            default:
                factor = 1.2;
                break;

        }
        return this.mRunSpeed * factor;
    }
}

class ZepetoNetPlayerRemote extends ZepetoNetPlayerBase {
    // When processing framers
    private mCurFrameIndex: number = 0;
    private mMoveCacheData: Queue<ZepetoNetTransformPackage> = new Queue<ZepetoNetTransformPackage>();
    private mCurMoveData: ZepetoNetTransformPackage = null;
    private mRemoteAngle: Vector3 = Vector3.zero;
    private mHasTarget: boolean = false;
    private mTargetData: sNetTransform = null;
    private mTargetPos: Vector3 = Vector3.zero;
    private mLastTargetPos: Vector3 = Vector3.zero;
    private mLerpSum: number = 0;
    private mLerpDis: number = 0;
    private mCurLerp: number = 1;
    private mCurPos: Vector3 = Vector3.zero;
    private mAccelearte: number = 1;
    //Ejection caused insufficient synchronous data cache  Expand cache limit
    private readonly mMaxCachaNum: number = 1000;      
    private readonly mAcceNum: number = 4;

    private mDataPool: Queue<ZepetoNetTransformPackage> = new Queue<ZepetoNetTransformPackage>();

    private GetPackageFromPool(): ZepetoNetTransformPackage {
        if (this.mDataPool.Size() > 0) {
            let data = this.mDataPool.Dequeue();
            return data;
        }
        return new ZepetoNetTransformPackage();
    }

    /**
     * @description: Accept data packets sent by the server
     * @param 
     */

    public ReceiveMoveData(dataJson: string) {
        if (this.mIsLocal) return;
        let data = this.GetPackageFromPool();
        data.ParseJson(dataJson);
        this.AddMoveDataPackage(data);
    }

    private AddMoveDataPackage(pak: ZepetoNetTransformPackage) {
        let cacheSize = this.mMoveCacheData.Size();
        if (cacheSize > this.mMaxCachaNum) {
            console.error("[Excessive data cache packets exception] receive lots move cache date!", cacheSize);
            this.mMoveCacheData.Clear();
            this.mAccelearte = 1;
        }
        //Ejection caused excessive synchronization data  Accelerated LERP
        else if (cacheSize > 20) {     
            this.mAccelearte = 5;
        }
        else if (cacheSize > this.mAcceNum) {
            console.warn("[Network fluctuations causing data congestion, Accelerated LERP] !", cacheSize);
            this.mAccelearte = 2;
        } else {
            this.mAccelearte = 1;
        }

        if (this.mCurFrameIndex > pak.mIndex) {
            console.error("[Packet index exception] !");
            return;
        }
        this.mMoveCacheData.Enqueue(pak);
    }

    private GetMoveData() {
        if (this.mMoveCacheData.Size() > 0) {
            this.mCurMoveData = this.mMoveCacheData.Dequeue();
            this.mCurFrameIndex = this.mCurMoveData.mIndex;
        } else {
            this.mCurMoveData = null;
        }
    }

    protected RemotePlayerMove() {
        // Get mobile data
        if (this.mCurMoveData == null) {
            this.GetMoveData();
        } else if (!this.mHasTarget) {
            if (this.mCurMoveData.IsEmpty()) {
                this.mDataPool.Enqueue(this.mCurMoveData);
                this.GetMoveData();
            } else if (this.mCurMoveData.IsCacheData() && this.mMoveCacheData.Size() > 0) {
                this.mDataPool.Enqueue(this.mCurMoveData);
                this.GetMoveData();
            }
        }

        // Simulate movement
        if (this.mCurMoveData != null) {
            this.SimulateMove();
        }
    }

    protected SimulateMove() {
        // If there is no moving target
        if (!this.mHasTarget) {
            this.mTargetData = this.mCurMoveData.GetNextPosData();
            if (this.mTargetData != null) {
                this.UpdateAnimatorState(this.mTargetData.s);
                this.GetPosition(this.mTargetData);
                this.transform.eulerAngles = this.GetAngle(this.mTargetData);
                this.mHasTarget = true;
            }
        }
        // Moving towards the target point lerp， Angle not considered for the time being, lerp
        if (this.mHasTarget) {
            this.transform.position = Vector3.Lerp(this.mCurPos, this.mTargetPos, this.mCurLerp / this.mLerpSum);
            this.mCurLerp++;
        }
        // If completed
        if (this.mCurLerp > this.mLerpSum) {
            this.mHasTarget = false;
            this.mCurLerp = 1;
            this.mLerpSum = 1;
        }
    }

    private GetAngle(data: sNetTransform): Vector3 {
        this.mRemoteAngle.y = data.a;
        return this.mRemoteAngle;
    }

    /**
     * @description: Calculate based on physical frames！！！
     */
    private GetPosition(data: sNetTransform) {
        this.mTargetPos.x = data.x * 0.01;
        this.mTargetPos.y = data.y * 0.01;
        this.mTargetPos.z = data.z * 0.01;

        this.mLerpDis = Vector3.Distance(this.mTargetPos, this.transform.position);
        if (this.mLerpDis > this.mMaxMoveDis || this.mLerpDis <= this.mMinMoveDis) {
            this.transform.position = this.mTargetPos;
            //console.warn("[Blink adjustment position]");
            this.mLerpSum = 1;
        } else {
            let speed = this.GetMoveSpeedByDir(this.mAnimatorState) * Time.fixedDeltaTime;
            this.mLerpSum = Math.round(this.mLerpDis / (speed * this.mAccelearte));
        }
        this.mCurPos = this.transform.position;
        this.mCurLerp = 1;
        if (this.mLerpSum < 1) this.mLerpSum = 1;
        this.mLastTargetPos = this.mTargetPos;
    }
}

/**
 * Remote player mobile synchronization processing
 */
export default class ZepetoNetPlayer extends ZepetoNetPlayerRemote {

    /**
     * @description: constant
     */
    public mGravity: number = 10;
    private readonly mMaxMoveTime: number = 0.5;

    /**
    * @description: variable
    */
    //@HideInInspector()
    public mJumpPower: number = 8;
    public sessionId: string;
    private mCurMoveSpeed: number = 0;
    private mIsMoving: boolean;
    private mIsJumping: boolean;

    @SerializeField()
    private mGravityVelocity: Vector3 = Vector3.zero;
    private mMoveDir: Vector3 = Vector3.zero;
    private mTimer: number = 0;
    private mToAngle: Vector3 = Vector3.zero;

    /**
     * @description: Unity CallBack
     */
    Awake() {
        this.mAnimator = this.GetComponentInChildren<Animator>();
        if (this.mAnimator == null) {
            console.error("Missing Animator!");
        }
        this.mCharacterController = this.GetComponent<CharacterController>();
        if (this.mCharacterController == null) {
            console.error("Missing CharacterController!");
        }
        this.mCharacterController.slopeLimit = 55;
        this.mGravityVelocity.y = -this.mGravity;
    }
    Start() {
        this.InitLight();
    }
    public SetLightObj(obj) {
        this.objLight = obj;
    }
    public SetIKCtrl(ikctrl) {
        this.IKCtrl = ikctrl;
    }
    public GetIKCtrl() {
        return this.IKCtrl;
    }

    InitLight() {
        this.SuperLightCurTimes = this.SuperLightMaxUseTimes;
        this.SuperLightCurCDTime = this.SuperLightCDTime;
        this.LightBattle = this.MaxLightBattle;
        this.SuperLightBattle = this.MaxSuperLightBattle;
        this.bSuperLightOpen = false;
        this.SetLightAction(LightState.OFF);
        this.SetSuperLightAction(LightState.OFF);
        UIHunterOperation.Instance.SetFlashImgOn();
        UIHunterOperation.Instance.SetSuperFlashImgOn();
        PlayerManager.Instance.ResetSuperLight();
    }
    // Logical frame
    FixedUpdate() {
        if (this.mIsLocal) {
            this.LockStepData();
        } else {
            this.RemotePlayerMove();
        }
    }

    // Rendered Frame
    Update() {
        if (this.mIsLocal) {
            this.LocalPlayerMove();
            this.PlayerJump();
        }
        this.UpdateLight();
        this.UpdateSuperLight();
    }

    UpdateLight() {
        if (this.LightState == LightState.ON && this.mIsLocal) {
            this.objLight.transform.LookAt(this.mLightTar);
        }

        this.lightTime += Time.deltaTime;
        if (this.lightTime >= 1) {
            if (this.LightState == LightState.ON) {
                // this.LightBattle--;
                if (this.LightBattle <= 0) {
                    this.LightBattle = 0;
                    this.lightTime = 0;
                    this.SetLightAction(LightState.OFF);
                    PlayerManager.Instance.SendLightState(this.LightState);
                }
            } else {
                if (this.LightBattle < this.MaxLightBattle) {
                    // this.LightBattle += 2;
                }
            }
            this.lightTime = 0;
        }
    }

    UpdateSuperLight() {
        if (!this.bSuperLightOpen) {
            return;
        }
        if (this.SuperLightState == LightState.ON && this.mIsLocal) {
            this.objSuperLight.transform.LookAt(this.mLightTar);
        }

        this.lightSuperTime += Time.deltaTime;
        if (this.lightSuperTime >= 1) {
            if (this.SuperLightState == LightState.ON) {
                this.SuperLightBattle--;
                if (this.SuperLightBattle <= 0) {
                    this.SuperLightBattle = 0;
                    this.lightSuperTime = 0;
                    this.SetSuperLightAction(LightState.OFF);
                    PlayerManager.Instance.SendSuperLightState(this.SuperLightState);
                }
            } else {
                PlayerManager.Instance.CloseScaneRound();
                this.SuperLightBattle = this.MaxSuperLightBattle;
                this.bSuperLightOpen = false
            }
            this.lightSuperTime = 0;
        }
    }

    /**
     * @description: Public When the skip button is pressed
     */
    public Jump() {
        if (!this.mIsJumping) {
            this.mGravityVelocity.y = this.mJumpPower;
            this.mIsJumping = true;
            this.UpdateAnimatorState(MoveDirState.Jump);
            this.AddPlayerCurrentData();
            console.log("开始Jump");
        }
    }

    public SetLightAction(state: LightState) {
        if (this.objLight) {
            this.LightState = state;
            this.objLight.SetActive(this.LightState == LightState.ON);
            this.IKCtrl.ikActive = this.objLight.activeSelf;
        }
    }

    public SetSuperLightAction(state: LightState) {
        this.SuperLightState = state;
    }

    /**
     * @description: Stop moving
     */
    public StopMoving() {
        if (this.mIsMoving) {
            this.mIsMoving = false;
            this.UpdateAnimatorState(0);
            this.mCurMoveSpeed = 0;
            this.mTimer = 0;
            this.AddPlayerCurrentData();
        }
    }

    /**
     * @description: Attempt to move
     */
    public StartMove(uiMoveDir: Vector2) {
        let moveState = this.CalMoveStateByUI(uiMoveDir);
        this.UpdateAnimatorState(moveState);
        let curForward = Vector3.op_Multiply(this.transform.forward, uiMoveDir.y);
        let curRight = Vector3.op_Multiply(this.transform.right, uiMoveDir.x);
        this.mMoveDir = Vector3.op_Addition(curForward, curRight).normalized;
        this.mCurMoveSpeed = this.GetMoveSpeedByDir(moveState);
        this.mTimer = 0;
        this.mIsMoving = true;


    }

    /**
     * @description: Update Angle
     */
    public UpdateAngel(toAngle: number) {
        this.mToAngle.y = toAngle;
        this.transform.eulerAngles = this.mToAngle;
    }

    private CalMoveStateByUI(uiDir: Vector2): MoveDirState {
        let abs_y = Math.abs(uiDir.y);
        let abs_x = Math.abs(uiDir.x);

        if (abs_y >= abs_x) {
            if (uiDir.y > 0) {
                return MoveDirState.Forward;
            } else {
                return MoveDirState.Back;
            }
        }
        else {
            if (uiDir.x > 0) {
                return MoveDirState.Left;
            } else {
                return MoveDirState.Right;
            }
        }
    }

    /**
     * @description: Physical movement logic
     */
    private LocalPlayerMove() {
        if (this.mIsMoving) {
            this.mTimer += Time.deltaTime;
            if (this.mTimer > this.mMaxMoveTime) {
                this.StopMoving();
            }

            if (this.mCharacterController.enabled)
                this.mCharacterController.Move(Vector3.op_Multiply(this.mMoveDir, this.mCurMoveSpeed * Time.deltaTime));
        }
    }

    /**
     * @description: Physical jump logic
     */
    private PlayerJump() {
        if (this.mIsJumping) {
            this.mGravityVelocity.y -= this.mGravity * 2.5 * Time.deltaTime;
            if (this.mGravityVelocity.y < -this.mGravity * 1) {
                this.mIsJumping = false;
                if (this.mIsMoving)
                    this.UpdateAnimatorState(MoveDirState.Forward);
                else this.UpdateAnimatorState(MoveDirState.None);
                console.log("停止Jump");
            }
        }
        if (this.mCharacterController.enabled)
            this.mCharacterController.Move(Vector3.op_Multiply(this.mGravityVelocity, Time.deltaTime));
    }

    /**
     * @description: Physical jump logic
     */
    private mHeartDataTimer: number = 0;
    private readonly mHeartDataConst: number = 50;
    LockStepData() {
        this.mFrameIndex++;

        if (this.mIsJumping || this.mIsMoving) {
            this.AddPlayerCurrentData();
            this.SendMoveData();
        } else {
            this.mHeartDataTimer++;
            if (this.mHeartDataTimer > this.mHeartDataConst) {
                this.AddPlayerCurrentData();
                this.SendMoveData();
            }
        }
        if (this.mFrameIndex >= this.mSendPakRate) {
            this.mFrameIndex = 0;
            if (!this.mSendLocalPackage.IsEmpty()) {
                if (!this.mIsJumping && this.mIsMoving) this.AddPredictData();
                this.SendMoveData();

            }
        }
    }

    AddPlayerCurrentData() {
        this.mHeartDataTimer = 0;
        let data: sNetTransform = new sNetTransform();
        data.SetPosition(this.transform.position)
        data.a = Math.round(this.transform.eulerAngles.y);
        data.s = this.mAnimatorState;
        this.mSendLocalPackage.mDatas.Enqueue(data);
    }

    AddPredictData() {
        let data: sNetTransform = new sNetTransform();
        let nextPosOffset = Vector3.op_Multiply(this.mMoveDir, this.mRunSpeed * Time.fixedDeltaTime);
        let nextPos = Vector3.op_Addition(this.transform.position, nextPosOffset);
        data.SetPosition(nextPos);
        data.a = Math.round(this.transform.eulerAngles.y);
        data.s = this.mAnimatorState;
        this.mSendLocalPackage.mDatas.Enqueue(data);

        let data2: sNetTransform = new sNetTransform();
        nextPosOffset = Vector3.op_Multiply(this.mMoveDir, this.mRunSpeed * Time.fixedDeltaTime * 2);
        let nextPos2 = Vector3.op_Addition(this.transform.position, nextPosOffset);
        data2.SetPosition(nextPos2);
        data2.a = Math.round(this.transform.eulerAngles.y);
        data2.s = this.mAnimatorState;
        this.mSendLocalPackage.mDatas.Enqueue(data2);
    }

    GetLightBattle() {
        return this.LightBattle;
    }

    public SetJumpOver() {
        this.mIsJumping = false;
    }
}


