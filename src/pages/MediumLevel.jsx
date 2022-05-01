import {
    createTCPStateMachine,
    getDataSizeInBytes,
} from "../AI/MediumTCPStateMachine";
import PlayerInput from "../components/playerInput";
import React from "react";
import { useInterpret } from "@xstate/react";
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
    }
    );
};
const AIMachine = createTCPStateMachine(3280, 12345, 100, "", 1e6, 1e6);

const MediumLevelGame = () => {
    const service = useInterpret(AIMachine, {}, (state) => {
        prettyPrintState(state);
        // update status bar
    });
    // const AIState = useSelector(
    //     service,
    //     (state) => state.value
    // );
    const [historyMes, setHistoryMes] = React.useState([]);
    // add auto scroll to bottom
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        service.start();
        service.send({ type: "PASSIVE_OPEN" });
        console.log(service.getSnapshot().value);
    }, []);

    return (
        <div className="medium-level-game">
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
                <PlayerInput
                    service={service}
                    sourcePort={12345}
                    destinationPort={3280}
                    setHistoryMes={setHistoryMes}
                    historyMes={historyMes}
                />
            </div>


        </div>
    );
};

export default MediumLevelGame;
