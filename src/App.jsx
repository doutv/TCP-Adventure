import "./App.css";
import StateHeader from "./StateHeader";
import React from "react";
import { Modal, Row, Col, List } from "antd";
import BasePacket from "./BasePacket";
import SendPacket from "./sendPacket";
function getRandomNumber(max) {
  return Math.floor(Math.random() * max);
}
const clientPort = 3280;
const serverPort = 1314;
const clientSeq = getRandomNumber(1e5);
const serverSeq = getRandomNumber(1e5);

const StateHeaderRef = React.forwardRef(StateHeader);
function App() {
  const stateConfig = {
    ThreeHandShakeState: 0,
    FlowControlState: 1,
    FourHandShakeState: 2,
    Finished: 3,
  };
  const [state, setState] = React.useState(stateConfig.ThreeHandShakeState);
  const stateRef = React.useRef(null);
  const [showInfoModal, setShowInfoModal] = React.useState(true);
  React.useEffect(() => {}, []);

  const changeState = (newState) => stateRef.current.changeState(newState);

  const [clientMes, setClientMes] = React.useState([]);
  const [serverMes, setServerMes] = React.useState([]);
  const [historyMes, setHistoryMes] = React.useState([]);
  const [sendPacketVisible, setSendPacketVisible] = React.useState(false)
  const closeInfoModal = (e) => {
    changeState(stateConfig.ThreeHandShakeState); // initialize the game state
    setShowInfoModal(false); // close the modal
    const firstThreeWayHandShake = {
      sourcePort: clientPort,
      DestinationPort: serverPort,
      sequenceNumber: clientSeq,
      AckNumber: 0,
      // Flags: 0,
      ACK: 0,
      SYN: 1,
      FIN: 0,
      inputDisable: true,
    };

    // clientMes.push()
    setTimeout(() => {
      Modal.confirm({
        icon: null,
        title: "You Received a handshake packet",
        content: <BasePacket {...firstThreeWayHandShake} />,
        onOk() {
          return new Promise((resolve, reject) => {
            resolve();
          })
            .then(() => {
              setHistoryMes([...historyMes, {...firstThreeWayHandShake, isClientMes: true}])
              setTimeout(() =>setSendPacketVisible(true), 1000)
              
            })
            .catch((e) => console.log(e));
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
          {historyMes.map((ele)=><BasePacket {...ele} inputDisable={true}/>)}
        </div>
      {sendPacketVisible? 
        <SendPacket
                  sourcePort={serverPort}
                  DestinationPort={clientPort}
                  correctCheck = {{
                    "AckNumber": clientSeq + 1,
                    "ACK": "1",
                    "SYN": "1",
                    "FIN": "0"
                  }}
                  historyMes= {historyMes}
                  setHistoryMes = {setHistoryMes}
                  sequenceNumber={serverSeq}
                  inputDisable={false}
        />: ''
                }
      </div>
    </div>
  );
}

export default App;
