import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import PlayerManager, { LightState } from '../GameManager/PlayerManager'
import { Time, GameObject } from "UnityEngine";
import { Button, Image, Slider } from 'UnityEngine.UI';
import AudioController from '../GameController/AudioController';
import UIHunterOperation from './UIHunterOperation';
import { GameState } from "../GameManager/NetManager"
import GameMain from '../GameMain';
/**
 * Flashlight button
 * 1、Switch control
 * 2、Damage range detection
 */
export default class UIShootBtn extends ZepetoScriptBehaviour {

    public mCooldownImg: Slider;
    public mTimer: number;
    public ImgHandLine_on: GameObject;
    public ImgHandLine_off: GameObject;
    public Progress: Image;
    public scaneTime: number = 0;
    Start() {
        this.GetComponent<Button>().onClick.AddListener(() => {
            console.log("_PotClick", this.name);
            let locPlay = PlayerManager.Instance.mLocalZepetoNetPlayer;
            if (this.name == "Flashlight") {
                if (locPlay.LightState == LightState.OFF && locPlay.GetLightBattle() > 0) {
                    AudioController.Instance.PlayOpenLight();

                    locPlay.SetLightAction(LightState.ON);

                    this.ImgHandLine_off.SetActive(false);
                    this.ImgHandLine_on.SetActive(true);
                } else {
                    locPlay.SetLightAction(LightState.OFF);
                    this.ImgHandLine_off.SetActive(true);
                    this.ImgHandLine_on.SetActive(false);
                }
                PlayerManager.Instance.SendLightState(locPlay.LightState);
                this.mCooldownImg.value = (locPlay.LightBattle / locPlay.MaxLightBattle);
                // this.StopCoroutine(this.RunRay());
                // this.StartCoroutine(this.RunRay());
            } else if (this.name == "SuperFlashlight") {
                // SuperFlashlight
                if (locPlay.SuperLightCurTimes > 0) {
                    if (locPlay.SuperLightState == LightState.OFF) {
                        // AudioController.Instance.PlayOpenLight();
                        locPlay.SetSuperLightAction(LightState.ON);
                        locPlay.bSuperLightOpen = true;
                        locPlay.SuperLightBattle = locPlay.MaxSuperLightBattle;
                        this.ImgHandLine_off.SetActive(false);
                        this.ImgHandLine_on.SetActive(true);
                        // Set ordinary flashlight to turn off
                        UIHunterOperation.Instance.SetSuperFlashImgOff();
                        this.mCooldownImg.value = (locPlay.LightBattle / locPlay.MaxLightBattle);
                        PlayerManager.Instance.SendSuperLightState(locPlay.SuperLightState);
                        this.Progress.fillAmount = 1;
                        locPlay.SuperLightCurTimes--;
                        //    if( locPlay.SuperLightCurTimes<=0){
                        //     UIHunterOperation.Instance.ObjSuperLight.SetActive(false);
                        //    }
                        locPlay.SuperLightCurCDTime = 0;
                        PlayerManager.Instance.ShowScaneRound(PlayerManager.Instance.mLocalZepetoNetPlayer);
                    }
                }
            }
        })
    }




    Update() {

        if (GameMain.Instance.mGameState == GameState.GameStart && this.name == "SuperFlashlight") {
            this.Progress.fillAmount = 1;
        }

        if (PlayerManager.Instance.mLocalZepetoNetPlayer) {
            if (this.name == "Flashlight") {
                if (PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.OFF) {
                    if (this.mCooldownImg.value < PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle) {
                        this.mCooldownImg.value += (Time.deltaTime / (PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle / 2));
                    }
                } else if (PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.ON) {
                    if (this.mCooldownImg.value > 0) {
                        this.mCooldownImg.value -= (Time.deltaTime / PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle);
                    }
                }
                PlayerManager.Instance.mLocalZepetoNetPlayer.LightBattle = this.mCooldownImg.value * PlayerManager.Instance.mLocalZepetoNetPlayer.MaxLightBattle;
                this.mTimer += Time.deltaTime;
                if (this.mTimer >= 1) {
                    this.mTimer = 0;
                    this.ImgHandLine_off.SetActive(
                        PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.OFF);
                    this.ImgHandLine_on.SetActive(
                        PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.ON);
                }

                this.scaneTime += Time.deltaTime;
                if (PlayerManager.Instance.mLocalZepetoNetPlayer.LightState == LightState.ON && this.scaneTime > 0.2) {
                    this.scaneTime = 0;
                    //Flashlight damage range detection
                    PlayerManager.Instance.CheckPlayerInSectorArea(20, 20, 3);
                }
            } else {
                if (PlayerManager.Instance.mLocalZepetoNetPlayer.bSuperLightOpen && this.Progress) {
                    if (PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurTimes <= 0) {
                        this.gameObject.SetActive(false);
                    }
                    if (PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightBattle <= 0) {
                        PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightBattle = PlayerManager.Instance.mLocalZepetoNetPlayer.MaxSuperLightBattle;
                        PlayerManager.Instance.mLocalZepetoNetPlayer.SetSuperLightAction(LightState.OFF);
                    }
                }
                if (PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurCDTime < PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCDTime) {
                    UIHunterOperation.Instance.SetSuperFlashImgOff();

                    PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurCDTime += Time.deltaTime;
                    this.Progress.fillAmount = PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurCDTime / PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCDTime;
                    if (this.Progress.fillAmount == 1) {
                        UIHunterOperation.Instance.SetSuperFlashImgOn();
                        PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCurCDTime = PlayerManager.Instance.mLocalZepetoNetPlayer.SuperLightCDTime;
                    }
                }
            }
        }
    }
}