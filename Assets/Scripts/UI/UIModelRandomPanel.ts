import { ZepetoScriptableObject, ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ModelImageConverter from '../Model/ModelImageConverter';
import { Button, Image, Text } from 'UnityEngine.UI';
import { WaitForSeconds, Sprite, Vector2, RectTransform, AnimationCurve, Mathf } from "UnityEngine"
import UIManager from "../GameManager/UIManager"

/**
 * Random Model Interface
 */
export default class UIModelRandomPanel extends ZepetoScriptBehaviour {

    public mIconImageList: ZepetoScriptableObject<ModelImageConverter>;
    public mIconImgs: Image[];
    public mReselectBtn: Button;
    public mConfirmBtn: Button;
    public mStarTxt: Text;
    public mStarTxt_leftup: Text;

    private mTargetId: number;
    private mModelLength: number;
    private mSprites: Sprite[];
    private mCountSum: number;
    private mTimer: number = 0;

    public mMaxInterval: number = 0.5;
    public mMinInterval: number = 0.1;
    public mAnimationTime: number = 3;
    public mCurve: AnimationCurve;
    private mIndexs: number[];

    Awake() {
        this.mSprites = this.mIconImageList.targetObject.modelList;
        this.mModelLength = this.mSprites.length;

        for (var i = 0; i < this.mIconImgs.length; i++) {
            this.mIconImgs[i] = this.mIconImgs[i].transform.Find("Icon").GetComponent<Image>();
        }

        for (var i = 0; i < this.mIconImgs.length; i++) {
            this.mIconImgs[i].sprite = this.mSprites[i];
        }
        this.CalCountSum();
    }

    Start() {
        this.mReselectBtn.onClick.AddListener(() => {
            //console.log("Reselect Button");
            UIManager.Instance.SendRandomModel();
            this.mConfirmBtn.interactable = false;
            this.mReselectBtn.interactable = false;
        });

        let _cost = UIManager.Instance.mGameRule.randomModelCost;
        this.mStarTxt.text = _cost.toString();

        this.mConfirmBtn.onClick.AddListener(() => {
            //console.log("Confirm Button");
            UIManager.Instance.OnChangeModelCost(this.mTargetId, 0);
            this.Hide();
        });
        // this.Show(0);
    }

    UpdateStar(curStar: number) {
        this.mStarTxt_leftup.text = curStar.toString();
    }

    CalCountSum() {
        this.mTimer = 0;
        let count: number = 0;

        while (this.mTimer <= this.mAnimationTime) {
            let t = this.mTimer / this.mAnimationTime;
            let waitTime = Mathf.Lerp(this.mMinInterval, this.mMaxInterval, this.mCurve.Evaluate(t));
            this.mTimer += waitTime;
            count++;
        }

        this.mCountSum = count;
        this.mIndexs = new Array(this.mCountSum + this.mSprites.length);
        this.mTimer = 0;
    }

    public Hide() {
        //this.transform.GetComponent<RectTransform>().anchoredPosition = Vector2.right * 10000;
        this.gameObject.SetActive(false);
    }

    public Show(_targetId: number) {
        this.gameObject.SetActive(true);
        this.mTargetId = _targetId;
        this.transform.GetComponent<RectTransform>().offsetMin = Vector2.zero;
        this.transform.GetComponent<RectTransform>().offsetMax = Vector2.zero;
        this.StartCoroutine(this.IE_Show())
    }

    *IE_Show() {
        yield null;
        this.mConfirmBtn.interactable = false;
        this.mReselectBtn.interactable = false;

        let value_a = Math.random() * (this.mModelLength) + "";

        let r = parseInt(value_a);
        r--;
        if (r < 0) r = 0;

        for (var i = 0; i < this.mIndexs.length; i++) {
            r %= this.mModelLength;
            this.mIndexs[i] = r;
            r++;
        }

        let last_index = this.mIconImgs.length;
        this.mIndexs[this.mCountSum - 1] = this.mTargetId;

        let count = 0;
        this.mTimer = 0;

        while (count < this.mCountSum) {

            let t = this.mTimer / this.mAnimationTime;

            let waitTime = Mathf.Lerp(this.mMinInterval, this.mMaxInterval, this.mCurve.Evaluate(t));

            this.mTimer += waitTime;

            yield new WaitForSeconds(waitTime);
            for (var i = 0; i < this.mIconImgs.length; i++) {
                let index = this.mIndexs[i + count];
                this.mIconImgs[i].sprite = this.mSprites[index];
            }
            //console.log(waitTime, count);
            count++;

        }

        this.mConfirmBtn.interactable = true;

        let _cost = UIManager.Instance.mGameRule.randomModelCost;
        let _curStar = UIManager.Instance.CurStar;

        if (_curStar >= _cost) this.mReselectBtn.interactable = true;
    }

}