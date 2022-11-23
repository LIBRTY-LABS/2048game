
import React, { useContext, useEffect } from "react";
import Game from '../Game';
import {
  GameContextActionType,
  GameState,
  IGameContext,
  Direction,
  Tile,
  GameStatus
} from "../Interfaces";
import {
  areEqual,
  createRandomTile,
  generateBoard,
  isGameOver,
  isGameWon,
  merge,
  MOVES_MAP,
} from "../../utils/boardUtils";
import useGameLocalStorage from "../../hooks/useLocalStorage";
import { KEYBOARD_ARROW_TO_DIRECTION_MAP } from "../../constants/constants";

const GameContext = React.createContext<IGameContext>(null);

const initState = (tilesCount = 2, accountAddress = "", connector = null, connected = false, chainId = 1): GameState => {
  return {
    tiles: generateBoard(tilesCount),
    lastMove: null,
    status: "IN_PROGRESS",
    tokenPaid: false,
    tokenGranted: true,
    accountAddress: accountAddress,
    connector: connector,
    connected: connected,
    chainId: chainId,
  };
};

const resetConnection = (state: GameState): GameState => {
  return {
    tiles: state.tiles,
    lastMove: state.lastMove,
    status: state.status,
    tokenPaid: false,
    tokenGranted: true,
    accountAddress: "",
    connector: null,
    connected: false,
    chainId: 1,
  }
}

const getGameStatus = (tiles: Tile[]): GameStatus => {
  if (isGameOver(tiles)) {
    return "GAME_OVER";
  }

  if (isGameWon(tiles)) {
    return "WIN";
  }

  return "IN_PROGRESS";
};


function gameReducer(state: GameState, action: GameContextActionType) {
  switch (action.type) {
    case "resetConnection": {
      return resetConnection(state)
    }
    case "setChainId": {
      return {...state, chainId: action.payload}
    }
    case "setConnector": {
      return {...state, connector: action.payload}
    }
    case "setConnected": {
      return {...state, connected: action.payload}
    }
    case "setAccount": {
      return {...state, accountAddress: action.payload}
    }
    case "tokenDeducted": {
      return {...state, tokenPaid: true}
    }
    case "restart": {
      return initState(undefined, state.accountAddress, state.connector, state.connected, state.chainId);
    }
    case "continue": {
      return { ...state, status: "PLAY_AFTER_WIN" };
    }
    case "move": {
      const move = MOVES_MAP[action.payload];
      let tiles: Tile[] = move(state.tiles);
      if (areEqual(state.tiles, tiles)) {
        return state;
      }

      tiles = merge(tiles);
      tiles = [...tiles, createRandomTile(tiles)];
      const status = getGameStatus(tiles);
      const shouldChangeStatus =
        state.status !== "PLAY_AFTER_WIN" || status === "GAME_OVER";

      return {
        ...state,
        tiles: tiles,
        lastMove: action.payload,
        status: shouldChangeStatus ? status : state.status,
      };
    }
    default: {
      throw new Error(`Unhandled action: ${action}`);
    }
  }
}

const GameProvider = (props) => {
  const [state, dispatch] = useGameLocalStorage<GameState>(
    "game",
    initState(),
    gameReducer
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      const direction: Direction | undefined =
        KEYBOARD_ARROW_TO_DIRECTION_MAP[e.key];
      if (direction) {
        dispatch({ type: "move", payload: direction });
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [dispatch]);

  return (
    <GameContext.Provider value={{ gameState: state, dispatch }}>
      {props.children}
    </GameContext.Provider>
  );
};

function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameContextProvider");
  }
  return context;
}

const App = () => {
  return (
    <GameProvider>
      <div>
        <main>
          <Game />
        </main>
      </div>
    </GameProvider>
  );
}

export { App as default, useGameContext };
