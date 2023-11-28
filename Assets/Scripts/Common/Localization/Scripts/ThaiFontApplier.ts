import { Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization, { LanguageOption } from './Localization'

export default class ThaiFontApplier extends ZepetoScriptBehaviour {

    Start() {
        let _localization = Localization.Instance;
        let _uiText = this.gameObject.GetComponent<Text>();
        if (_localization.CurrentLanguageKey == LanguageOption[LanguageOption['th-TH']].toString()) {
            if (_localization.HasDefaultFont()) {
                _uiText.font = _localization.GetDefaultFont();
            }
        }

    }

}