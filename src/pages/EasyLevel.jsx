import "./EasyLevel.css";
import StateHeader from "../components/StateHeader";
import React from "react";
import {useNavigate} from "react-router-dom"
import { Modal, Result, Button } from "antd";
import BasePacket from "../components/BasePacket";
import SendPacket from "../components/sendPacket";
import { EasyLevelManual } from "../components/text";
function getRandomNumber(max) {
  return Math.floor(Math.random() * max);
}
const clientPort = 3280;
const serverPort = 1314;
const INIT_CLIENT_SEQ = getRandomNumber(1e5);
const INIT_SERVER_SEQ = getRandomNumber(1e5);
const INIT_TIMER = 0;
const StateHeaderRef = React.forwardRef(StateHeader);
function EasyLevelGame() {
  const stateConfig = {
    ThreeHandShakeState: 0,
    FlowControlState: 1,
    FourHandShakeState: 2,
    Finished: 3,
  };
  const navigate = useNavigate();
  const [state, setState] = React.useState(stateConfig.ThreeHandShakeState);
  const stateRef = React.useRef(null);
  const [showInfoModal, setShowInfoModal] = React.useState(true);

  const changeState = (newState) => stateRef.current.changeState(newState);

  const [timer, setTimer] = React.useState();
  const [historyMes, setHistoryMes] = React.useState([]);

  // add auto scroll to bottom
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const [sendPacketVisible, setSendPacketVisible] = React.useState(false);
  let clientPacketConfig = {
    sourcePort: clientPort,
    destinationPort: serverPort,
    sequenceNumber: INIT_CLIENT_SEQ,
    AckNumber: 0,
    ACK: 0,
    SYN: 1,
    FIN: 0,
    inputDisable: true,
    isClientMes: true,
  };
  let serverPacketConfig = {
    sourcePort: serverPort,
    destinationPort: clientPort,
    sequenceNumber: INIT_SERVER_SEQ,
    AckNumber: INIT_CLIENT_SEQ + 1,
    ACK: 1,
    SYN: 1,
    FIN: 0,
    inputDisable: true,
    isClientMes: true,
  };
  const clientPackConfigs = {
    0: { ...clientPacketConfig },
    1: (function () {
      clientPacketConfig.sequenceNumber += 1;
      clientPacketConfig.AckNumber = INIT_SERVER_SEQ + 1;
      clientPacketConfig.ACK = 1;
      clientPacketConfig.SYN = 0;
      return { ...clientPacketConfig };
    })(),
    2: (function () {
      // client send data
      clientPacketConfig.data = "Survival Manual:";
      return { ...clientPacketConfig };
    })(),
    3: (function () {
      const size = 8;
      clientPacketConfig.sequenceNumber += size;
      clientPacketConfig.FIN = 1;
      clientPacketConfig.data = undefined;

      return { ...clientPacketConfig };
    })(),
    4: (function () {
      clientPacketConfig.sequenceNumber += 1;
      clientPacketConfig.AckNumber = INIT_SERVER_SEQ + 2;
      clientPacketConfig.FIN = 0;
      return { ...clientPacketConfig };
    })(),
  };
  const ClientPackets = {
    0: () => {
      setHistoryMes([...historyMes, { ...clientPackConfigs[0] }]);
      setTimeout(() => setSendPacketVisible(true), 1000);
    },
    1: () => {
      // 3 way handshake DONE!
      const threeWayHandShakeFinished = {
        message: true,
        content: <div className="connect-done">Connection Established!</div>,
      };
      setState(stateConfig.FlowControlState);
      const sendPackets = [clientPackConfigs[1], threeWayHandShakeFinished];
      setHistoryMes([...historyMes, ...sendPackets]);
      const data = clientPackConfigs[2].data;
      setTimeout(() => {
        Modal.confirm({
          title: "Receive Data ...",
          content: data,
          okText: "Receive Data",
          cancelText: () => {},
          cancelButtonProps: { htmlType: "" },
          closable: false,
          onOk() {
            return new Promise((resolve, reject) => {
              resolve();
            })
              .then(() => {
                setTimeout(() => {
                  sendPackets.push(clientPackConfigs[2]);
                  setState(stateConfig.FourHandShakeState);
                  setHistoryMes([...historyMes, ...sendPackets]);
                  setTimeout(() => {
                    sendPackets.push(clientPackConfigs[3]);
                    setHistoryMes([...historyMes, ...sendPackets]);
                  }, 2000);
                }, 1000);
              })
              .catch((e) => console.log(e));
          },
        });
      }, 3000);
    },
    2: () => {
      const FourWayHandShakeFinished = {
        message: true,
        content: <div className="connect-done">Closed!</div>,
      };
      setState(stateConfig.Finished);
      setSendPacketVisible(false);
      setHistoryMes([
        ...historyMes,
        clientPackConfigs[4],
        FourWayHandShakeFinished,
      ]);
    },
  };

  const serverPackConfigs = {
    0: { ...serverPacketConfig },
    1: (function () {
      const AckNumber = clientPackConfigs[3].sequenceNumber + 1;
      serverPacketConfig.ACK = 1;
      serverPacketConfig.SYN = 0;
      serverPacketConfig.FIN = 1;
      serverPacketConfig.sequenceNumber = INIT_SERVER_SEQ + 1;
      serverPacketConfig.AckNumber = AckNumber;
      return { ...serverPacketConfig };
    })(),
  };
  React.useEffect(() => {
    // client seq change, generate client message
    if (timer !== undefined) {
      console.log("timer change: ", timer);
      let order = timer - INIT_TIMER;
      ClientPackets[order]();
      setTimeout(scrollToBottom, 1000);
    }
  }, [timer]);
  React.useEffect(() => {
    scrollToBottom();
  }, [historyMes]);

  const closeInfoModal = (e) => {
    changeState(stateConfig.ThreeHandShakeState); // initialize the game state
    setShowInfoModal(false); // close the modal
    setTimeout(() => {
      Modal.confirm({
        icon: null,
        title: "Listen! You Received a handshake packet:",
        content: <BasePacket {...clientPackConfigs[0]} />,
        cancelText: () => {},
        onOk() {
          return new Promise((resolve, reject) => {
            setTimer(INIT_TIMER);
            resolve();
          }).catch((e) => console.log(e));
        },
      });
    }, 1000);
  };
  return (
    <div className="easy-level-game">
      <Modal
        closable={false}
        cancelText={() => {}}
        onOk={closeInfoModal}
        visible={showInfoModal}
        title="Welcome to TCP Easy Level Game!!!"
      >
        <EasyLevelManual />
      </Modal>

      <StateHeaderRef
        state={state}
        setState={setState}
        ref={stateRef}
        {...stateConfig}
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
                {" "}
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
        {sendPacketVisible ? (
          <SendPacket
            sourcePort={serverPort}
            destinationPort={clientPort}
            correctCheck={serverPackConfigs[timer]}
            historyMes={historyMes}
            setHistoryMes={setHistoryMes}
            sequenceNumber={INIT_SERVER_SEQ}
            inputDisable={false}
            timer={timer}
            setTimer={setTimer}
          />
        ) : (
          ""
        )}
        {state == stateConfig.Finished? <Result
        status="success"
        title="Well Done! You have successfully complete the TCP job!"
        subTitle="Need more challenge? Try a harder level! Hope you have a deeper understanding of TCP!"
        extra={[<Button onClick={()=>{
          navigate("/")
        }}>Select another Level</Button>]}
        />: ""}
      </div>
    </div>
  );
}

export default EasyLevelGame;
