import { InputField } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization from './Localization';

export default class InputFieldLocalizer extends ZepetoScriptBehaviour {

    public localizationKey: string;

    private _isInitialized: boolean = false;
    private _localization: Localization;
    private _uiInputField: InputField;

    private UpdateTextContent() {

        //Set Localized Text
        this._uiInputField.text = this._localization.GetLocalizedText(this.localizationKey);
    }

    Start() {
        this._localization = Localization.Instance;

        if (!this.localizationKey || this.localizationKey == "") {
            this._isInitialized = false;
            console.error(`[TextLocalizer] Text Localizer is not initialized. Enter localization key first.(${this.gameObject.name})`);
            return;
        } else {
            this._isInitialized = true;
        }

        //When UI text doesn't exist
        if (!this.gameObject.GetComponent<Text>()) {
            console.error(`[TextLocalizer] Text Localizer is not initialized. There's no UI Text. (${this.gameObject.name})`);
            return;
        }

        this._uiInputField = this.gameObject.GetComponent<InputField>();

        this.UpdateTextContent();

        this._localization.onLanguageOptionChanged.AddListener(() => {
            this.UpdateTextContent();
        })
    }

}