import { Row, Tag, Input, Col } from "antd";
import React from "react";
const { TextArea } = Input;
const PackBox = (props) => {
    return (
        <div style={{ display: "flex" }}>
            <Tag color={"#465c6a"} style={{ marginLeft: "5px" }}>{props.name}</Tag>
            <Input
                id={props.id}
                disabled={props.inputDisable}
                value={props.value}
                onChange={(e) => {
                    //   console.log(e);
                    props.setValue(e.target.value);
                }}
            />
        </div>
    );
};
const MultiLinePackBox = (props) => {
    return (
        <Row>
            <Col flex="none" justify="space-around" align="middle">
                <Tag color={"#465c6a"} style={{ marginLeft: "5px" }}>{props.name}</Tag>
            </Col>
            <Col flex="auto">
                <TextArea showCount
                    maxLength={1500}
                    id={props.id}
                    disabled={props.inputDisable}
                    value={props.value}
                    onChange={(e) => {
                        props.setValue(e.target.value);
                    }}
                />
            </Col>
        </Row>
    );
}
const Divider = () => <div style={{ border: "solid", margin: "4px 0" }}></div>;
const BasePacket = (props) => {
    const { inputDisable } = props;
    const [sourcePort, setSourceProt] = React.useState(props.sourcePort);
    const [destinationPort, setDestinationProt] = React.useState(
        props.destinationPort
    );

    const [sequenceNumber, setSequenceNumber] = React.useState(
        props.sequenceNumber
    );
    const [AckNumber, setAckNumber] = React.useState(props.AckNumber);
    const [ACK, setACK] = React.useState(props.ACK);
    const [SYN, setSYN] = React.useState(props.SYN);
    const [FIN, setFIN] = React.useState(props.FIN);
    const [RST, setRST] = React.useState(props.RST);
    const [data, setData] = React.useState(props.data)
    const { showRST, showData } = props
    return (
        <div
            className="packet"
            style={{
                border: "solid 2px black",
                borderRadius: "10px",
                padding: "4px 0",
                // width: "45%",
            }}
        >
            <Row gutter={[8, 8]}>
                <Col span={12}>
                    <PackBox
                        name={"Source Port"}
                        inputDisable={inputDisable}
                        value={sourcePort}
                        setValue={setSourceProt}
                        id={"source-port"}
                    />
                </Col>
                <Col span={12}>
                    <PackBox
                        name={"Destination Port"}
                        inputDisable={inputDisable}
                        value={destinationPort}
                        setValue={setDestinationProt}
                        id="destination-port"
                    />
                </Col>
            </Row>
            <Divider />
            <Row>
                <PackBox
                    name={"Sequence Number"}
                    inputDisable={inputDisable}
                    value={sequenceNumber}
                    setValue={setSequenceNumber}
                    id="seq-number"
                />
            </Row>
            <Divider />

            <Row>
                <PackBox
                    name={"Acknowledgement Number"}
                    inputDisable={inputDisable}
                    value={AckNumber}
                    setValue={setAckNumber}
                    id="ack-number"
                />
            </Row>
            <Divider />

            <Row style={{ flexWrap: "nowrap" }}>
                <Col>
                    {" "}
                    <PackBox
                        name="ACK"
                        inputDisable={inputDisable}
                        value={ACK}
                        setValue={setACK}
                        id="ACK"
                    />
                </Col>
                <Col >
                    <PackBox
                        name="SYN"
                        inputDisable={inputDisable}
                        value={SYN}
                        setValue={setSYN}
                        id="SYN"
                    />
                </Col>
                <Col >
                    <PackBox
                        name="FIN"
                        inputDisable={inputDisable}
                        value={FIN}
                        setValue={setFIN}
                        id="FIN"
                    />
                </Col>
                {props.RST !== undefined || showRST ?
                    <Col >
                        <PackBox
                            name="RST"
                            inputDisable={inputDisable}
                            value={RST}
                            setValue={setRST}
                            id="RST"
                        />
                    </Col> : " "}
            </Row>
            {props.data !== undefined || showData ? <Divider /> : ""}
            {props.data !== undefined || showData ? (
                <MultiLinePackBox
                    name="DATA"
                    id="data"
                    value={props.data}
                    setValue={setData}
                    inputDisable={inputDisable}
                />
            ) : (
                ""
            )}
        </div>
    );
};

export default BasePacket;
