import React from "react";
import Board from "../Board";
import { Axios } from "../../utils/api";
import { convertUtf8ToHex } from "@walletconnect/utils";
import { isLoggedIn, setAuthTokens, clearAuthTokens, getAccessToken, getRefreshToken } from 'axios-jwt'
import { useGameContext } from "../App/App";
import "./Game.scss";

import GameHeader from "../GameHeader";
import GameFooter from "../GameFooter";

import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";


const VERIFICATION_MESSAGE = "This message is for account verification purposes";


const Game = () => {
  const { gameState, dispatch } = useGameContext();

  const connectWallet = async() => {
    if(gameState.connector == null || gameState.connector == undefined) {
      console.log("connector is null", gameState)
      window.localStorage.removeItem('walletconnect')
      const conn = new WalletConnect({
        bridge: "https://bridge.walletconnect.org", // Required
        qrcodeModal: QRCodeModal,
      });
      if(conn.peerId) {
        await conn.killSession()
      }
      dispatch({type: "setConnector", payload: conn});
      return
    }
    console.log("connector is not null", gameState);
    if(!gameState.connector.connected) {
      await gameState.connector.createSession();
      dispatch({type: "setConnected", payload: true});
    }
    console.log("connected");

    gameState.connector.on("connect", (error, payload) => {
      console.log(`connector.on("connect")`);
      if (error) {
        throw error;
      }
      const { chnId, accounts } = payload.params[0];
      dispatch({type: "setAccount", payload: accounts[0]});
      dispatch({type: "setChainId", payload: chnId});

      gameState.connector.signPersonalMessage([convertUtf8ToHex(VERIFICATION_MESSAGE), accounts[0]])
      .then((result) => {
        console.log("signature: ", result);
        const req = {
          "signer" : accounts[0],
          "message" : VERIFICATION_MESSAGE,
          "signature" : result
        }
        Axios.getInstance().axiosInstance.post('/wallet/getAccessToken', req).then((resp) => {
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

    gameState.connector.on("session_update", (error, payload) => {
      console.log(`connector.on("session_update")`);
      if (error) {
        throw error;
      }

      const { chnId, accounts } = payload.params[0];
      dispatch({type: "setAccount", payload: accounts[0]});
      dispatch({type: "setChainId", payload: chnId});
    });

    gameState.connector.on("disconnect", (error, payload) => {
      if(error) {
        throw error;
      }
      dispatch({type: "resetConnection"})
    });
  }

  const disconnectWallet = async() => {
    if(gameState.connector?.peerId){
      await gameState.connector.killSession()
    }
    dispatch({type: "resetConnection"})
  }
  return (
      <div className="container">
        <div className="gameContainer">
          <GameHeader onClickDisconnect={disconnectWallet} address={gameState.accountAddress} onClickConnect={connectWallet} isConnected={(gameState.accountAddress?.length > 0)}/>
          {(gameState.accountAddress?.length > 0 && gameState.tokenPaid) ? <Board/> : <></>}
        </div>
        <GameFooter />
      </div>
  );
};

export { Game };
