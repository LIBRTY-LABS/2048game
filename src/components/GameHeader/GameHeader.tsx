import React from "react";
import Button from "../Button";
import { useGameContext } from "../Game";
import ScoresContainer from "../ScoresContainer";

import "./GameHeader.scss";

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
  const { dispatch } = useGameContext();
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
          onClick={props.isConnected ? (_) => dispatch({ type: "restart" }) : props.onClickConnect}
        >
          {props.isConnected ? "New Game" : "Connect Wallet"}
        </Button>
      </div>
    </div>
  );
};
