import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameObject } from 'UnityEngine';
import { ActionEvent } from './PlayerManager'
import BaseManager from './BaseManager'
import { sEventArg } from "./NetManager"
import UIToast from '../UI/UIToast'
import UILoading from '../UI/UILoading'
import UIHomePanel from '../UI/UIHomePanel'
import { sGameInfo, sPlayer, sRoundResult } from "ZEPETO.Multiplay.Schema";
import UIModelRandomPanel from '../UI/UIModelRandomPanel';
import { GameRule } from '../GameMain';

/**
 * UI Management Class
 * 1. Handling UI display in different game states
 * 2. Display and closing of prompts and pop-up windows in the game
 * 3. Button operation processing in games
 */
export default class UIManager extends BaseManager {

    /* Singleton */
    private static _instance: UIManager;
    public static get Instance(): UIManager {
        return UIManager._instance;
    }

    public mLoadingPanel: GameObject;
    public mHomePanel: GameObject;
    public mRandomModelPanel: GameObject;
    public TOAST: UIToast;
    public mHomeCtrl: UIHomePanel;
    private mLastModel: number;
    private mCurStar: number;
    public elasped: number;
    public get CurStar() { return this.mCurStar; }


    Awake() {
        UIManager._instance = this;
        this.mLastModel = -1;
    }

    Start() {
        this.TOAST = UIToast.Instance;
        this.mLoadingPanel.SetActive(true);
        this.mHomeCtrl = this.mHomePanel.GetComponent<UIHomePanel>();
    }

    /**
     * UI display during the waiting phase
     */
    public OnGameWait() {
        this.mHomeCtrl.OnGameWait();
    }

    /**
     * UI display during the preparation phase
     */
    OnGameReady() {
        // Game Countdown
        this.mHomeCtrl.OnGameReady();
    }

    /**
     * UI display at the beginning of the game
     */
    OnGameStart(gameInfo: sGameInfo, gameRule: GameRule, player: sPlayer) {
        if (this.mHomeCtrl != null) {
            this.mHomeCtrl.OnGameStart(gameInfo, gameRule, player);
        }
    }

    /**
     * UI display in the game
     */
    OnGameUpdate(gameInfo: sGameInfo, player: sPlayer) {
        this.mHomeCtrl.OnGameUpdate(gameInfo, player);
    }

    /**
     * UI display at Peak Moment
     */
    OnPeakMoment(addHP: number, isHunter: boolean) {
        // this.TOAST.ShowPeakMoment(30);
        if (!isHunter) {
            this.mHomeCtrl.OnPeakMoment(addHP);
        }
        this.mHomeCtrl.SetTimerColor(true);
    }

    /**
     * Send Random Transformation
     */
    SendRandomModel() {
        this.SendEvent(sEventArg.RandomModel, null);
    }

    OnShowRandomModel(targetId: number) {
        this.mHomeCtrl.OpenRandomModelPanel(targetId);
    }

    /**
     * Confirm the transformation model
     */
    OnConfirmedModel() {
        this.mHomeCtrl.HideRandomModelPanel();
    }

    /**
     * Game round UI settlement
     * @param roundResult 
     */
    OnRoundOver(roundResult: sRoundResult) {
        console.log("Show RoundOver UI");
        this.mLastModel = -1;

        this.mHomeCtrl.OnRoundOver();
    }

    /**
     * UI settlement at the end of the game
     * @param roundResult 
     */
    OnGameOver() {
        console.log("Game Over");
        this.mHomeCtrl.OnGameOver();
    }

    /**
     * Use stealth
     * @param buffId 
     */
    OnUseBuff(buffId: number) {
        this.SendEvent(sEventArg.UseBuff, buffId);
    }

    CheckCanRestore(): boolean {
        if (this.mLastModel < 0 || this.mLastModel > 90) return false;
        return true;
    }

    /**
     * Lock direction
     * @param buffId 
     */
    OnLockView(isLock: boolean) {
        this.TOAST.ShowLockViewStatus(isLock);
        this.OnActionEvent(ActionEvent.OnLockCamera, isLock);
    }

    /**
     * Free View
     * @param isFree 
     */
    OnFreeCamra(isFree: boolean) {
        this.OnActionEvent(ActionEvent.OnFreeCamera, isFree);
    }

    /**
     * Observation perspective
     * @param sessionId 
     */
    OnWatchCamera(sessionId: string) {
        this.OnActionEvent(ActionEvent.OnWatchCamera, sessionId);
    }

    /**
     * UI display of death
     * @param data 
     */
    OnDie(data: any) {
        this.mHomeCtrl.OnDie(data);
    }

    OnChangeModelCost(modelId: number, cost: number): boolean {
        //let canChange = this.CheckCanChangeModel(cost);

        if (true) {
            this.mLastModel = modelId;
            this.SendEvent(sEventArg.ChangeModel, modelId)
            return true;
        }
        else {
            //this.TOAST.Show("Insufficient star points!", 1);
            return false;
        }
    }

    OnChangeModel(modelId: number): boolean {
        this.mLastModel = modelId;
        this.SendEvent(sEventArg.ChangeModel, modelId);
        return true;
    }

    /**
     * Update Health
     * @param curHP 
     * @param elasped 
     */
    OnUpdateHP(curHP: number, elasped: number) {
        let isBeAttacked = this.mHomeCtrl.UpdateUP(curHP);
        if (isBeAttacked) {
            if (curHP != 0) {
                this.TOAST.ShowHiderBeFound();
            }
        }
    }

    /**
     * Update the number of stars
     * @param curStar 
     */
    OnUpdateStar(curStar: number) {
        this.mCurStar = curStar;
        this.mRandomModelPanel.GetComponent<UIModelRandomPanel>().UpdateStar(curStar);
    }

    /**
     * Update the number of stealth buffs
     * @param curStar 
     */
    OnUpdateBuff(buffNum: number) {
        this.mHomeCtrl.UpdateBuff(buffNum);
    }

    /* Static Canvas Event */
    /**
     * Close the Loading interface
     * @param userId 
     */
    OnFinishLoad(userId: any) {
        console.log("OnFinishLoad!");
        if (this.mLoadingPanel != null) {
            this.mLoadingPanel.GetComponent<UILoading>().OnFinishLoad();
            this.mLoadingPanel = null;
        }
        if (this.mHomeCtrl != null) {
            this.mHomeCtrl.Init();
        }
    }
}