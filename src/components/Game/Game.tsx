import React, { useContext, useEffect } from "react";
import Board from "../Board";
import { axiosInstance } from "../../utils/api";
import { convertUtf8ToHex } from "@walletconnect/utils";
import { isLoggedIn, setAuthTokens, clearAuthTokens, getAccessToken, getRefreshToken } from 'axios-jwt'

import "./Game.scss";
import {
  areEqual,
  createRandomTile,
  generateBoard,
  isGameOver,
  isGameWon,
  merge,
  MOVES_MAP,
} from "../../utils/boardUtils";
import GameHeader from "../GameHeader";
import {
  GameContextActionType,
  GameState,
  IGameContext,
  Direction,
  Tile,
  GameStatus,
  IAppState
} from "../Interfaces";
import GameFooter from "../GameFooter";
import useGameLocalStorage from "../../hooks/useLocalStorage";
import { KEYBOARD_ARROW_TO_DIRECTION_MAP } from "../../constants/constants";

import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { useState } from "react";

const INITIAL_STATE: IAppState = {
  connector: null,
  connected: false,
  chainId: 1,
  accounts: [],
  address: ""
};

const VERIFICATION_MESSAGE = "This message is for account verification purposes";
const GameContext = React.createContext<IGameContext>(null);

const getGameStatus = (tiles: Tile[]): GameStatus => {
  if (isGameOver(tiles)) {
    return "GAME_OVER";
  }

  if (isGameWon(tiles)) {
    return "WIN";
  }

  return "IN_PROGRESS";
};

const initState = (tilesCount = 2): GameState => {
  return {
    tiles: generateBoard(tilesCount),
    lastMove: null,
    status: "IN_PROGRESS",
  };
};

function gameReducer(state: GameState, action: GameContextActionType) {
  switch (action.type) {
    case "restart": {
      return initState();
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
        tiles,
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

const Game = () => {
  const [appState, setAppState] = useState(INITIAL_STATE);

  const connectWallet = async() => {
    if(appState.connector == null || appState.connector == undefined) {
      console.log("connector is null", appState)
      window.localStorage.removeItem('walletconnect')
      const conn = new WalletConnect({
        bridge: "https://bridge.walletconnect.org", // Required
        qrcodeModal: QRCodeModal,
      });
      if(conn.peerId) {
        await conn.killSession()
      }
      await setAppState({...appState, connector :conn});
      return
    }
    console.log("connector is not null", appState);
    if(!appState.connector.connected) {
      await appState.connector.createSession();
      setAppState({...appState, connected: true});
    }
    console.log("connected");

    appState.connector.on("connect", (error, payload) => {
      console.log(`connector.on("connect")`);
      if (error) {
        throw error;
      }
      const { chnId, accounts } = payload.params[0];
      setAppState({...appState, chainId: chnId, address: accounts[0]});

      appState.connector.signPersonalMessage([convertUtf8ToHex(VERIFICATION_MESSAGE), accounts[0]])
      .then((result) => {
        console.log("signature: ", result);
        const req = {
          "signer" : accounts[0],
          "message" : VERIFICATION_MESSAGE,
          "signature" : result
        }

        axiosInstance.post('/wallet/getAccessToken', req).then((resp) => {
          console.log("accessTokenResponse: ", resp.data)
          setAuthTokens({
            accessToken: resp.data.accessToken,
            refreshToken: resp.data.refreshToken
          })
        })
      })
      .catch((error) => {
        console.log("signature error: ", error);
      })
    });

    appState.connector.on("session_update", (error, payload) => {
      console.log(`connector.on("session_update")`);
      if (error) {
        throw error;
      }

      const { chnId, accounts } = payload.params[0];
      setAppState({...appState, chainId: chnId, address: accounts[0]});
    });

    appState.connector.on("disconnect", (error, payload) => {
      if(error) {
        throw error;
      }
      setAppState(INITIAL_STATE)
    });
  }

  const disconnectWallet = async() => {
    if(appState.connector == null){
      return
    }

    await appState.connector.killSession()
    setAppState(INITIAL_STATE)
  }
  return (
    <GameProvider>
      <div className="container">
        <div className="gameContainer">
          <GameHeader onClickDisconnect={disconnectWallet} address={appState.address} onClickConnect={connectWallet} isConnected={(appState.address && appState.address.length > 0)}/>
          {appState.address && appState.address.length > 0 ? <Board/> : <></>}
        </div>
        <GameFooter />
      </div>
    </GameProvider>
  );
};

function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameContextProvider");
  }
  return context;
}

export { Game, useGameContext };
