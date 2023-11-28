import { Button, Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import Localization, { LanguageOption } from './Localization'

// TODO: Change the options below
const _numberOfLanguage = 17;

export default class LanguageChanger extends ZepetoScriptBehaviour {

    public nextButton: Button;
    public prevButton: Button;
    public currentLangKeyText: Text;

    private _localization: Localization;
    private _isInitialized: boolean = false;

    private _currentLanguageKeyIndex = 0;

    public Next() {
        this._currentLanguageKeyIndex++;
        if (this._currentLanguageKeyIndex >= _numberOfLanguage) {
            this._currentLanguageKeyIndex = 0;
        }
        if (!this._localization) {
            this._localization = Localization.Instance;
        }
        this._localization.ChangeLanguageOption(this._currentLanguageKeyIndex);
    }

    public Prev() {
        this._currentLanguageKeyIndex--;
        if (this._currentLanguageKeyIndex < 0) {
            this._currentLanguageKeyIndex = 15;
        }
        if (!this._localization) {
            this._localization = Localization.Instance;
        }
        this._localization.ChangeLanguageOption(this._currentLanguageKeyIndex);
    }

    private GetCurrentLanguageKeyIndex() {
        let _key = this._localization.CurrentLanguageKey;

        let _targetIndex = 0;
        for (let i = 0; i < _numberOfLanguage; i++) {
            if (LanguageOption[i].toString() == _key) {
                _targetIndex = i;
            }
        }
        this._currentLanguageKeyIndex = _targetIndex;
    }

    private UpdateCurrnetLangKeyText() {
        this.currentLangKeyText.text = this._localization.CurrentLanguageKey;
    }

    Start() {
        this._localization = Localization.Instance;
        this._isInitialized = true;
        this.UpdateCurrnetLangKeyText();
        this.GetCurrentLanguageKeyIndex();

        this._localization.onLanguageOptionChanged.AddListener(() => {
            this.UpdateCurrnetLangKeyText();
            this.GetCurrentLanguageKeyIndex();
        })

        this.nextButton.onClick.AddListener(this.Next);
        this.nextButton.onClick.AddListener(this.Prev);
    }

}