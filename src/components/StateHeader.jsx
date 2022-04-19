import React from "react";
import "./StateHeader.css";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { Badge, Modal } from "antd";
import { EasyLevelManual } from "./text";
const StateHeader = (props, ref) => {
  let { state, setState } = props;
  let { ThreeHandShakeState, FourHandShakeState, FlowControlState, Finished } =
    props;

  React.useImperativeHandle(
    ref,
    () => {
      const handleRefs = {
        changeState(newState) {
          setState(newState);
        },
      };
      return handleRefs;
    },
    []
  );

  return (
    <div className="state-header">
      <h1>State:{" "}
        {state === ThreeHandShakeState
          ? "Connection is establishing ... "
          : state === FlowControlState
            ? "Connection established, data transmitting ..."
            : state === FourHandShakeState
              ? "Finish data transmission"
              : "TCP Closed"}</h1>

      <Badge
        dot={props.newMessComing}
        className="help-notification"
        title="Survival Manual is Available!"
        offset={[-5, 3]}
        size="default"
      >
        <QuestionCircleOutlined
          style={{ fontSize: "40px", color: "white" }}
          onClick={() => {

            Modal.confirm({
              width: "800px",
              cancelText: () => { },
              title: "Tips",
              content: <EasyLevelManual showSurvivalManual={props.showSurvivalManual} />,
            });
            props.setNewMessComing(false);
          }}
        />
      </Badge>
    </div>
  );
};

export default StateHeader;
