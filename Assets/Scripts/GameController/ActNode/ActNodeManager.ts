import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GameState } from '../../GameManager/NetManager';
import ActNodeBase from './ActNodeBase';
import ActNodeConfirmedModel from './ActNodeConfirmedModel';
import ActNodeGameMatch from './ActNodeGameMatch';
import ActNodeGameOver from './ActNodeGameOver';
import ActNodeGameRoundOver from './ActNodeGameRoundOver';
import ActNodeGameStart from './ActNodeGameStart';
import ActNodeGameWait from './ActNodeGameWait';
import ActNodePeakMoment from './ActNodePeakMoment';
export default class ActNodeManager extends ZepetoScriptBehaviour {
    public ActiveNode_GameStateMap = new Map<Number, ActNodeBase>();
    InitActNodeMap() {
        this.ActiveNode_GameStateMap.set(GameState.GameWait, new ActNodeGameWait());
        this.ActiveNode_GameStateMap.set(GameState.GameMatch, new ActNodeGameMatch());
        this.ActiveNode_GameStateMap.set(GameState.GameStart, new ActNodeGameStart());
        this.ActiveNode_GameStateMap.set(GameState.ConfirmedModel, new ActNodeConfirmedModel());
        this.ActiveNode_GameStateMap.set(GameState.GameOver, new ActNodeGameOver());
        this.ActiveNode_GameStateMap.set(GameState.GameRoundOver, new ActNodeGameRoundOver());
        this.ActiveNode_GameStateMap.set(GameState.PeakMoment, new ActNodePeakMoment());
    }
}