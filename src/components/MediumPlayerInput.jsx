import { Button, notification } from "antd";
import BasePacket from "./BasePacket";
import React, { useCallback } from "react";
import $ from "jquery";
// const RefPacket = React.forwardRef(BasePacket);
const getOutputSegmentsFromIdx = (service, idx) => service.getSnapshot().context.outputSegments.slice(idx);
const serviceOutputIdx = 0;
const serviceLastState = "";
const MediumPlayerInput = (props) => {
    const serviceOutputIdxRef = React.useRef(serviceOutputIdx)
    const serviceLastStateRef = React.useRef(serviceLastState)
    const { service, setMission } = props;
    let mission_1 = React.useRef(false);
    let mission_2 = React.useRef(false);
    let mission_3 = React.useRef(false);


    const playerSend = () => {
        // PLayer send segment
        const sourcePort = parseInt($(".send-packet #source-port")[0].value);
        const sequenceNumber = parseInt($(".send-packet #seq-number")[0].value);
        const destinationPort = parseInt(
            $(".send-packet #destination-port")[0].value
        );
        const AckNumber = parseInt($(".send-packet #ack-number")[0].value);
        const ACK = parseInt($(".send-packet #ACK")[0].value);
        const SYN = parseInt($(".send-packet #SYN")[0].value);
        const FIN = parseInt($(".send-packet #FIN")[0].value);
        const RST = parseInt($(".send-packet #RST")[0].value);
        const data = $(".send-packet #data")[0].value;
        const event = {
            type: "RECV_SEGMENT",
            recvSegments: [
                {
                    sourcePort,
                    sequenceNumber,
                    destinationPort,
                    AckNumber,
                    ACK,
                    SYN,
                    FIN,
                    RST,
                    data,
                },
            ],
        };
        let historyMes = props.historyMes
        historyMes = [
            ...historyMes,
            {
                sourcePort,
                destinationPort,
                sequenceNumber,
                AckNumber,
                ACK,
                FIN,
                SYN,
                RST,
                data,
                isAIMsg: false,
            },
        ];

        // AI receive and send
        service.send(event);
        const serverState = service.getSnapshot().value;
        if (serverState === "CLOSE_WAIT") {
            service.send({ type: "SEND_FIN" });
        }
        const serverOutputs = getOutputSegmentsFromIdx(service, serviceOutputIdxRef.current);

        serverOutputs.forEach(each => each.isAIMsg = true);
        if (serverOutputs.length > 0) {
            historyMes = [
                ...historyMes,
                ...serverOutputs,
            ];
        }
        serviceLastStateRef.current = service.getSnapshot().value;
        serviceOutputIdxRef.current = service.getSnapshot().context.outputSegments.length;
        props.setHistoryMes([...historyMes]);

    };

    return (
        <div className="send-packet">
            <BasePacket {...props} showRST showData inputDisable={false} />
            <Button className="send-btn" onClick={playerSend}>
                Send (Ctrl+Enter)
            </Button>
        </div>
    );
};

export default MediumPlayerInput;
