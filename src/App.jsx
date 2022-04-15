import "./App.css";
import StateHeader from "./StateHeader";
import React from "react";
import { Modal} from "antd";
import BasePacket from "./BasePacket";
import SendPacket from "./sendPacket";
function getRandomNumber(max) {
  return Math.floor(Math.random() * max);
}
const clientPort = 3280;
const serverPort = 1314;
const INIT_CLIENT_SEQ = getRandomNumber(1e5);
const INIT_SERVER_SEQ = getRandomNumber(1e5);

const StateHeaderRef = React.forwardRef(StateHeader);
function App() {
  const stateConfig = {
    ThreeHandShakeState: 0,
    FlowControlState: 1,
    FourHandShakeState: 2,
    Finished: 3,
  };
  const [clientSeq, setClientSeq] = React.useState();
  const [serverSeq, setServerSeq] = React.useState();
  const [state, setState] = React.useState(stateConfig.ThreeHandShakeState);
  const stateRef = React.useRef(null);
  const [showInfoModal, setShowInfoModal] = React.useState(true);
  React.useEffect(() => {}, []);

  const changeState = (newState) => stateRef.current.changeState(newState);

  // const [clientMes, setClientMes] = React.useState([]);
  // const [serverMes, setServerMes] = React.useState([]);
  const [historyMes, setHistoryMes] = React.useState([]);

  // add auto scroll to bottom
  const messagesEndRef = React.useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
  }
  const [sendPacketVisible, setSendPacketVisible] = React.useState(false);
  let clientPacketConfig = {
    sourcePort: clientPort,
    DestinationPort: serverPort,
    sequenceNumber: INIT_CLIENT_SEQ,
    AckNumber: 0,
    // Flags: 0,
    ACK: 0,
    SYN: 1,
    FIN: 0,
    inputDisable: true,
    isClientMes: true,
  };
  const ClientPackets = {
    0: () => {
      setHistoryMes([...historyMes, { ...clientPacketConfig }]);
      setTimeout(() => setSendPacketVisible(true), 1000);
    },
    1: () => {
      const tmpServerSeq = serverSeq + 1;     
      setServerSeq(tmpServerSeq);
      // 3 way handshake DONE!
      clientPacketConfig.sequenceNumber += 1;
      clientPacketConfig.AckNumber = tmpServerSeq;
      const threeWayHandShakeFinished = {message: true, content: <div className="connect-done">Connection Established!</div>}
      setState(stateConfig.FlowControlState);
      setHistoryMes([...historyMes, { ...clientPacketConfig }, threeWayHandShakeFinished]);
    },
  };

  React.useEffect(() => {
    // client seq change, generate client message
    if (clientSeq !== undefined) {
      console.log("client seq change: ", clientSeq);
      let seq = clientSeq - INIT_CLIENT_SEQ;
      ClientPackets[seq]();
    }
  }, [clientSeq]);

  React.useEffect(() => {
    // server seq change, generate server message
    if (serverSeq !== undefined) {
      console.log("server seq change: ", serverSeq);
      scrollToBottom()
    }
  }, [serverSeq]);

  const closeInfoModal = (e) => {
    changeState(stateConfig.ThreeHandShakeState); // initialize the game state
    setShowInfoModal(false); // close the modal
    setTimeout(() => {
      Modal.confirm({
        icon: null,
        title: "You Received a handshake packet",
        content: <BasePacket {...clientPacketConfig} />,
        onOk() {
          return (
            new Promise((resolve, reject) => {
              setClientSeq(INIT_CLIENT_SEQ);
              setServerSeq(INIT_SERVER_SEQ);
              resolve();
            })
              // .then(() => {
              //   setHistoryMes([...historyMes, {...firstThreeWayHandShake, isClientMes: true}])
              //   setTimeout(() =>setSendPacketVisible(true), 1000)

              // })
              .catch((e) => console.log(e))
          );
        },
      });
    }, 1000);
  };
  return (
    <div className="App">
      {/* TODO: Complete Background Information on Modal, showing at the beginning of the game */}
      <Modal
        closable={false}
        cancelText={() => {}}
        onOk={closeInfoModal}
        visible={showInfoModal}
        title="Welcome to TCP Game Tutorial!"
      >
        <div className="tcp-description">
          You are the Server. Please use your knowledge to pass the game!
          <p>Best Wishes</p>
        </div>
      </Modal>

      <StateHeaderRef
        state={state}
        setState={setState}
        ref={stateRef}
        {...stateConfig}
      />

      <div className="container">
        <div className="info-container client-message">
          {historyMes.map((ele) => (
            ele.message? ele.content:
            <BasePacket {...ele} inputDisable={true} />
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        {sendPacketVisible ? (
          <SendPacket
            sourcePort={serverPort}
            DestinationPort={clientPort}
            correctCheck={{
              AckNumber: clientSeq + 1,
              ACK: "1",
              SYN: "1",
              FIN: "0",
            }}
            historyMes={historyMes}
            setHistoryMes={setHistoryMes}
            sequenceNumber={serverSeq}
            inputDisable={false}
            clientSeq={clientSeq}
            setClientSeq={setClientSeq}
          />
        ) : (
          ""
        )}
      </div>
    </div>
  );
}

export default App;
