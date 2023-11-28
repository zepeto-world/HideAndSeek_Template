import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { EventTrigger, EventTriggerType, PointerEventData } from 'UnityEngine.EventSystems'
import { Entry } from 'UnityEngine.EventSystems.EventTrigger';
import PlayerManager, { LightState } from '../GameManager/PlayerManager'
import UIManager from "../GameManager/UIManager"
import { Mathf, Quaternion, RectTransformUtility, Vector2, Vector3, Time, Application, WaitForSeconds, GameObject, WaitForEndOfFrame } from "UnityEngine";
import { ZepetoCamera, ZepetoCharacter, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import TransformHelper from '../Common/TransformHelper';
import { Button, Slider } from 'UnityEngine.UI';
import AudioController from '../GameController/AudioController';
import { textChangeRangeIsUnchanged } from 'typescript';

/**
 * Finder operation interface
 */
export default class UIHunterOperation extends ZepetoScriptBehaviour {


    private static _instance: UIHunterOperation;

    public static get Instance(): UIHunterOperation {
        return UIHunterOperation._instance;
    }
    public ObjLight: GameObject;
    public ObjSuperLight: GameObject;
    public ImgFlash_on: GameObject;
    public ImgFlash_off: GameObject;
    public ImgSuperFlash_on: GameObject;
    public ImgSuperFlash_off: GameObject;
    Awake() {
        UIHunterOperation._instance = this;
    }

    SetFlashImgOff() {
        this.ObjLight.GetComponent<Button>().interactable = false;
        this.ImgFlash_off.SetActive(true);
        this.ImgFlash_on.SetActive(false);
    }

    SetFlashImgOn() {
        this.ObjLight.GetComponent<Button>().interactable = true;
        this.ImgFlash_off.SetActive(false);
        this.ImgFlash_on.SetActive(true);
    }
    SetSuperFlashImgOff() {
        this.ObjSuperLight.GetComponent<Button>().interactable = false;
        this.ImgSuperFlash_off.SetActive(true);
        this.ImgSuperFlash_on.SetActive(false);
    }

    SetSuperFlashImgOn() {
        this.ObjSuperLight.GetComponent<Button>().interactable = true;
        this.ImgSuperFlash_off.SetActive(false);
        this.ImgSuperFlash_on.SetActive(true);
    }


}