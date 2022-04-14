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
  };

  return (
    <div className="send-packet">
      <RefPacket {...props} />
      <Button className="send-btn"
        onClick={() => {
          const sourcePort = $(".send-packet #source-port")[0].value;
          const sequenceNumber = $(".send-packet #seq-number")[0].value;
          const DestinationPort = $(".send-packet #destination-port")[0].value;
          const AckNumber = $(".send-packet #ack-number")[0].value;
          const ACK = $(".send-packet #ACK")[0].value;
          const SYN = $(".send-packet #SYN")[0].value;
          const FIN = $(".send-packet #FIN")[0].value;
          let isSuccess = true;

          if (AckNumber != correctCheck.AckNumber) {
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
                  message: "Send Packet Success",
                  description: "..."
              })

              props.setHistoryMes([...props.historyMes, {
                  sourcePort, DestinationPort, sequenceNumber, AckNumber, ACK, FIN, SYN, isClientMes: false
              }])
          }
        }}
      >
        Send!
      </Button>
    </div>
  );
};

export default SendPacket;
