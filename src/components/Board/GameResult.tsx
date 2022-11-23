import React from "react";
import { Axios } from "../../utils/api";
import Button from "../Button";
import { useGameContext } from "../App/App";
import { GameStatus, Tile } from "../Interfaces";
import { getAccessToken } from "axios-jwt";


const DATA = {
  WIN: {
    message: "Congratulations! You Win!",
    buttonText: "Play again",
    containerClass: "gameResultWin",
  },
  GAME_OVER: {
    message: "Game Over!",
    buttonText: "Try again",
    containerClass: "gameResultLose",
  },
};

const Result = (props: {
  isWin: boolean;
  onContinue: () => void;
  onRestart: () => void;
  playAfterWin: boolean;
  status: GameStatus;
}) => {
  const { isWin, onContinue, onRestart, playAfterWin } = props;
  const { message, buttonText, containerClass } =
    isWin || playAfterWin ? DATA.WIN : DATA.GAME_OVER;

  return (
    <div className={`gameResult ${containerClass}`}>
      <p>{message}</p>
      <div>
        {isWin && (
          <Button className="continueButton" onClick={() => onContinue()}>
            Continue
          </Button>
        )}
        <Button onClick={() => onRestart()}>{buttonText}</Button>
      </div>
    </div>
  );
};

const GameResultContainer = (props: { tiles: Tile[] }) => {
  const { gameState, dispatch } = useGameContext();

  const { status } = gameState;

  const handleContinue = () => {
    dispatch({ type: "continue" });
  };

  const handleRestart = () => {
    const req = {

      "address" : gameState.accountAddress,
      "amount" : "1000000000000000"
    }
    console.log("access token:", getAccessToken())
    Axios.getInstance().axiosInstance.post('/wallet/tokenDeduct', req, {
      headers: {
        Authorization: 'Bearer ' + getAccessToken()
      }
    }).then((resp) => {
      console.log(resp.data);
      if(gameState.connector && gameState.connected){
        const tx = {
          from: gameState.accountAddress, // Required
          to: resp.data.to, // Required (for non contract deployments)
          data: resp.data.input, // Required
          gasPrice: resp.data.gasPrice, // Optional
          gas: resp.data.gas, // Optional
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

  const playAfterWin = props.tiles.some((x) => x.value === 2048);
  return (
    <>
      {status !== "IN_PROGRESS" && status !== "PLAY_AFTER_WIN" && (
        <Result
          isWin={status === "WIN"}
          playAfterWin={playAfterWin}
          onRestart={handleRestart}
          onContinue={handleContinue}
          status={status}
        />
      )}
    </>
  );
};

export default GameResultContainer;
