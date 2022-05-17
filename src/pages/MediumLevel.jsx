import { createTCPStateMachine } from "../AI/MediumTCPStateMachine";
import MediumPlayerInput from "../components/MediumPlayerInput";
import React from "react";
import { useInterpret, useSelector } from "@xstate/react";
import BasePacket from "../components/BasePacket"
import { MediumLevelManual } from "../components/text"
import { Modal, Result } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import '../components/StateHeader.css'
import { useHotkeys } from 'react-hotkeys-hook';
import $ from "jquery";
import { MediumLevelSteps } from "../components/Steps"
import { PlayerStatistics } from "../systems/Rating"
import { HealthBar } from "../systems/Health"

const prettyPrintState = (state) => {
    console.log({
        "state": state.value,
        "sourcePort": state.context["sourcePort"],
        "destinationPort": state.context["destinationPort"],
        "sequenceNumber": state.context["sequenceNumber"],
        "AckNumber": state.context["AckNumber"],
        "lastOutputSegment": state.context["outputSegments"][state.context["outputSegments"].length - 1],
        "lastSavedSegment": state.context["savedSegments"][state.context["savedSegments"].length - 1]
    });
};
const getRandomNumber = (max) => Math.floor(Math.random() * max);
const AIPort = 3280;
const playerPort = 12345;
const AISequenceNumber = getRandomNumber(1e6);
const AIMachine = createTCPStateMachine(AIPort, playerPort, AISequenceNumber, "", 1e6, 1e6);

const Header = (props) => {
    const service = props.service;
    const AIState = useSelector(service, (state) => state.value);
    return (
        <div className="state-header">
            <h1>State: {AIState}</h1>
            <QuestionCircleOutlined
                className="help-notification"
                style={{
                    fontSize: "40px", color: "white"
                }}
                onClick={() => {
                    Modal.confirm({
                        width: "800px",
                        cancelText: () => { },
                        title: "Tips",
                        content: <MediumLevelManual />,
                    });
                }}
            />
        </div>
    )
}

const Bottom = (props) => {
    const { historyMes, setHistoryMes, service } = props;
    const AIState = useSelector(service, (state) => state.value);
    const AISavedSegmentsLength = service.getSnapshot().context.savedSegments.length;
    if (AIState === "CLOSED" && AISavedSegmentsLength > 0) {
        return (
            <Result
                status="success"
                title={
                    <div>
                        Well Done! You have successfully complete a TCP connection!
                        <PlayerStatistics
                            historyMes={historyMes}
                            AISavedSegmentsLength={AISavedSegmentsLength}
                        />
                    </div>}
                subTitle="Play again to explore more TCP states"
            />
        );
    }
    else {
        return (
            <MediumPlayerInput
                service={service}
                sourcePort={playerPort}
                destinationPort={AIPort}
                setHistoryMes={setHistoryMes}
                historyMes={historyMes}
            />
        );
    }
}

const MediumLevelGame = () => {
    const service = useInterpret(AIMachine, {}, (state) => {
        prettyPrintState(state);
    });
    const [historyMes, setHistoryMes] = React.useState([]);
    const [health, setHealth] = React.useState(100);
    const messagesEndRef = React.useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    };
    React.useEffect(() => {
        scrollToBottom();
    }, [historyMes]);

    React.useEffect(() => {
        service.start();
        service.send({ type: "PASSIVE_OPEN" });
    }, []);
    useHotkeys('ctrl+enter', () => $(".send-btn").trigger("click"));
    return (
        <div className="medium-level-game">
            <Header
                service={service}
            />
            <HealthBar
                historyMes={historyMes}
                service={service}
                health={health}
                setHealth={setHealth}
            />
            <div className="container">
                <div className="info-container">
                    {historyMes.map((ele) => {
                        return ele.message ? (
                            ele.content
                        ) : ele.isAIMsg ? (
                            <div
                                className="client-message"
                                style={{
                                    display: "flex",
                                    width: "45%",
                                    alignSelf: "flex-start",
                                }}
                            >
                                <BasePacket {...ele} inputDisable={true} />{" "}
                            </div>
                        ) : (
                            <div
                                className="server-message"
                                style={{ display: "flex", width: "45%", alignSelf: "flex-end" }}
                            >
                                <BasePacket {...ele} inputDisable={true} />{" "}
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef}></div>
                </div>

                <div>
                    <Bottom
                        service={service}
                        historyMes={historyMes}
                        setHistoryMes={setHistoryMes}
                    />
                </div>

                <div className="progress">
                    <MediumLevelSteps
                    // current={state <= stateConfig.FlowControlState ? 0 : 1}
                    />
                </div>

            </div>


        </div>
    );
};

export default MediumLevelGame;
