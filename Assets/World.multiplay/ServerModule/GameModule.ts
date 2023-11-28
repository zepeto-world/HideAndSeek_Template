import { SandboxPlayer } from "ZEPETO.Multiplay";
import { sPlayer, sPlayerInfo, sGameInfo, sRoundResult } from "ZEPETO.Multiplay.Schema";
import { IModule } from "./IModule";
import { ItemWeightMap, ItemWeight } from "../Data/ItemWeight";
import ServerData, { GameRule, sEventArg, GameState, PlayerRole } from "../ServerData";
import MapModule from "./MapModule";
import PlayerModule from "./PlayerModule";

/**
 * Game Core Logic
 * 1. Game matchmaking.
 * 2. The game switches states at different times.
 * 3. Game Team allocation.
 * 4. Settlement after the game ends.
 * 5. Handling player model, damage calculation, and Buff usage.
 */
export default class GameModule extends IModule {

    public mGameInfo: sGameInfo = null;
    private mGameRule: GameRule;
    private mRoundResult: sRoundResult = new sRoundResult();

    private totalWeight: number = 0;
    private itemWeightMapData: ItemWeightMap;
    private totalWeightStar: number = 0;
    private itemWeightMapDataStar: Map<number, ItemWeight> = new Map<number, ItemWeight>();
    private _playerModule: PlayerModule;

    async OnCreate() {
        this.RegisterMessageHandlers();
        this.onInitGame();
    }

    private RegisterMessageHandlers() {
        // Client Ready
        this.server.onMessage(sEventArg.ClientReady, (client: SandboxPlayer, message) => {
            const player = this.server.state.players.get(client.sessionId);
            const playerInfo = this._playerModule.playerInfoMap.get(player.id);
            playerInfo.isReady = true;
            playerInfo.nickName = message.nickName;
            console.log("ClientReady!!!!", playerInfo.nickName);
            this._playerModule.BroadcastPlayerInfoMap();
            this.onMatch();
        })
        // Model Change
        this.server.onMessage(sEventArg.ChangeModel, (client: SandboxPlayer, message) => {
            const player = this.server.state.players.get(client.sessionId);
            switch (this.mGameInfo.GameState) {
                case GameState.GameWait:
                    player.model = message.model;
                    console.log("ChangeModel " + message.model, " -- GameWait");
                    break;
                case GameState.GameMatch:
                    if (this.mGameInfo.GameMatchTime > 1) {
                        player.model = message.model;
                        console.log("ChangeModel", " -- GameMatch");
                    }
                    break;
                case GameState.GameStart:
                case GameState.ConfirmedModel:
                    if (!player.isHunter) {
                        player.model = player.targetModel;
                        console.log("ChangeModel", " -- ConfirmedModel");
                    }
                    break;
            }
        })
        // Random Model
        this.server.onMessage(sEventArg.RandomModel, (client: SandboxPlayer, message) => {
            const player = this.server.state.players.get(client.sessionId);
            if (player.star > this.mGameRule.randomModelCost) {
                player.star -= this.mGameRule.randomModelCost;
                player.targetModel = this.GetRandomItemIDWithStar();  // call API- renyi

                client.send(sEventArg.RandomModel, player.targetModel) // 200 = success
            }
        })
        // Shooting
        this.server.onMessage(sEventArg.OnShoot, (client: SandboxPlayer, message) => {
            this.server.broadcast(sEventArg.OnShoot, message.shootData);
        })
        // Invisible Buff
        this.server.onMessage(sEventArg.UseBuff, (client: SandboxPlayer, message) => {
            const player = this.server.state.players.get(client.sessionId);
            if (player.buffNum > 0 && player.buff == 0) {
                player.buffNum--;
                player.buff = message.buff;
                this._playerModule.buffSeesionMap.set(player.id, this.mGameRule.buffDuration);
            }
        })
        // Damage
        this.server.onMessage(sEventArg.BeAttacked, (client: SandboxPlayer, message) => {
            this.onBeAttacked(message);
        })
        // Light on-off
        this.server.onMessage(sEventArg.SwitchLight, (client: SandboxPlayer, message) => {
            this.server.broadcast(sEventArg.SwitchLight, message.sid + "|" + message.state);
        })
        this.server.onMessage(sEventArg.SwitchSuperLight, (client: SandboxPlayer, message) => {
            this.server.broadcast(sEventArg.SwitchSuperLight, message.sid + "|" + message.state);
        })
        // Detected by a scan
        this.server.onMessage(sEventArg.BeScan, (client: SandboxPlayer, message) => {
            this.server.broadcast(sEventArg.BeScan, message, { except: client });
        })
    }

    /** 
     * Game initialization operation
     */
    onInitGame() {
        this._playerModule = this.server.GetModule(PlayerModule);
        this.mGameInfo = this.server.state.gameInfo;
        this.mGameInfo.GameState = GameState.GameWait;
        this.mGameInfo.PeekHP = 0;
        this.mGameInfo.Elapsed = 0;
        this.mGameInfo.GameLeftTime = 0;
        this.mGameInfo.HunterNum = 0;
        this.mGameInfo.HiderNum = 0;
        this.mGameInfo.GameRound = 0;
        this.server.state.playerChange.playerNumber = 0;
        for (var i = 0; i < this._playerModule.mCount.length; i++) this._playerModule.mCount[i] = true;
        this.mGameRule = JSON.parse(ServerData.GAME_RULE_JSON);
        console.log("Minimum number of players for the game : ", this.mGameRule.minPlayer);

        // Data Table Loading
        this.totalWeight = 0;
        this.itemWeightMapData = new ItemWeightMap(); // Variable Prop Weight Configuration.
        this.totalWeightStar = 0;
        for (let entry of this.itemWeightMapData.data.entries()) {
            this.totalWeight += entry[1].weight;
            if (entry[1].star > 0) {
                this.totalWeightStar += entry[1].weight;
                this.itemWeightMapDataStar.set(entry[0], entry[1]);
            }
        }
    }

    /**
     * Called when players join the room.
     * @param client 
     */
    async OnJoin(client: SandboxPlayer) {
    }

    /**
     * Called when players leave the room.
     * @param client 
     * @param consented 
     */
    async OnLeave(client: SandboxPlayer, consented?: boolean) {
    }

    /**
     * Frame detection 10 times per second.
     * deltaTime -> 110ms , FPS -> 10
     * @param deltaTime 
     */
    OnTick(deltaTime: number): void {
        this.onUpdateElapsed(deltaTime);
        this.onUpdateGame(deltaTime);
    }

    /**
     * @description: Match condition detection, triggered when the player is ready
     */
    onMatch() {
        // 1.Number of players > minimum number of players start immediately
        if (this.mGameInfo.GameState >= GameState.GameStart) return;
        var readyNumber = 0;
        this._playerModule.playerInfoMap.forEach((v: sPlayerInfo, k: number) => {
            if (v.isReady) {
                readyNumber++;
            }
        });

        if (this.mGameInfo.GameState != GameState.GameMatch) {
            if (readyNumber >= this.mGameRule.minPlayer) {
                this.mTimer = 0;
                this.mGameInfo.GameMatchTime = this.mGameRule.matchDelay;
                this.mGameInfo.GameState = GameState.GameMatch;
                console.log("Enter game matching and wait");
            }
        } else {
            if (readyNumber >= this.mGameRule.maxPlayer) {
                this.onMatchConfirm();
            } else if (readyNumber < this.mGameRule.minPlayer) {
                this.onMatchConfirm();
            }
        }
    }

    /**
     * Number of players meets the starting conditions of the game.
     */
    async onMatchConfirm() {
        var readyNumber = this._playerModule.playerInfoMap.size;
        if (readyNumber >= this.mGameRule.minPlayer) {
            this.onStartGame();
            await this.server.lock();
        } else {
            this.mGameInfo.GameState = GameState.GameWait;
        }
    }

    /**
     *  Initiates the start of the game, resetting round-related information, and configuring game parameters.
     */
    onStartGame() {
        this.mRoundResult.isHunterWin = false;
        this.mRoundResult.hiderId = "";
        this.mRoundResult.hunterId = "";
        this.mRoundResult.liveTime = -1;
        this.mRoundResult.hunterNum = -1;
        this.mRoundResult.bestScore = 0;
        this.mGameInfo.GameRound++;
        this.mGameInfo.GameLeftTime = this.mGameRule.roundLength;
        this.mGameInfo.PeekHP = this.mGameRule.peekHP;
        this.mGameInfo.RoundResult = "";
        this.onMatchTeam();
        this.mGameInfo.GameState = GameState.GameStart;
    }

    /**
     * Initiates the team matching process, assigning roles (hunter/hider) to players.
     */
    onMatchTeam() {
        console.log("Team Matching!!!!");
        let isHiderArray = this.onRandomHiderArray();
        let i = 0;
        this.server.state.players.forEach((player: sPlayer, k: string) => {
            this._playerModule.InitPlayer(player);
            let playerInfo = this._playerModule.playerInfoMap.get(player.id);
            playerInfo.hunterNum = 0;
            playerInfo.liveTime = this.mGameRule.roundLength;
            if (!isHiderArray[i]) {
                player.isHunter = true;
            } else {
                player.HP = this.mGameRule.initHP;
                player.buffNum = this.mGameRule.initBuf;
                player.buff = 0;
            }
            player.targetModel = this.GetRandomItemID();
            this._playerModule.SetPostion(player, player.isHunter ? PlayerRole.Hunter : PlayerRole.Hider, playerInfo.sessionId);
            i++;
        })
    }

    /**
     * Team Matching Algorithm.
     * This algorithm randomly designates one index as a hider, followed by x hunters.
     * @returns 
     */
    onRandomHiderArray(): boolean[] {
        let playerSize: number = this._playerModule.playerInfoMap.size;
        let hiderNumber: number = ServerData.GetHinderNum(playerSize);
        let hunterNumber: number = playerSize - hiderNumber;
        console.log("hiderNumber", hiderNumber, "||hunterNubmer", hunterNumber);
        let value_a = Math.random() * (playerSize) + "";
        let random_index = parseInt(value_a);
        this.mGameInfo.HunterNum = hunterNumber;
        this.mGameInfo.HiderNum = hiderNumber;
        let isHiderArray: boolean[] = new Array(playerSize);
        for (var i = 0; i < playerSize; i++) {
            isHiderArray[i] = true;
        }
        for (var i = 0; i < hunterNumber; i++) {
            let index = (random_index + i) % playerSize;
            isHiderArray[index] = false;
        }
        for (var i = 0; i < playerSize; i++) {
            console.log(isHiderArray[i]);
        }
        return isHiderArray;
    }

    /**
     * Random Algorithm for Transforming Models.
     * Randomly select specific item ids from the ItemWeight.
     * @returns 
     */
    GetRandomItemID(): number {
        let ranVel = Math.round((this.totalWeight - 1) * Math.random());
        for (let entry of this.itemWeightMapData.data.entries()) {
            ranVel -= entry[1].weight;
            if (ranVel <= 0) {
                return entry[0];
            }
        }
        return -1; // Non-existent ID
    }

    /**
     * Spending Stars to Re-Randomize Model.
     * @returns 
     */
    GetRandomItemIDWithStar(): number {
        let ranVel = Math.round((this.totalWeightStar - 1) * Math.random());
        for (let entry of this.itemWeightMapDataStar.entries()) {
            ranVel -= entry[1].weight;
            if (ranVel <= 0) {
                return entry[0];
            }
        }
        return -1; // Non-existent ID
    }

    /**
     * The game refreshes according to different states.
     * @param deltaTime 
     */
    onUpdateGame(deltaTime: number) {
        deltaTime = deltaTime * 0.001; // In seconds
        switch (this.mGameInfo.GameState) {
            case GameState.GameRoundOver:
            case GameState.GameOver:
                this.onCheckGameOver(deltaTime);
                break;
            case GameState.GameMatch:
                this.onUpdateMatch(deltaTime);
                break;
            case GameState.GameStart:
                this.onUpdateTargetModel(deltaTime);
                this.onCheckOpenDoor();
                break;
            case GameState.ConfirmedModel:
                this.onCheckOpenDoor();
                break;
        }

        if (this.mGameInfo.GameState >= GameState.GameStart) {

            this.onUpdateBuf(deltaTime);

            this.onAddStar(deltaTime);

            this.onCheckPeakMoment();

            this.onCheckRoundOver();
        }
    }

    private mTimer: number = 0;
    onUpdateMatch(deltaTime: number) {
        this.mTimer += deltaTime;
        if (this.mTimer > 1) {
            this.mGameInfo.GameMatchTime--;
            this.mTimer--;
            if (this.mGameInfo.GameMatchTime <= 0) {
                this.onMatchConfirm();
            }
        }
    }

    onUpdateTargetModel(deltaTime: number) {
        this.mTimer += deltaTime;
        if (this.mTimer > this.mGameRule.modelDelay) {
            this.mTimer = 0;
            this.mGameInfo.GameState = GameState.ConfirmedModel;
            this.server.state.players.forEach((player: sPlayer, k: string) => {
                if (!player.isHunter) {
                    player.model = player.targetModel;
                }
            })
        }
    }

    private mElapsed: number = 0;
    onUpdateElapsed(deltaTime: number) {
        this.mElapsed += deltaTime * 0.001;
        if (this.mElapsed > 1) {
            this.mGameInfo.Elapsed++;
            this.mElapsed--;
            if (this.mGameInfo.GameState >= GameState.GameStart) {
                this.mGameInfo.GameLeftTime--;
            }
        }
    }

    private mStarTime: number = 0;
    onAddStar(deltaTime: number) {
        this.mStarTime += deltaTime;
        if (this.mStarTime >= this.mGameRule.addStarInerval) {
            console.log("Increasing star value", this.mGameRule.addStarInerval);
            this.mStarTime = 0;
            this.server.state.players.forEach((v: sPlayer, k: string) => {
                if (!v.isHunter && v.HP > 0) {
                    v.star++;
                }
            });
        }
    }

    onUpdateBuf(deltaTime: number) {
        this.server.state.players.forEach((v: sPlayer, k: string) => {
            if (v.buff != 0) {
                let duration = this._playerModule.buffSeesionMap.get(v.id);
                duration -= deltaTime;
                this._playerModule.buffSeesionMap.set(v.id, duration);
                if (duration <= 0) {
                    v.buff = 0;
                    this._playerModule.buffSeesionMap.delete(v.id);
                }
            }
        });
    }

    onCheckPeakMoment() {
        if (this.mGameInfo.GameState != GameState.PeakMoment) {
            if (this.mGameInfo.GameLeftTime <= this.mGameRule.peakMomentLength) {
                console.log("Entering the peak moment", this.mGameRule.peakMomentLength);
                this.server.state.players.forEach((v: sPlayer, k: string) => {
                    if (!v.isHunter && v.HP > 0) {
                        v.HP += this.mGameRule.peekHP;
                    }
                });
                this.mGameInfo.GameState = GameState.PeakMoment;
            }
        }
    }

    onCheckOpenDoor() {
        if (this.mGameRule.roundLength - this.mGameInfo.GameLeftTime > this.mGameRule.opendoorDelay) {
            this.mGameInfo.GameState = GameState.OpenDoor;
        }
    }

    private mGameRoundOverTimer: number = 0;
    private mGameOverTimer: number = 0;

    /**
     Checks for the end of the round.
    */
    onCheckRoundOver() {
        // Conditions:
        // 1. Game time is up
        // 2. All players from team B have been found
        // 3. All players from team A and B have left.
        if (this.mGameInfo.GameState >= GameState.GameStart) {
            let result = false;
            if (this.mGameInfo.GameLeftTime <= 0) {
                result = true;
                // Time's up. Hiders win.
                this.mRoundResult.isHunterWin = false;
            }
            // Test environment not handled
            if (this.mGameRule.isTest == 0) {
                if (this.mGameInfo.HunterNum == 0) {
                    result = true;
                    this.mRoundResult.isHunterWin = false;
                }
                if (this.mGameInfo.HiderNum == 0) {
                    result = true;
                    this.mRoundResult.isHunterWin = true;
                }
            }
            if (result) {
                console.error("Round over!");
                this.onCalRoundResult();
            }
        }
    }

    /**
     * Calculate Round Results.
     */
    onCalRoundResult() {
        this._playerModule.playerInfoMap.forEach((playerInfo: sPlayerInfo, id: number) => {
            let player = this.server.state.players.get(playerInfo.sessionId);
            if (this._playerModule.buffSeesionMap.get(player.id)) {
                this._playerModule.buffSeesionMap.delete(player.id);
                player.buff = 0;
            }
            if (player != null) {
                let _score: number = 0;
                let playerInfo = this._playerModule.playerInfoMap.get(player.id);
                if (this.mGameInfo.GameLeftTime < 0) this.mGameInfo.GameLeftTime = 0;
                playerInfo.playTimeSum += this.mGameRule.roundLength - this.mGameInfo.GameLeftTime;
                if (player.isHunter) {
                    playerInfo.hunterSum += playerInfo.hunterNum;
                    playerInfo.score += playerInfo.hunterNum * this.mGameRule.hunterNumScore;
                    _score += playerInfo.hunterNum * this.mGameRule.hunterNumScore;

                    if (this.mRoundResult.isHunterWin) {
                        playerInfo.score += this.mGameRule.hunterWinScore;
                        playerInfo.hunterWinSum++;
                        _score += this.mGameRule.hunterWinScore;
                        if (playerInfo.hunterNum >= this.mRoundResult.hunterNum) {
                            this.mRoundResult.hunterNum = playerInfo.hunterNum;
                            this.mRoundResult.hunterId = playerInfo.userId;
                            this.mRoundResult.bestScore = _score;
                        }
                    }
                } else {
                    if (playerInfo.liveTime > (this.mGameRule.roundLength - this.mGameInfo.GameLeftTime)) {
                        playerInfo.liveTime = this.mGameRule.roundLength - this.mGameInfo.GameLeftTime;
                    }
                    playerInfo.liveSum += playerInfo.liveTime;
                    playerInfo.score += playerInfo.liveTime * this.mGameRule.hiderLiveScore;
                    _score += playerInfo.liveTime * this.mGameRule.hiderLiveScore;
                    if (!this.mRoundResult.isHunterWin) {
                        playerInfo.score += this.mGameRule.hiderWinScore;
                        playerInfo.hiderWinSum++;
                        _score += this.mGameRule.hiderWinScore;
                        if (playerInfo.liveTime >= this.mRoundResult.liveTime) {
                            this.mRoundResult.liveTime = playerInfo.liveTime;
                            this.mRoundResult.hiderId = playerInfo.userId;
                            this.mRoundResult.bestScore = _score;
                        }
                    }
                }
                playerInfo.roundScore = _score;
            }
            this._playerModule.SavePlayerStar(playerInfo.sessionId);
        });
        this._playerModule.BroadcastPlayerInfoMap();
        this.mGameRoundOverTimer = 0;
        if (this.server.state.players.size < this.mGameRule.minPlayer) {
            this.mGameInfo.GameRound = this.mGameRule.roundNumber;
        }
        this.mGameInfo.GameState = GameState.GameRoundOver;

        let roundResultJson = JSON.stringify(this.mRoundResult);
        this.mGameInfo.RoundResult = roundResultJson;
        console.log("Round result : " + roundResultJson);
    }

    /**
     * Check the end of the game.
     * @param t 
     * @returns 
     */
    onCheckGameOver(t: number) {
        if (this.mGameInfo.GameState == GameState.GameRoundOver) {
            if (this.mGameInfo.GameRound >= this.mGameRule.roundNumber) {
                this.onGameOver();
                return;
            }
            this.mGameRoundOverTimer += t;
            if (this.mGameRoundOverTimer >= this.mGameRule.roundOverDelay) {
                this.mGameRoundOverTimer = 0;
                if (this.server.state.players.size < this.mGameRule.minPlayer) {
                    this.onGameOver();
                    return;
                } else {
                    console.log("New Round");
                    this.onStartGame();
                }
            }
        }
        if (this.mGameInfo.GameState == GameState.GameOver) {
            this.mGameOverTimer += t;
            if (this.mGameOverTimer >= this.mGameRule.gameOverDelay) {
                this.unLockGame();
                this.onResetNewGame();
            }
        }
    }

    onGameOver() {
        console.log("Game Over");
        this.mGameOverTimer = 0;
        this.mGameInfo.GameState = GameState.GameOver;
        let mapModule = this.server.GetModule(MapModule);
        mapModule.onGameOver();
    }

    async unLockGame() {
        await this.server.unlock();
    }

    /**
     * Start a new round of games.
     */
    onResetNewGame() {
        console.log("New game");
        this.mGameInfo.GameState = GameState.GameWait;
        this.mGameInfo.GameRound = 0;
        this._playerModule.playerInfoMap.forEach((playerInfo, id) => {
            this._playerModule.InitPlayerInfo(playerInfo);
        })
        this.onMatch();
    }

    /**
     * Handling server injuries after flashlight scanning a person.
     * @param message 
     */
    onBeAttacked(message: any) {
        let hider = this._playerModule.playerInfoMap.get(message.targetId);
        let player = this.server.state.players.get(hider.sessionId);
        let blood = message.huntblood;
        let killerId = message.killerId;
        if (player.HP > 0 && !player.isHunter) {
            // Reduced HP by 1
            player.HP -= blood;
            console.log(message.targetId, "Player under attack", message.id, player.HP);
            if (player.HP <= 0) {
                let playerInfo = this._playerModule.playerInfoMap.get(player.id);
                let deadId = hider.sessionId;
                let deadData = { deadId, killerId };
                player.model = ServerData.DEF_DIE_MODEL;
                // Survival time
                playerInfo.liveTime -= this.mGameInfo.GameLeftTime;
                // Take integer seconds
                playerInfo.liveTime = Math.round(playerInfo.liveTime);
                this._playerModule.BroadcastPlayerInfoMap();
                this.server.broadcast(sEventArg.PlayerDie, JSON.stringify(deadData));
                let hunterInfo = this._playerModule.playerInfoMap.get(message.id);
                hunterInfo.hunterNum += 1;
                if (this.server.state.players.get(hunterInfo.sessionId)) {
                    this.server.state.players.get(hunterInfo.sessionId).star += this.mGameRule.hunterNumStar;
                }
                this.mGameInfo.HiderNum -= 1;
                this.onCheckRoundOver();
            }
            console.log(player.HP + " -- " + player.isHunter);
        } else {
            console.log("Hider is died!!!");
        }
    }

}