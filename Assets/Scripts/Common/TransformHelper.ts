import {
    GameObject,
    Camera,
    Vector3,
    Quaternion,
    Transform,
    Mathf, Time
} from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

/**
 * Transform Tool Class
 */
export default class TransformHelper extends ZepetoScriptBehaviour {

    static LookAtCamera(go: GameObject) {
        if (go) {
            go.transform.LookAt(Camera.main.transform);
        }
    }

    static LookAtZepetoCamera(go: GameObject, cam: Camera) {
        go.transform.LookAt(cam.transform);
    }

    /**
     * Obtain the relative position relative to the reference object
     * @param targetGameObject 
     * @param selfObj 
     * @returns 
     */
    static GetTargetDirect(targetGameObject: GameObject, selfObj: GameObject): number {
        // let vectorTarget = targetGameObject.transform.position - selfObj.transform.position;
        let x = targetGameObject.transform.position.x - selfObj.transform.position.x;
        let y = targetGameObject.transform.position.y - selfObj.transform.position.y;
        let z = targetGameObject.transform.position.z - selfObj.transform.position.z;
        var vectorTarget = new Vector3(x, 0, z);
        var vectorForward = selfObj.transform.forward;
        var dotValue = Vector3.Dot(vectorForward.normalized, vectorTarget.normalized);

        var crossValue = Vector3.Cross(vectorForward, vectorTarget);
        var LR;
        var FB;

        if (crossValue.y > 0) {
            LR = "r";
        }
        else {
            LR = "l";
        }

        if (dotValue > 0) {
            FB = "f";
        }
        else {
            FB = "b";
        }
        
        if (LR == "r" && FB == "f") {
            //Right front (first quadrant)
            return 1;
        } else if (LR == "l" && FB == "f") {
            //Left Front (Second Quadrant)
            return 2;
        }
        else if (LR == "l" && FB == "b") {
            //Left rear (third quadrant)
            return 3;
        }
        else if (LR == "r" && FB == "b") {
            //Right rear (fourth quadrant)
            return 4;
        }

    }

    /**
     * Used to detect sector collision areas
     * @param hero 
     * @param enemy 
     * @param minDistance 
     * @param minAngle 
     * @returns 
     */
    static SectorCheck(hero: GameObject, enemy: GameObject, minDistance: number, minAngle: number): bool {
        var avatarPos = hero.transform.position;
        // avatarPos.z = avatarPos.z + 1;
        var enemyPos = enemy.transform.position;

        var distance = Vector3.Distance(avatarPos, enemyPos);

        // The vector of the protagonist relative to the target
        var srcLocalVect = enemyPos - avatarPos;
        srcLocalVect.y = 0;

        //Obtain a point directly in front of the protagonist
        var forwardLocalPos = hero.transform.forward * 1 + avatarPos;

        //Obtain positive vector
        var forwardLocalVect = forwardLocalPos - avatarPos;
        forwardLocalVect.y = 0;

        //Calculate angle
        var angle = Vector3.Angle(srcLocalVect, forwardLocalVect);
        // console.log("SectorCheck" + distance + " :: " + minDistance + "  ::" + angle + " ::  " + minAngle);
        if (distance < minDistance && angle < minAngle) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Camera Follow Effect
     * distanceUp  :Vertical height parameter between camera and target
     * distanceAway:Horizontal distance parameter between camera and target
     * smooth:Position Smooth Movement Interpolation Parameter Values
     * camDepthSmooth
     */
    static SetCameraFlower(camera: Transform, target: Transform, distanceUp: number = 3, distanceAway: number = 3, smooth: number = 3) {
        let disPos = target.position + Vector3.up * distanceUp - target.forward * distanceAway;
        camera.position = disPos;// Vector3.Lerp(camera.position, disPos, Time.deltaTime * smooth);
        camera.LookAt(target.position);
    }

    /**
     * Set up a third person camera
     * @param camera 
     * @param playerTrans 
     * @param TarPosV3 
     * @param backOffset 
     * @param rightOffset 
     * @param upOffset 
     */
    static SetCameraTPS(camera: Transform,
        playerTrans: Transform,
        TarPosV3: Vector3,
        backOffset: number = 4,
        rightOffset: number = 2,
        upOffset: number = 2) {
        // 1.Calculate the unit vector towards the back
        var backVec = playerTrans.position - TarPosV3;
        backVec.Normalize();

        // 2.Calculate super right vectors
        var rightVec = Vector3.Cross(backVec, Vector3.up).normalized;

        // 3.Calculate final position
        var endPos = playerTrans.position + backVec * backOffset + rightVec * rightOffset + Vector3.up * upOffset;

        // 4.Trans position
        camera.transform.position = endPos;
        camera.transform.LookAt(TarPosV3);
    }

    static SmoothFlow(target: Transform, camera: Transform) {
        if (!target)
            return;


        var rotationDamping = 10;
        var heightDamping = 3;
        var height = 3;
        var distance = 5;
        // Calculate the current rotation angles
        var wantedRotationAngle = target.eulerAngles.y;
        var wantedHeight = target.position.y + height;

        var currentRotationAngle = camera.transform.eulerAngles.y;
        var currentHeight = camera.transform.position.y;

        // Damp the rotation around the y-axis
        currentRotationAngle = Mathf.LerpAngle(currentRotationAngle,
            wantedRotationAngle, rotationDamping * Time.deltaTime);

        // Damp the height
        currentHeight = Mathf.Lerp(currentHeight, wantedHeight,
            heightDamping * Time.deltaTime);

        // Convert the angle into a rotation
        var currentRotation = Quaternion.Euler(0, currentRotationAngle, 0);

        // Set the position of the camera on the x-z plane to:
        // distance meters behind the target
        camera.transform.position = target.position;
        camera.transform.position -= currentRotation * Vector3.forward * distance;

        // Set the height of the camera
        camera.transform.position = new Vector3(camera.transform.position.x, currentHeight,
            camera.transform.position.z);

        // Always look at the target
        camera.transform.LookAt(target);
    }


    static SetCameraLookAt(camera: Transform, sourTrans: Transform, tarTrans: Transform) {
        camera.position = sourTrans.transform.position;
        camera.LookAt(tarTrans.position);
    }

    static CheckInView(camera: Camera, camTransform: Transform, tarPos: Vector3): bool {
        if (camTransform == undefined || tarPos == undefined) {
            return false;
        }
        let viewPos = camera.WorldToViewportPoint(tarPos);
        let dir = (tarPos - camTransform.position).normalized;
        let dot = Vector3.Dot(camTransform.forward, dir);

        // Scale-out
        var ViewOff = 0.8;
        if (dot > 0
            && viewPos.x >= 0 - ViewOff
            && viewPos.x <= 1 + ViewOff
            && viewPos.y >= 0
            && viewPos.y <= 1) {
            return true;
        }
        else {
            return false;
        }
    }

    static GetTransformInDeep(checkTsfm: Transform, name: string) {
        var trans: Transform[] = checkTsfm.GetComponentsInChildren<Transform>();
        for (let i = 0; i < trans.length; i++) {
            if (trans[i].name == name) {
                return trans[i];
            }
        }
        return null;
    }
}