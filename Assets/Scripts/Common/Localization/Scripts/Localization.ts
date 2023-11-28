import { Application, Font, GameObject, SystemLanguage, TextAsset } from 'UnityEngine';
import { ConstraintSource } from 'UnityEngine.Animations';
import { UnityEvent } from 'UnityEngine.Events';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export enum LanguageOption {
    "DeviceLanguage",
    "zh-CN-zai",
    "zh-CN-gl",
    "zh-TW",
    "en-US",
    "ko-KR",
    "ja-JP",
    "th-TH",
    "id-ID",
    "ru-RU",
    "it-IT",
    "pt-BR",
    "es-ES",
    "vi-VN",
    "fr-FR",
    "tr-TR"
}

export enum TextFileOption {
    CSV,
    JSON
}

export default class Localization extends ZepetoScriptBehaviour {

    public textFileToRead: TextAsset;
    public textFileOption: TextFileOption;
    public language: LanguageOption;
    public defaultFont: Font;

    private _onLanguageOptionChanged: UnityEvent;

    public get onLanguageOptionChanged() {
        if (!this._onLanguageOptionChanged) {
            this._onLanguageOptionChanged = new UnityEvent();
        }
        return this._onLanguageOptionChanged;
    }

    @HideInInspector()
    private _currentLanguageKey: string;

    private _localizationHash: {
        "key": {
            "language": "localizedString",
        }
    }

    public ChangeLanguageOption(targetLanguage: LanguageOption) {

        this.language = targetLanguage;
        this.SetLanguage();
        this.onLanguageOptionChanged.Invoke();
    }

    /** Returns the localized text value for the given key. */
    public GetLocalizedText(key: string): string {
        // If key is invalid
        if (!(key in this._localizationHash)) {
            console.error("[Localization]: Invalid Key", key);
            return "ERROR";
        }

        // If value is invalid,
        if (!this._localizationHash[key]) {
            console.error("[Localization]: Invalid Value, key is ", key);
            return this._localizationHash[key]["en"].replace('<br>', '\n');
        } else {
            return this._localizationHash[key][this._currentLanguageKey].replace(/<br>/gi, '\n');
        }
        return key;
    }

    public GetLocalizedTextKeyword(key: string, word: string): string {
        return this.GetLocalizedText(key).replace(/{(\d+)}/g, (match, index) => word || '');
    }

    /** Returns localized text value from give key stirng */
    public GetLocalizedTextWithParam(key: string, args: string[]): string {
        return this.GetLocalizedText(key).replace(/{(\d+)}/g, (match, index) => args[index] || '');
    }

    /** Returns true if there's a default font set */
    public HasDefaultFont(): boolean {
        return (this.defaultFont.ToString() != "null") ? true : false;
    }

    /** Returns default font. Check with 'HasCurrentFont()' to see if there's a default font set */
    public GetDefaultFont(): Font {
        return this.defaultFont;
    }


    /** Singleton */
    private static _instance: Localization;

    public static get Instance(): Localization {
        if (!Localization._instance) {
            const targetObj = GameObject.Find("Localization");
            if (targetObj) {
                Localization._instance = targetObj.GetComponent<Localization>();
            }
        }
        return Localization._instance;
    }

    /** Returns a key string that represents currently set language option. */
    public get CurrentLanguageKey(): string {
        return this._currentLanguageKey;
    }

    private Initialize() {
        if (!this.textFileToRead) {
            console.error("[Localization]: There's no text file to read.");
            return;
        }

        if (this.textFileOption == TextFileOption.JSON) {
            this._localizationHash = this.GetObjectFromJSON(this.textFileToRead);
            this.SetLanguage();
            console.log("[Localization]: Initializing localization from JSON file");
        } else if (this.textFileOption == TextFileOption.CSV) {
            this._localizationHash = this.GetObjectFromCSV(this.textFileToRead);
            this.SetLanguage();
            console.log("[Localization]: Initializing localization from CSV file");
        } else {
            console.error("[Localization]: Set text file option first");
            return;
        }
    }

    private SetLanguage() {
        //Set Current Language
        if (this.language == 0) {
            this.SetLanguageFromSystemLanguage();
            console.log(`[Localization] Current Language is set to ${this._currentLanguageKey} by System Language`);
        } else {
            this._currentLanguageKey = LanguageOption[this.language].toString();
            console.log(`[Localization] Current Language is set to ${this._currentLanguageKey}, LanguageOption: ${LanguageOption[this.language].toString()}, this.language: ${this.language}`);
        }
    }

    private SetLanguageFromSystemLanguage() {
        switch (Application.systemLanguage) {
            case SystemLanguage.Korean:
                this._currentLanguageKey = LanguageOption[LanguageOption['ko-KR']].toString();
                break;
            case SystemLanguage.English:
                this._currentLanguageKey = LanguageOption[LanguageOption['en-US']].toString();
                break;
            case SystemLanguage.Japanese:
                this._currentLanguageKey = LanguageOption[LanguageOption['ja-JP']].toString();
                break;
            case SystemLanguage.Chinese:
                this._currentLanguageKey = LanguageOption[LanguageOption['zh-CN-gl']].toString();
                break;
            case SystemLanguage.ChineseSimplified:
                this._currentLanguageKey = LanguageOption[LanguageOption['zh-CN-zai']].toString();
                break;
            case SystemLanguage.Thai:
                this._currentLanguageKey = LanguageOption[LanguageOption['th-TH']].toString();
                break;
            case SystemLanguage.Indonesian:
                this._currentLanguageKey = LanguageOption[LanguageOption['id-ID']].toString();
                break;
            case SystemLanguage.Russian:
                this._currentLanguageKey = LanguageOption[LanguageOption['ru-RU']].toString();
                break;
            case SystemLanguage.Italian:
                this._currentLanguageKey = LanguageOption[LanguageOption['it-IT']].toString();
                break;
            case SystemLanguage.Portuguese:
                this._currentLanguageKey = LanguageOption[LanguageOption['pt-BR']].toString();
                break;
            case SystemLanguage.Spanish:
                this._currentLanguageKey = LanguageOption[LanguageOption['es-ES']].toString();
                break;
            case SystemLanguage.Vietnamese:
                this._currentLanguageKey = LanguageOption[LanguageOption['vi-VN']].toString();
                break;
            case SystemLanguage.ChineseTraditional:
                this._currentLanguageKey = LanguageOption[LanguageOption['zh-TW']].toString();
                break;
            case SystemLanguage.French:
                this._currentLanguageKey = LanguageOption[LanguageOption['fr-FR']].toString();
                break;
            case SystemLanguage.Turkish:
                this._currentLanguageKey = LanguageOption[LanguageOption['tr-TR']].toString();
                break;
            default:
                this._currentLanguageKey = LanguageOption[LanguageOption['en-US']].toString();
                break;
        }
    }


    private GetObjectFromJSON(targetTextAsset: TextAsset) {
        return JSON.parse(targetTextAsset.ToString());
    }

    private GetObjectFromCSV(targetTextAsset: TextAsset) {
        let csv = targetTextAsset.ToString();
        var lines = csv.split("\n");
        var result = {};

        var headers = lines[0].split(",");

        for (let i = 0; i < headers.length; i++) {
            let targetHeader = headers[i];
            if (targetHeader.substring(targetHeader.length - 1, targetHeader.length) == "\r") {
                targetHeader = targetHeader.substring(0, targetHeader.length - 1);
            }
            headers[i] = targetHeader;
        }

        for (let k = 1; k < lines.length; k++) {
            var obj = {}
            var currentline = this.lineSplitter(lines[k]);

            for (var j = 1; j < headers.length; j++) {
                let targetLine = currentline[j];
                if (targetLine != undefined) {
                    if (targetLine.substring(targetLine.length - 1, targetLine.length) == "\r") {
                        targetLine = targetLine.substring(0, targetLine.length - 1);
                    }
                }
                obj[headers[j]] = targetLine;
            }
            result[currentline[0]] = obj;
        }

        let resultString = JSON.stringify(result);

        // JSON
        return JSON.parse(resultString); 
    }


    Awake() {
        Localization._instance = this;

        this.Initialize();
    }

    private lineSplitter(targetString: string) {
        let _result: string[] = [];
        let _characters = Array.from(targetString);

        let _isInDoubleQuote = false;
        for (let i = 0; i < _characters.length; i++) {
            if (_characters[i] == '"') {
                _characters[i] = "";
                _isInDoubleQuote = !_isInDoubleQuote;
            }

            if ((_characters[i] == ',') && !_isInDoubleQuote) {
                _characters[i] = "%%,%%";

            }
        }
        let _changedText = _characters.join("");
        _result = _changedText.split("%%,%%");

        return _result;
    }

}