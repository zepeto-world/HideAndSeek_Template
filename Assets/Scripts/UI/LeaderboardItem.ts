import { Rect, Sprite, Texture, Texture2D, Vector2 } from 'UnityEngine';
import { Image, Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldHelper } from 'ZEPETO.World';
import { sPlayerInfo } from "ZEPETO.Multiplay.Schema";
import { Rank } from 'ZEPETO.Script.Leaderboard';

/**
 * Game Settlement Ranking Component
 */
export default class LeaderboardItem extends ZepetoScriptBehaviour {

    public mRankImageArr: Sprite[];

    public mNameText: Text;
    public mScoreText: Text;
    public mRankText: Text;

    public mRankImage: Image;
    public mHeadImage: Image;

    public SetRankData(data: Rank) {
        try {
            this.LoadHeadImg(data.member);
            if (data.rank <= 3) {
                this.mRankImage.sprite = this.mRankImageArr[data.rank - 1];
                this.mRankImage.gameObject.SetActive(true);
                this.mRankText.gameObject.SetActive(false);
            }
            else {
                this.mRankText.text = data.rank.toString();
                this.mRankImage.gameObject.SetActive(false);
                this.mRankText.gameObject.SetActive(true);
            }

            this.mScoreText.text = data.score + "";
            this.mNameText.text = data.name + "";
        } catch (error) {
            console.error(data.rank, data.name, data.score, data.member);
            console.error(error);
        }
    }


    public SetPlayerInfoData(playerInfo: sPlayerInfo, rank: number) {
        this.LoadHeadImg(playerInfo.userId);
        if (rank <= 3 && rank > 0) {
            this.mRankImage.sprite = this.mRankImageArr[rank - 1];
            this.mRankImage.gameObject.SetActive(true);
            this.mRankText.gameObject.SetActive(false);
        }
        else {
            this.mRankText.text = rank.toString();
            this.mRankImage.gameObject.SetActive(false);
            this.mRankText.gameObject.SetActive(true);
        }
        this.mScoreText.text = playerInfo.score ? playerInfo.score.toString() : "0";
        this.mNameText.text = playerInfo.nickName;
    }

    private LoadHeadImg(userId: string) {
        this.mHeadImage.enabled = false;
        ZepetoWorldHelper.GetProfileTexture(userId, (texture: Texture) => {
            if (this) {
                this.mHeadImage.sprite = this.GetSprite(texture);
                this.mHeadImage.enabled = true;
            }
        }, (error) => {
            console.error(error);
        });
    }

    private GetSprite(texture: Texture) {
        let rect: Rect = new Rect(0, 0, texture.width, texture.height);
        return Sprite.Create(texture as Texture2D, rect, new Vector2(0.5, 0.5));
    }

}