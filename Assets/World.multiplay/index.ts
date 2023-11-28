import { Sandbox, SandboxOptions, SandboxPlayer } from "ZEPETO.Multiplay";
import { IModule } from "./ServerModule/IModule";
import { DataStorage } from "ZEPETO.Multiplay.DataStorage";
import ServerData from "./ServerData";
import GameModule from "./ServerModule/GameModule";
import MapModule from "./ServerModule/MapModule";
import PlayerModule from "./ServerModule/PlayerModule";
/**
 * Server program entry
 */
export default class Server extends Sandbox {
    private readonly _modules: IModule[] = [];
    private _isCreated: boolean = false;
    public serverData: ServerData;
    public storageMap: Map<string, DataStorage> = new Map<string, DataStorage>();
    public sandboxPlayerMap: Map<string, SandboxPlayer> = new Map<string, SandboxPlayer>();
    async onCreate(options: SandboxOptions) {
        this.serverData = new ServerData(this);
        this._modules.push(new PlayerModule(this));
        this._modules.push(new GameModule(this));
        this._modules.push(new MapModule(this));
        for (const module of this._modules) {
            await module.OnCreate();
        }
        this._isCreated = true;
    }

    async onJoin(client: SandboxPlayer) {
        const storage = client.loadDataStorage();
        this.storageMap.set(client.userId, storage);
        this.sandboxPlayerMap.set(client.userId, client);
        for (const module of this._modules) {
            await module.OnJoin(client);
        }
        console.log("onJoin:", client.userId);
    }

    async onLeave(client: SandboxPlayer, consented?: boolean) {
        // Before removing the Player, call the OnLeave() function of each module to handle necessary cleanup or actions.
        try {
            for (const module of this._modules) {
                await module.OnLeave(client);
            }
        }
        catch (e) {
            console.error(e);
            this.state.players.delete(client.userId);
        }
        this.state.players.delete(client.userId);
        this.storageMap.delete(client.userId);
        this.sandboxPlayerMap.delete(client.userId);
    }

    onTick(deltaTime: number) {
        // Temporary solution to address the issue where OnTick may be called before OnCreate.
        if (!this._isCreated) {
            return;
        }
        for (const module of this._modules) {
            module.OnTick(deltaTime);
        }
    }

    public GetModule<T extends IModule>(type: new (server: Server) => T): T {
        switch (type.name) {
            case PlayerModule.name: return this._modules[0] as T;
            case GameModule.name: return this._modules[1] as T;
            case MapModule.name: return this._modules[2] as T;
        }
        return undefined;
    }

    public GetClient(userId: string): SandboxPlayer {
        if (this.sandboxPlayerMap.has(userId)) {
            return this.sandboxPlayerMap.get(userId);
        } else {
            console.error(`Client with userId ${userId} not found`);
        }
    }
}
