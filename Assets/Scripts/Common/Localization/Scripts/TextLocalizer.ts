import { Font } from 'UnityEngine';
import { Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization, { LanguageOption } from './Localization';

export enum LocalizationTextFontMode {
    "UseSystemFont",
    "UseDefaultFont",
    "UseFontForThaiOnly",
}

export default class TextLocalizer extends ZepetoScriptBehaviour {


    public localizationKey: string;
    public defaultFontMode: LocalizationTextFontMode;

    @Tooltip("Disable Rich Text Option")
    public isUsingDefaultSettings: boolean;

    private _isInitialized: boolean = false;
    private _localization: Localization;
    private _fontOnStart: Font;
    private _uiText: Text;

    private _localizedText: string;
    public get localizedText() {
        if (!this._localizedText) {
            this._localizedText = "Not localized yet";
        }
        return this._localizedText;
    }

    private UpdateTextContent() {
        //Set Default Settings when in use
        if (this.defaultFontMode == LocalizationTextFontMode.UseSystemFont) {

        } else if (this.defaultFontMode == LocalizationTextFontMode.UseDefaultFont) {
            if (this._localization.HasDefaultFont()) {
                this._uiText.font = this._localization.GetDefaultFont();
            }
        } else if (this.defaultFontMode == LocalizationTextFontMode.UseFontForThaiOnly) {
            if (this._localization.CurrentLanguageKey == LanguageOption[LanguageOption['th-TH']].toString()) {
                if (this._localization.HasDefaultFont()) {
                    this._uiText.font = this._localization.GetDefaultFont();
                }
            }
        }

        if (this.isUsingDefaultSettings) {
            this._uiText.supportRichText = false;
        }

        //Set Localized Text
        let _targetText = this._localization.GetLocalizedText(this.localizationKey);
        this._uiText.text = _targetText;
        this._localizedText = _targetText;
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

        this._uiText = this.gameObject.GetComponent<Text>();

        this.UpdateTextContent();

        this._localization.onLanguageOptionChanged.AddListener(() => {
            this.UpdateTextContent();
        })
    }

}