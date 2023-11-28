import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
export default class ActNodeBase extends ZepetoScriptBehaviour {
    Check(): boolean {
        return false;
    }
    *CoRun() {
        console.log("ActnodeBase");
    }

}