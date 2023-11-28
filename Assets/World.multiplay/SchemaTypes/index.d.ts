declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		playerChange: sPlayerChange;
		gameInfo: sGameInfo;
		players: MapSchema<sPlayer>;
		dynamicMaps: sDynamicMap;
		playerHeart: MapSchema<sGameHeart>;
	}
	class sPlayer extends Schema {
		id: number;
		state: number;
		targetModel: number;
		model: number;
		moveState: number;
		position: sVector3;
		angleY: number;
		star: number;
		HP: number;
		isHunter: boolean;
		buff: number;
		buffNum: number;
	}
	class sVector3 extends Schema {
		x: number;
		y: number;
		z: number;
	}
	class sPlayerInfo extends Schema {
		sessionId: string;
		userId: string;
		nickName: string;
		isReady: boolean;
		hunterNum: number;
		liveTime: number;
		hunterSum: number;
		liveSum: number;
		score: number;
		playTimeSum: number;
		hiderWinSum: number;
		hunterWinSum: number;
		roundScore: number;
	}
	class sGameInfo extends Schema {
		Elapsed: number;
		GameState: number;
		GameLeftTime: number;
		GameMatchTime: number;
		GameRound: number;
		HunterNum: number;
		HiderNum: number;
		PeekHP: number;
		RoundResult: string;
	}
	class sRoundResult extends Schema {
		isHunterWin: boolean;
		hunterId: string;
		hiderId: string;
		hunterNum: number;
		liveTime: number;
		bestScore: number;
	}
	class sPlayerChange extends Schema {
		playerNumber: number;
	}
	class sDynamicMap extends Schema {
		models: string;
	}
	class sGameHeart extends Schema {
		heartCount: number;
	}
}