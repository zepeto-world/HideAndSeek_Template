import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Button, Image, Text, Toggle } from "UnityEngine.UI"
import { Color, GameObject, Input, KeyCode, Time } from 'UnityEngine'
import UIManager from "../GameManager/UIManager";
import { sGameInfo, sPlayer } from "ZEPETO.Multiplay.Schema";
import UIHPBar from "../UI/UIHPBar"
import UIRandomModelPanel from "../UI/UIModelRandomPanel"
import UIToast from './UIToast';
import { GameState } from '../GameManager/NetManager';
import PlayerManager from '../GameManager/PlayerManager';
import { GameRule } from '../GameMain';

/**
 * Game main interface
 */
export default class UIHomePanel extends ZepetoScriptBehaviour {

    public mHunterOptionPanel: GameObject;
    public mHiderOptionPanel: GameObject;
    public mRandomModelPanel: GameObject;
    public mMiddleGameInfo: GameObject;
    public mChangeModelBtn: GameObject;
    public mChangeModelPanel: GameObject;
    public mFlashlightBtn: Button;
    public mBuffBtn: Button;
    public mTimerText: Text;
    public mHP: GameObject;
    public mHiderNumText: Text;
    public mLockViewToggle: Toggle;
    public mFreeCameraToggle: Toggle;
    private mGameLeftTime: number;
    private mCurHP: number;
    private mIsHunter: boolean;
    private mHPBar: UIHPBar;
    public mImgBuffCD: Image;
    private mCurBufCDTime: number;
    private mTargetBufCDTime: number;
    private mBuffCD: number = 20;
    private mIsBuffCD: boolean;
    private readonly BUF_HIDE: number = 1;

    Awake() {
        this.mLockViewToggle.onValueChanged.AddListener((v) => {
            UIManager.Instance.OnLockView(v);
        });

        this.mFreeCameraToggle.onValueChanged.AddListener((v) => {
            UIManager.Instance.OnFreeCamra(v);
            // From a free perspective hide Lock button
            this.mLockViewToggle.gameObject.SetActive(!v);
        });

        this.mHPBar = this.mHP.GetComponent<UIHPBar>();

        this.mBuffBtn.onClick.AddListener(() => {
            this.OnBuffCD();
            UIManager.Instance.OnUseBuff(this.BUF_HIDE);
        });
    }

    Update() {
        if (Input.GetKeyDown(KeyCode.Q)) {
            this.mHunterOptionPanel.SetActive(true);
        }
        this.UpdateBuffCD();
    }

    public Init() {
        this.mHunterOptionPanel.SetActive(false);
        this.mHiderOptionPanel.SetActive(false);
        this.mMiddleGameInfo.SetActive(false);
        this.mFreeCameraToggle.gameObject.SetActive(false);
        this.mFlashlightBtn.gameObject.SetActive(true);
        this.mBuffBtn.gameObject.SetActive(false);
        this.mHiderNumText.text = "0";
        this.mBuffBtn.interactable = true;
        this.mHP.SetActive(false);
    }

    public OnDie(data: any) {
        let isSelf = data.isSelf;
        if (isSelf) {
            this.mHiderOptionPanel.SetActive(false);
            UIToast.Instance.ShowHiderDead();
            PlayerManager.Instance.DieFreeCamera();
        }
    }

    /**
     * Update the number of invisible buffs
     * @param buffNum 
     */
    public UpdateBuff(buffNum: number) {
        console.log("Update the invisible buff quantity", buffNum);
        if (buffNum <= 0) {
            this.mBuffBtn.interactable = false;
            this.mBuffBtn.gameObject.SetActive(false);
            this.mIsBuffCD = false;
        } else {
            if (!this.mIsBuffCD) {
                this.mBuffBtn.interactable = true;
                this.mBuffBtn.gameObject.SetActive(true);
                this.mImgBuffCD.fillAmount = 1;
            }
        }
    }

    private OnBuffCD() {
        this.mImgBuffCD.fillAmount = 0;
        this.mIsBuffCD = true;
        this.mCurBufCDTime = 0;
        this.mBuffBtn.interactable = false;
        this.mTargetBufCDTime = this.mGameLeftTime - this.mBuffCD;
    }

    /**
     * Invisible BuffCD
     */
    public UpdateBuffCD() {
        if (this.mIsBuffCD && this.mBuffBtn.enabled) {
            this.mCurBufCDTime += Time.deltaTime;
            this.mImgBuffCD.fillAmount = this.mCurBufCDTime / this.mBuffCD;
            if (this.mCurBufCDTime >= this.mBuffCD || this.mGameLeftTime <= this.mTargetBufCDTime - 1) {
                this.mImgBuffCD.fillAmount = 1;
                this.mIsBuffCD = false;
                this.mCurBufCDTime = 0;
                this.mBuffBtn.interactable = true;
            }
        }
    }


    public InitMaxHP(maxHP: number, peakHP: number) {
        this.mHPBar.InitHPBar(maxHP, peakHP);
    }

    /**
     * Update Health
     * @param curHP 
     * @returns 
     */
    public UpdateUP(curHP: number): boolean {
        let isBeAttacked: boolean = false;
        if (!this.mHP.activeSelf) {
            this.mHP.SetActive(true);
        }
        if (curHP < this.mCurHP) {
            isBeAttacked = true;
        }
        this.mCurHP = curHP;
        this.mHPBar.SetValue(curHP);
        return isBeAttacked;
    }

    /**
     * Number of Hiders
     * @param findNumber 
     * @param hideNumber 
     */
    public UpdateUI(findNumber: number, hideNumber: number) {
        let showNumber = hideNumber.toString();
        if (hideNumber < 10 && hideNumber > 0) {
            showNumber = "0" + showNumber;
        }
        this.mHiderNumText.text = showNumber;
    }

    public OnGameWait() {
        this.mChangeModelBtn.SetActive(true);
    }

    public OnGameReady() {
        this.Init();
    }

    /**
     * Refresh UI based on camp
     * @param gameInfo 
     * @param player 
     * @returns 
     */
    private OnUpdateOperatePanel(gameInfo: sGameInfo, player: sPlayer) {
        if (gameInfo == null) return;

        if (gameInfo.GameState >= GameState.GameStart) {
            this.mMiddleGameInfo.SetActive(true);
            this.mChangeModelBtn.SetActive(false);
            this.mChangeModelPanel.SetActive(false);

            if (player == null) return;

            if (!player.isHunter) {
                this.mHunterOptionPanel.SetActive(false);
                let isDie = player.HP <= 0;
                this.mHiderOptionPanel.SetActive(!isDie);
                this.UpdateBuff(player.buffNum);
            }
            else {
                this.mHunterOptionPanel.SetActive(true);
                this.mHiderOptionPanel.SetActive(false);
            }
        }
    }


    public OnGameStart(gameInfo: sGameInfo, gameRule: GameRule, player: sPlayer) {
        this.mBuffCD = gameRule.buffCD;

        //this.mTutorialPanel.SetActive(false);
        this.mMiddleGameInfo.SetActive(true);
        this.mChangeModelBtn.SetActive(false);
        this.mChangeModelPanel.SetActive(false);
        this.mLockViewToggle.isOn = false;
        this.mFreeCameraToggle.isOn = false;

        this.mIsHunter = player.isHunter;
        if (!this.mIsHunter) {
            this.mHunterOptionPanel.SetActive(false);
            this.mHiderOptionPanel.SetActive(true);
            this.UpdateBuff(player.buffNum);
            // console.error("Current Health：", player.HP, "target model", player.targetModel);            
            this.OpenRandomModelPanel(player.targetModel);
            this.mLockViewToggle.gameObject.SetActive(true);
            this.InitMaxHP(gameRule.initHP, gameRule.peekHP);
        }
        else {
            this.mHunterOptionPanel.SetActive(true);
            this.mHiderOptionPanel.SetActive(false);
        }
        this.OnGameUpdate(gameInfo, player);
        this.StopAllCoroutines();
    }

    public OnGameUpdate(gameInfo: sGameInfo, player: sPlayer) {
        //console.log("Game turn time" + gameInfo.GameLeftTime);
        this.OnUpdateOperatePanel(gameInfo, player);
        if (gameInfo.GameLeftTime != null) {
            this.UpdateGameLeftTime(gameInfo.GameLeftTime);
            this.UpdateUI(gameInfo.HunterNum, gameInfo.HiderNum);
        }
    }

    public OnPeakMoment(addHP: number) {
        this.mCurHP += addHP;
        this.mHPBar.SetValue(this.mCurHP);
        // Enable stealth buf
        this.mBuffBtn.gameObject.SetActive(true);
    }

    public OpenRandomModelPanel(targetModelId: number) {
        this.mRandomModelPanel.GetComponent<UIRandomModelPanel>().Show(targetModelId);
    }

    public HideRandomModelPanel() {
        this.mRandomModelPanel.GetComponent<UIRandomModelPanel>().Hide();
    }

    private UpdateGameLeftTime(time: number) {
        this.mGameLeftTime = time;
        var min = Math.floor(time / 60);
        var sec = time % 60;
        this.mTimerText.text = (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
    }

    public OnGameOver() {
        this.StopAllCoroutines();
        this.Init();
        this.mHunterOptionPanel.SetActive(false);
        this.mHiderOptionPanel.SetActive(false);
    }

    public OnRoundOver() {
        this.StopAllCoroutines();
        this.Init();
        this.SetTimerColor(false);
    }

    /**
     * The countdown to peak hour turns red 
     * @param isPeak 
     */
    public SetTimerColor(isPeak: boolean) {
        this.mTimerText.color = isPeak ? new Color(255, 0, 0) : new Color(255, 255, 255);
    }

}