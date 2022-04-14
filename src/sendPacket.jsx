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
      <Button
        onClick={() => {
          const sourcePort = $(".send-packet #source-port")[0].value;
          const seqNumber = $(".send-packet #seq-number")[0].value;
          const destinationPort = $(".send-packet #destination-port")[0].value;
          const ackNumber = $(".send-packet #ack-number")[0].value;
          const ACK = $(".send-packet #ACK")[0].value;
          const SYN = $(".send-packet #SYN")[0].value;
          const FIN = $(".send-packet #FIN")[0].value;
          let isSuccess = true;

          if (ackNumber != correctCheck.ackNumber) {
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
          }
        }}
      >
        Send!
      </Button>
    </div>
  );
};

export default SendPacket;
