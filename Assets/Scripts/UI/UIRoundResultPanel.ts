import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldHelper, Users } from 'ZEPETO.World'
import { sRoundResult } from "ZEPETO.Multiplay.Schema";
import { Texture, Texture2D, Rect, Vector2, Sprite } from "UnityEngine";
import { Image, Text, Button } from "UnityEngine.UI";
import Localization from '../Common/Localization/Scripts/Localization';
import AudioController from '../GameController/AudioController';
import UIManager from '../GameManager/UIManager';

/**
 * Small turn settlement panel
 */
export default class UIRoundResultPanel extends ZepetoScriptBehaviour {

    public mProfileImg: Image;
    public mName: Text;
    public mScore: Text;
    public mCoundDownTimer: Text;

    public mTitle: Text;
    public mContent: Text;
    public mMyScore: Text;

    private mRoundResult: sRoundResult;

    Awake() {
    }

    Show(roundResult: sRoundResult, myRoundScore: number) {
        AudioController.Instance.PlayRoundOver();
        this.gameObject.SetActive(true);
        this.mRoundResult = roundResult;
        this.mMyScore.text = Localization.Instance.GetLocalizedTextWithParam("Ending_tips_2", [myRoundScore.toString()]);
        this.StartCoroutine(this.IE_ShowPanel());
    }

    *IE_ShowPanel() {
        console.log("ShowRoundPanel", this.mRoundResult.hunterId, this.mRoundResult.hiderId);
        var userId = this.mRoundResult.hiderId;
        this.mTitle.text = Localization.Instance.GetLocalizedText("Ending_title_1"); //"Hider Victory";
        this.mContent.text = Localization.Instance.GetLocalizedText("Ending_content_1"); //"Best Hider";
        if (this.mRoundResult.isHunterWin) {
            userId = this.mRoundResult.hunterId;
            this.mTitle.text = Localization.Instance.GetLocalizedText("Ending_title_2"); "Seeker Victory";
            this.mContent.text = Localization.Instance.GetLocalizedText("Ending_content_2"); //"Best Seeker";
        }
        this.mScore.text = this.mRoundResult.bestScore.toString();
        this.LoadHeadImg(userId);
        yield 0;

        let ids: string[] = [userId];
        ZepetoWorldHelper.GetUserInfo(ids, (info: Users[]) => {
            if (this) {
                console.log(info[0].name);
                this.mName.text = info[0].name;
            }
        }, (error) => {
            console.log(error);
        });
    }

    private LoadHeadImg(userId: string) {
        this.mProfileImg.enabled = false;
        console.log("[LoadHead]:Satrt");
        ZepetoWorldHelper.GetProfileTexture(userId, (texture: Texture) => {
            if (this) {
                console.log("[LoadHead]:Success");
                this.mProfileImg.sprite = this.GetSprite(texture);
                this.mProfileImg.enabled = true;
            }
        }, (error) => {
            console.error("[LoadHead]:Failed");
            console.log(error);
        });
    }

    private GetSprite(texture: Texture) {
        let rect: Rect = new Rect(0, 0, texture.width, texture.height);
        return Sprite.Create(texture as Texture2D, rect, new Vector2(0.5, 0.5));
    }

}