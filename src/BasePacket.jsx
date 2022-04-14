import { Row, Tag, Input, Col } from "antd";
import React from "react";
const PackBox = (props) => {
  return (
    <div style={{ display: "flex" }}>
      <Tag color={"#465c6a"}>{props.name}</Tag>
      <Input
        id={props.id}
        disabled={props.inputDisable}
        value={props.value}
        onChange={(e) => {
          console.log(e);
          props.setValue(e.target.value);
        }}
      />
    </div>
  );
};

const BasePacket = (props) => {
  const { inputDisable } = props;
  const [sourcePort, setSourceProt] = React.useState(props.sourcePort);
  const [DestinationPort, setDestinationProt] = React.useState(
    props.DestinationPort
  );

  const [sequenceNumber, setSequenceNumber] = React.useState(
    props.sequenceNumber
  );
  const [AckNumber, setAckNumber] = React.useState(props.AckNumber);
  const [ACK, setACK] = React.useState(props.ACK);
  const [SYN, setSYN] = React.useState(props.SYN);
  const [FIN, setFIN] = React.useState(props.FIN);
    const position = props.isClientMes? "flex-start": "flex-end";
  return (
    <div
      className="packet"
      style={{ border: "solid 2px black",borderRadius:"10px", padding: "4px 0", width: "45%", alignSelf: position}}
    >
      <Row gutter={[8, 8]}>
        <Col span={12}>
          <PackBox
            name={"Source Port"}
            inputDisable={inputDisable}
            value={sourcePort}
            setValue={setSourceProt}
            id = {"source-port"}
          />
        </Col>
        <Col span={12}>
          <PackBox
            name={"Destination Port"}
            inputDisable={inputDisable}
            value={DestinationPort}
            setValue={setDestinationProt}
            id = "destination-port"
          />
        </Col>
      </Row>
      <div style={{ border: "solid", margin: "4px 0" }}></div>
      <Row>
        <PackBox
          name={"Sequence Number"}
          inputDisable={inputDisable}
          value={sequenceNumber}
          setValue={setSequenceNumber}
          id = "seq-number"
        />
      </Row>
      <div style={{ border: "solid", margin: "4px 0" }}></div>

      <Row>
        <PackBox
          name={"Acknowledgement Number"}
          inputDisable={inputDisable}
          value={AckNumber}
          setValue={setAckNumber}
          id = "ack-number"
        />
      </Row>
      <div style={{ border: "solid", margin: "4px 0" }}></div>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          {" "}
          <PackBox
            name="ACK"
            inputDisable={inputDisable}
            value={ACK}
            setValue={setACK}
            id = "ACK"
          />
        </Col>
        <Col span={8}>
          <PackBox
            name="SYN"
            inputDisable={inputDisable}
            value={SYN}
            setValue={setSYN}
            id = "SYN"
          />
        </Col>
        <Col span={8}>
          <PackBox
            name="FIN"
            inputDisable={inputDisable}
            value={FIN}
            setValue={setFIN}
            id = "FIN"
          />
        </Col>
      </Row>
    </div>
  );
};

export default BasePacket;
