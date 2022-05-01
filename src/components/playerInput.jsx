import { Button, notification } from "antd";
import BasePacket from "./BasePacket";
import React, { useCallback } from "react";
import $ from "jquery";
// const RefPacket = React.forwardRef(BasePacket);

const PlayerInput = (props) => {
  // const clientSeqNumber = props.clientSeqNumber;
  // const ref = React.useRef(null);
  const { service } = props;

    React.useEffect(()=>{
        
    }, [service])

  const send = () => {
    console.log("send packet");
    // console.log(RefPacket)
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

    console.log(data)
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
    // const prevServerState = service.getSnapshot().value();
    service.send(event);
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
          isClientMes: false,
        },
      ];
    const serverState = service.getSnapshot().value; 
    const serverOutput = service.getSnapshot().context.outputSegment;
   console.log("snapshot", service.getSnapshot().history.context)
    // console.log(serverOutput.history.context)

    if (serverOutput) {
        historyMes = [
            ...historyMes,
            {
            ...serverOutput,
              isClientMes: true,
            },
          ];
    }

    props.setHistoryMes([...historyMes]);
    
  };

  return (
    <div className="send-packet">
      <BasePacket {...props} showRST showData inputDisable={false}/>
      <Button className="send-btn" onClick={send}>
        Send!
      </Button>
    </div>
  );
};

export default PlayerInput;
