import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Transform, Quaternion, Animator, AvatarIKGoal, AvatarIKHint, GameObject, Time } from 'UnityEngine';

/**
 * IK control when turning on a flashlight
 */
export default class IKCtrl extends ZepetoScriptBehaviour {
    private animator: Animator;
    public ikActive: bool = false;
    public ikObj: Transform = null;
    public ikGoal: number = AvatarIKGoal.RightHand;
    // public ikanimator: Animator;

    Start() {
        this.animator = this.transform.GetComponent<Animator>();
    }

    OnAnimatorIK() {
        if (this.animator) {
            if (this.ikActive) {
                this.animator.SetIKPositionWeight(this.ikGoal, 1);
                this.animator.SetIKRotationWeight(this.ikGoal, 1);

                if (this.ikObj != null) {
                    this.animator.SetIKPosition(this.ikGoal, this.ikObj.position);
                    this.animator.SetIKRotation(this.ikGoal, this.ikObj.rotation);
                }
            }
            else {
                this.animator.SetIKPositionWeight(this.ikGoal, 0);
                this.animator.SetIKRotationWeight(this.ikGoal, 0);
            }
        }
    }

}