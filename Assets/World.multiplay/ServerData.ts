import Server from ".";

export const enum sEventArg {
    GameRule = "GameRule",
    PlayerMove = "PlayerMove",
    PlayerJump = "PlayerJump",
    PlayerChange = "PlayerChange",
    PlayerInfoSync = "PlayerInfoSync",
    ClientReady = "ClientReady",
    GameUpdate = "GameUpdate",
    ChangeModel = "ChangeModel",
    BeAttacked = "BeAttacked",
    OnShoot = "OnShoot",
    UseBuff = "UseBuff",
    PlayerDie = "PlayerDie",
    RandomModel = "RandomModel",
    SwitchLight = "SwitchLight",
    SwitchSuperLight = "SwitchSuperLight",
    RoomStateDelayTest = "RoomStateDelayTest",
    MessageDelayTest = "MessageDelayTest",
    BeScan = "BeScan",
    QuickMessage = "QuickMessage",
    InitPlayerPos = "InitPlayerPos",
    GetChestSta = "GetChestSta",
    SetOnlineMinuteTime = "SetOnlineMinuteTime",
    GetOnlineMinuteTime = "GetOnlineMinuteTime",
    GetChestGiftSta = "GetChestGiftSta",
    SetChestGiftSta = "SetChestGiftSta",
    GotoSquare = "GotoSquare",
    ClearChestData = "ClearChestData",
}

export class GameRule {
    roundNumber: number;           // Game round number (- indicates addition)
    roundLength: number;           // Game duration in seconds
    roundOverDelay: number;        // Round end waiting delay
    gameOverDelay: number;         // Game end waiting delay
    peakMomentLength: number;      // Peak time length in seconds
    minPlayer: number;             // Minimum matching player count
    maxPlayer: number;             // Maximum matching player count
    matchDelay: number;            // Match countdown delay
    modelDelay: number;            // Item delay
    opendoorDelay: number;         // Door open delay
    isTest: number;                // Test game process alone, when 1, skip gameover judgment
    initHP: number;                // Initial health points
    initBuf: number;               // Initial buff quantity
    buffDuration: number;          // Buff duration time
    peekHP: number;                // Increased health points at peak moment
    randomModelCost: number;       // Star point cost for random item
    addStarInerval: number;        // Hider increase star interval
    hunterNumStar: number;         // Star point increase when hunter finds a player
    hunterWinScore: number;        // Seeker victory score
    hunterNumScore: number;        // Score when seeker finds 1 player
    hiderWinScore: number;         // Hider victory score
    hiderLiveScore: number;        // Hider survival seconds score
}

export const enum GameState {
    GameWait = 0,                   // Just entered the game waiting state
    GameOver = 1,                   // End state of this game
    GameRoundOver = 2,              // End of small round state
    GameMatch = 3,                  // Game matching state
    GameStart = 4,                  // Game start state
    ConfirmedModel = 5,             // Confirm the model
    OpenDoor = 6,                   // Game open state
    PeakMoment = 7,                 // Peak state
}

export const enum PlayerRole {
    Free = 100,
    Hunter = 200,
    Hider = 300
}

/**
 * Server Data Configuration
 */
export default class ServerData {

    static DATA_STORAGE_PLAYER_STAR = "STAR";
    static DEF_MODEL = 99;              // Default model ID
    static DEF_DIE_MODEL = 100;         // Default model ID for death
    static SUCCESS_CODE = 200;

    static GAME_HEART_RATE = 5;         // Heartbeat interval
    static GAME_HEART_MAX_WAIT = 10;    // Heartbeat timeout of 10 seconds

    private readonly _server: Server;
    protected get server(): Server { return this._server; }
    constructor(server: Server) {
        this._server = server;
    }

    /**
     * Team player count configuration
     * @param playerNum 
     * @returns 
     */
    static GetHinderNum(playerNum: number): number {
        let hiderNum: number = 3;
        switch (playerNum) {
            case 2:
                hiderNum = 1;
                break;
            case 3:
                hiderNum = 2;
                break;
            case 6:
                hiderNum = 4;
                break;
            case 7:
            case 8:
                hiderNum = 5;
                break;
            case 9:
                hiderNum = 6;
                break;
            case 10:
            case 11:
                hiderNum = 7;
                break;
            case 12:
                hiderNum = 8;
                break;
            case 13:
            case 14:
                hiderNum = 9
                break;
            case 15:
            case 16:
                hiderNum = 10;
                break;
        }
        return hiderNum;
    }

    /**
     * Game rule configuration
     */
    static GAME_RULE_JSON = "{\n" +
        "    \"roundNumber\":3,\n" + // Number of game rounds.(- Add Indicate)
        "    \"roundLength\":300,\n" + // Game duration in seconds GameRoundLength-second
        "    \"roundOverDelay\":8,\n" + // Round ending wait delay 
        "    \"gameOverDelay\":10,\n" + // Game ending wait delay 
        "    \"peakMomentLength\":60,\n" + // Peak moment duration in seconds Peak time Length-second
        "    \"minPlayer\":4,\n" + // Minimum number of players
        "    \"maxPlayer\":12,\n" + // Maximum number of players
        "    \"isTest\":0,\n" + // Test the game process alone
        "    \"matchDelay\":30,\n" + // Match Delay
        "    \"modelDelay\":30,\n" + // Model Delay
        "    \"opendoorDelay\":30,\n" + // Door Open Delay
        "    \"initHP\":150,\n" + // Initial HP
        "    \"initBuf\":2,\n" + // Initial Buff 
        "    \"buffCD\":20,\n" + // Buff Duration time
        "    \"peekHP\":100,\n" + // Buff Duration time
        "    \"randomModelCost\":30,\n" + // Star point cost for random item
        "    \"buffDuration\":5,\n" + // Buff Duration time 
        "    \"hunterWinScore\":200,\n" + // Seeker Victory Point
        "    \"hunterNumScore\":300,\n" + // Point when Seeker find 1 hider
        "    \"hiderLiveScore\":2,\n" + // Hider survival seconds point 
        "    \"hiderWinScore\":100,\n" + //  Hider Victory point
        "    \"hunterNumStar\":1,\n" + //  Seeker finds hider to increase Star point 
        "    \"addStarInerval\":120\n" + //  Hider increase Star Interval
        "}";

    //for test
    // static GAME_RULE_JSON = "{\n" +
    //     "    \"roundNumber\":1,\n" +
    //     "    \"roundLength\":60,\n" +
    //     "    \"roundOverDelay\":8,\n" +
    //     "    \"gameOverDelay\":10,\n" +
    //     "    \"peakMomentLength\":30,\n" +
    //     "    \"minPlayer\":2,\n" +
    //     "    \"maxPlayer\":12,\n" +
    //     "    \"isTest\":0,\n" +
    //     "    \"matchDelay\":10,\n" +
    //     "    \"modelDelay\":10,\n" +
    //     "    \"opendoorDelay\":10,\n" +
    //     "    \"initHP\":150,\n" +
    //     "    \"initBuf\":2,\n" +
    //     "    \"buffCD\":20,\n" +
    //     "    \"peekHP\":100,\n" +
    //     "    \"randomModelCost\":30,\n" +
    //     "    \"buffDuration\":5,\n" +
    //     "    \"hunterWinScore\":200,\n" +
    //     "    \"hunterNumScore\":300,\n" +
    //     "    \"hiderLiveScore\":2,\n" +
    //     "    \"hiderWinScore\":100,\n" +
    //     "    \"hunterNumStar\":0.5,\n" +
    //     "    \"addStarInerval\":120\n" +
    //     "}";

}
