import { Button, notification } from "antd";
import BasePacket from "./BasePacket";
import React from "react";
import $ from "jquery";
const RefPacket = React.forwardRef(BasePacket);

const SendPacket = (props) => {
  // const clientSeqNumber = props.clientSeqNumber;
  // const ref = React.useRef(null);
  const { correctCheck } = props;
  const Error = {
    ACKError: "ACK ERROR",
    SYNError: "SYN ERROR",
    FINError: "FIN ERROR",
    AckNumberError: "ACKNOWLEDGE NUMBER ERROR",
    sourcePortError: "SOURCE PORT ERROR",
    sequenceNumberError: "SEQUENCE NUMBER ERROR",
    destinationPortError: "DESTINATION PORT ERROR",
  };
  return (
    <div className="send-packet">
      <RefPacket {...props} />
      <Button
        className="send-btn"
        onClick={() => {
          const sourcePort = parseInt($(".send-packet #source-port")[0].value);
          const sequenceNumber = parseInt($(".send-packet #seq-number")[0].value);
          const destinationPort = parseInt($(".send-packet #destination-port")[0].value);
          const AckNumber = parseInt($(".send-packet #ack-number")[0].value);
          const ACK = parseInt($(".send-packet #ACK")[0].value);
          const SYN = parseInt($(".send-packet #SYN")[0].value);
          const FIN = parseInt($(".send-packet #FIN")[0].value);
          let isSuccess = true;
          if (sourcePort !== correctCheck.sourcePort) {
            isSuccess = false;
            notification.error({
              message: "Send Packet Error:",
              description: Error.sourcePortError,
            });
          }
          if (destinationPort !== correctCheck.destinationPort) {
            isSuccess = false;
            notification.error({
              message: "Send Packet Error:",
              description: Error.destinationPortError,
            });
          }
          if (sequenceNumber !== correctCheck.sequenceNumber) {
            isSuccess = false;
            notification.error({
              message: "Send Packet Error:",
              description: Error.sequenceNumberError,
            });
          }
          if (AckNumber !== correctCheck.AckNumber) {
            isSuccess = false;
            notification.error({
              message: "Send Packet Error:",
              description: Error.AckNumberError,
            });
          }
          if (ACK !== correctCheck.ACK) {
            isSuccess = false;
            notification.error({
              message: "Send Packet Error:",
              description: Error.ACKError,
            });
          }
          if (SYN !== correctCheck.SYN) {
            isSuccess = false;
            notification.error({
              message: "Send Packet Error:",
              description: Error.SYNError,
            });
          }
          if (FIN !== correctCheck.FIN) {
            isSuccess = false;
            notification.error({
              message: "Send Packet Error:",
              description: Error.FINError,
            });
          }
          if (isSuccess) {
            notification.success({
              message: "Send Packet Successfully",
              // description: "...",
            });

            props.setHistoryMes([
              ...props.historyMes,
              {
                sourcePort,
                destinationPort,
                sequenceNumber,
                AckNumber,
                ACK,
                FIN,
                SYN,
                isClientMes: false,
              },
            ]);
            const tmpTimer = props.timer + 1;
            props.setTimer(tmpTimer);
          }
        }}
      >
        Send!
      </Button>
    </div>
  );
};

export default SendPacket;
