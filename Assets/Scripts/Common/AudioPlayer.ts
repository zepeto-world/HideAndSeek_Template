import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import AudioController from '../GameController/AudioController'
import * as UnityEngine from "UnityEngine";

export enum AudioPlayerOption {
    PlayOneShot,
    PlayAtPoint,
}

export default class AudioPlayer extends ZepetoScriptBehaviour {
    public mAudioClip: UnityEngine.AudioClip;
    public mPlayMode: AudioPlayerOption;
    public mAutoPlay: boolean = true;

    OnEnable() {
        if (this.mAutoPlay) {
            this.Play();
        }
    }

    Play() {
        if (this.mAudioClip == null) {
            // console.error("audioclip is null");
            return;
        }
        switch (this.mPlayMode) {
            case AudioPlayerOption.PlayAtPoint:
                AudioController.Instance.PlayAtPoint(this.mAudioClip, this.transform.position);
                break;
            default:
                //AudioController.Instance.PlayAtPoint(this.mAudioClip, this.transform.position);
                AudioController.Instance.PlayOneShot(this.mAudioClip);
                break;
        }
    }
}