import { SandboxPlayer } from "ZEPETO.Multiplay";
import { DataStorage } from "ZEPETO.Multiplay.DataStorage";
import { sGameHeart, sPlayer, sPlayerInfo } from "ZEPETO.Multiplay.Schema";
import ServerData, { GameState, PlayerRole, sEventArg } from "../ServerData";
import GameModule from "./GameModule";
import { IModule } from "./IModule";

/**
 * Player related modules
 * 1. Player creation, initialization, and mobile jump synchronization.
 * 2. PlayerInfo data creation and initialization.
 * 3. Player Buff Count.
 * 4. Player Client-Server Connection Detection.
 * 
 */
export default class PlayerModule extends IModule {

    // Used to save data
    public sandboxPlayerMap: Map<string, SandboxPlayer> = new Map<string, SandboxPlayer>();
    // Map to store player information by unique player IDs
    public playerInfoMap: Map<number, sPlayerInfo> = new Map<number, sPlayerInfo>();
    // Map to keep track of player buffs using player IDs
    public buffSeesionMap: Map<number, number> = new Map<number, number>();
    // Pool of available player IDs
    public mCount: boolean[] = new Array(100);

    /* Game heart */
    private mGameHeartTimer: number = 0;
    private GAME_HEART_RATE: number = ServerData.GAME_HEART_RATE;
    private GAME_HEART_MAX_WAIT: number = ServerData.GAME_HEART_MAX_WAIT;

    private _gameModule: GameModule;

    async OnCreate() {
        this._gameModule = this.server.GetModule(GameModule);
        this.RegisterMessageHandlers();
    }

    private RegisterMessageHandlers() {
        // Handles mobile frame synchronization by broadcasting player movement
        this.server.onMessage(sEventArg.PlayerMove, (client: SandboxPlayer, message) => {
            this.server.broadcast(sEventArg.PlayerMove, message);
        });

        // Handles player jump events by broadcasting the jumping player's session ID
        this.server.onMessage(sEventArg.PlayerJump, (client: SandboxPlayer, message) => {
            this.server.broadcast(sEventArg.PlayerJump, message.sessionId);
        });

        // Handles player information synchronization by broadcasting the current player information map
        this.server.onMessage(sEventArg.PlayerInfoSync, (client: SandboxPlayer, message) => {
            this.BroadcastPlayerInfoMap();
        })

        // Handles client-server connection updates by decrementing the heartbeat count for the client
        this.server.onMessage(sEventArg.GameUpdate, (client: SandboxPlayer, message) => {
            const playerHeart = this.server.state.playerHeart.get(client.sessionId);
            playerHeart.heartCount -= 1;
        })

    }

    /**
         * Broadcast player info
         */
    BroadcastPlayerInfoMap() {
        let mapJson = JSON.stringify(this.Map2Obj(this.playerInfoMap));
        this.server.broadcast(sEventArg.PlayerInfoSync, mapJson);
    }

    /**
     * ！！！ Special attention is needed to add an empty object
     * @param strMap 
     * @returns 
     */
    Map2Obj(strMap: Map<number, sPlayerInfo>): Object {
        let temp = new sPlayerInfo();
        const obj = { 0: temp };
        strMap.forEach((item, key, strMap) => {
            obj[key as keyof typeof obj] = item;
        })
        return obj;
    }

    // When a player joins the room
    async OnJoin(client: SandboxPlayer) {
        let player = this.CreatePlayer();
        // Retrieve the player's star count from data storage
        const playerStorage: DataStorage = client.loadDataStorage();
        let playerStar = await playerStorage.get<number>(ServerData.DATA_STORAGE_PLAYER_STAR);
        if (playerStar == null) {
            playerStar = 0;
            await playerStorage.set<number>(ServerData.DATA_STORAGE_PLAYER_STAR, 0);
        }

        if (playerStar < 0) playerStar = 0;
        player.star = playerStar;
        let playerInfo = this.CreatePlayerInfo();
        playerInfo.userId = client.userId;
        playerInfo.sessionId = client.sessionId;
        this.server.state.players.set(client.sessionId, player);
        this.playerInfoMap.set(player.id, playerInfo);
        this.sandboxPlayerMap.set(client.sessionId, client);

        // Create and set up Game Heart information for the new player
        let playerHeart = this.CreatePlayerHeart();
        this.server.state.playerHeart.set(client.sessionId, playerHeart);
        this.BroadcastPlayerInfoMap();
        this.server.state.playerChange.playerNumber++;
        client.send(sEventArg.GameRule, ServerData.GAME_RULE_JSON);
        this.SetPostion(player, PlayerRole.Free, client.sessionId);
    }

    /**
     * Get the index for a newly added player.
     * @returns 
     */
    GetIndex(): number {
        for (var i = 1; i < this.mCount.length; i++) {
            if (this.mCount[i]) {
                this.mCount[i] = false;
                return i;
                break;
            }
        }
    }

    /**
     * Create a new player for the server.
     * @returns 
     */
    CreatePlayer(): sPlayer {
        const player: sPlayer = new sPlayer();
        player.id = this.GetIndex();
        this.InitPlayer(player);
        return player;
    }

    /**
     *  Create player's client-server connection data.
     * @returns 
     */
    CreatePlayerHeart(): sGameHeart {
        const heartInfo: sGameHeart = new sGameHeart();
        heartInfo.heartCount = 0;
        return heartInfo;
    }

    /**
     * Initialize player character.
     * @param player 
     */
    InitPlayer(player: sPlayer) {
        player.targetModel = ServerData.DEF_MODEL;
        player.model = ServerData.DEF_MODEL;
        player.buffNum = 0;
        player.buff = 0;
        player.isHunter = false;
        player.HP = 0;
    }

    /**
     * Create player information.
     * @returns 
     */
    CreatePlayerInfo(): sPlayerInfo {
        const playerInfo = new sPlayerInfo();
        this.InitPlayerInfo(playerInfo);
        return playerInfo;
    }

    /**
     * Initialize player information.
     * @param playerInfo 
     */
    InitPlayerInfo(playerInfo: sPlayerInfo) {
        playerInfo.hunterNum = 0;
        playerInfo.hunterSum = 0;
        playerInfo.liveTime = 0;
        playerInfo.liveSum = 0;
        playerInfo.score = 0;
        playerInfo.playTimeSum = 0;
        playerInfo.hiderWinSum = 0;
        playerInfo.hunterWinSum = 0;
    }

    // Initialize player position.
    SetPostion(player: sPlayer, playerRole: PlayerRole, sessionId: string) {
        let index = (player.id - 1) % this.server.maxClients;
        this.server.broadcast(sEventArg.InitPlayerPos, index + playerRole + "|" + sessionId);
        console.log("onSetPostion", index + playerRole + "|" + sessionId, this.server.maxClients);
    }

    // Handle actions when a player leaves the game.
    async OnLeave(client: SandboxPlayer, consented?: boolean) {
        this.onTimeoutLeave(client.sessionId);
    }

    OnTick(deltaTime: number): void {
        this.onGameHeartUpdate(deltaTime);
    }

    /**
     * Save the star count of a player.
     * @param sessionId 
     */
    async SavePlayerStar(sessionId: string) {
        let player = this.server.state.players.get(sessionId);
        let client = this.sandboxPlayerMap.get(sessionId);

        const playerStorage: DataStorage = client.loadDataStorage();
        await playerStorage.set<number>(ServerData.DATA_STORAGE_PLAYER_STAR, player.star);

        console.log("Successfully saved the star value.", player.star, sessionId);
    }

    onGameHeartUpdate(deltaTime: number) {
        this.mGameHeartTimer += deltaTime * 0.001;
        if (this.mGameHeartTimer > this.GAME_HEART_RATE) {
            this.mGameHeartTimer -= this.GAME_HEART_RATE;
            this.server.state.playerHeart.forEach((player: sGameHeart, k: string) => {
                player.heartCount++;
                if (player.heartCount > this.GAME_HEART_MAX_WAIT) {
                    this.onTimeoutLeave(k);
                    console.log("Heartbeat timeout. Removing the player.", k);
                }
            })
        }
    }

    // Handle the timeout and removal of a player due to connection issues.
    async onTimeoutLeave(sessionId: string) {
        if (this.server.state.players.has(sessionId)) {
            let player = this.server.state.players.get(sessionId);
            this.SavePlayerStar(sessionId);
            console.log("Player leave", player.id);
            if (this._gameModule.mGameInfo.GameState >= GameState.GameStart) {
                // Game player exits
                if (player.isHunter) {
                    this._gameModule.mGameInfo.HunterNum--;
                } else {
                    if (player.HP > 0) {
                        this._gameModule.mGameInfo.HiderNum--;
                    }
                }
            }
            this.server.state.players.delete(sessionId);
            this.playerInfoMap.delete(player.id);
            this.sandboxPlayerMap.delete(sessionId);
            if (this.buffSeesionMap.get(player.id)) this.buffSeesionMap.delete(player.id);
            this.BroadcastPlayerInfoMap();
            this.mCount[player.id] = true;
            this.server.state.playerChange.playerNumber--;
        }
    }

}