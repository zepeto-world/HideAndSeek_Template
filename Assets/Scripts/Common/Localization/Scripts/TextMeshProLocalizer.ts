import { TextMeshPro } from 'TMPro';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from './Localization';

export default class TextMeshProLocalizer extends ZepetoScriptBehaviour {

    public localizationKey: string;

    private _isInitialized: boolean = false;
    private _localization: Localization;

    Start() {
        this._localization = Localization.Instance;

        if (!this.localizationKey || this.localizationKey == "") {
            this._isInitialized = false;
            console.error("Text Localizer is not initialized. Enter localization key first.");
            return;
        } else {
            this._isInitialized = true;
        }

        // When UI text doesn't exist
        if (!this.gameObject.GetComponent<Text>()) {
            console.error("Text Localizer is not initialized. There's no UI Text.");
            return;
        }

        let _uiText = this.gameObject.GetComponent<TextMeshPro>();

        // Set Localized Text
        _uiText.text = this._localization.GetLocalizedText(this.localizationKey);
    }

}