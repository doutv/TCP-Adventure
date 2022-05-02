import { createTCPStateMachine } from "../AI/MediumTCPStateMachine";
import MediumPlayerInput from "../components/playerInput";
import React from "react";
import { useInterpret, useSelector } from "@xstate/react";
import BasePacket from "../components/BasePacket"

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

const AIStateHeader = (props) => {
    const service = props.service;
    const AIState = useSelector(service, (state) => state.value);
    return (
        <div className="state-header">
            <h1>State: {AIState}</h1>
        </div>
    )
}
const MediumLevelGame = () => {
    const service = useInterpret(AIMachine, {}, (state) => {
        prettyPrintState(state);
    });
    const [historyMes, setHistoryMes] = React.useState([]);
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

    return (
        <div className="medium-level-game">
            <AIStateHeader
                service={service}
            />
            <div className="container">
                <div className="info-container">
                    {historyMes.map((ele) => {
                        return ele.message ? (
                            ele.content
                        ) : ele.isClientMes ? (
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
                <MediumPlayerInput
                    service={service}
                    sourcePort={playerPort}
                    destinationPort={AIPort}
                    setHistoryMes={setHistoryMes}
                    historyMes={historyMes}
                />
            </div>


        </div>
    );
};

export default MediumLevelGame;
