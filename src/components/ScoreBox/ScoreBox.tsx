import  React from "react";

import "./ScoreBox.scss";
import Button from "../Button";
import { type } from "os";
interface ScoreBoxProps {
  title: string;
  score?: number|string;
  onClick?: ()=>void;
}

export const ScoreBox = (props: ScoreBoxProps) => {
  return <div>
    {typeof props.onClick === "function" ?
    <Button className="scoreBox" onClick={props.onClick}>
      <span className="title">{props.title}</span>
      <span className="score">{props.score}</span>
    </Button>:
    <div className="scoreBox">
      <span className="title">{props.title}</span>
      <span className="score">{props.score}</span>
      </div>}
  </div>
}

