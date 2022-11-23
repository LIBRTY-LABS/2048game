import React from "react";
import { Axios } from "../../utils/api";
import Button from "../Button";
import { useGameContext } from "../App/App";
import ScoresContainer from "../ScoresContainer";

import "./GameHeader.scss";
import { getAccessToken } from "axios-jwt";

const GameTitle = () => <span className="gameTitle">2048</span>;

const GameDescription = () => {
  return (
    <div>
      <span>Join the numbers to get <b>2048</b>!</span>
      <br />
      <a href="#howToPlaySection">How to play →</a>
    </div>
  );
};

interface GameHeaderProps {
  isConnected: boolean;
  onClickConnect: ()=>void;
  onClickDisconnect: ()=>void;
  address: string;
}
export const GameHeader = (props: GameHeaderProps) => {
  const { gameState, dispatch } = useGameContext();
  const handleRestart = () => {
    const req = {
      "address" : gameState.accountAddress,
      "amount" : "1000000000000000"
    }
    console.log("accessToken 1", getAccessToken())
    Axios.getInstance().axiosInstance.post('/wallet/tokenDeduct', req, 
    {
      headers: {
        Authorization: 'Bearer ' + getAccessToken()
      }}).then((resp) => {
      console.log(resp.data);
      if(gameState.connector?.peerId && gameState.connected){
        const tx = {
          from: gameState.accountAddress, // Required
          to: resp.data.to, // Required (for non contract deployments)
          data: resp.data.input, // Required
          gasPrice: resp.data.gasPrice, // Optional
          //gas: resp.data.gas, // Optional
          value: resp.data.value, // Optional
          nonce: resp.data.nonce, // Optional
        };
        gameState.connector.sendTransaction(tx)
        .then((result) => {
          dispatch({type: "tokenDeducted"});
          console.log(result);
        })
        .catch((error) => {
          console.log(error);
        });
      }
    })
    dispatch({ type: "restart" });
  };
  console.log("game Header ", props.isConnected)
  return (
    <div className="header">
      <div className="gameIntro">
        <GameTitle />
        <GameDescription />
      </div>
      <div className="actions">
        <ScoresContainer onDisconnect={props.onClickDisconnect} address={props.address}/>
        <Button
          id="restartGameBtn"
          onClick={props.isConnected ? (_) => handleRestart() : props.onClickConnect}
        >
          {props.isConnected ? "New Game" : "Connect Wallet"}
        </Button>
      </div>
    </div>
  );
};
