import { Divider, Image } from "antd";
import ThreeWayHandshakeImage from "../img/three-way-handshake.png";
const BackgroundMessage = () => (
  <div className="background-description">
    <p>
      One day you become a TCP module in your computer and you feel a bit scared
      when you see your surroundings, maybe your knowledge of TCP can help you
      escape from here.
    </p>
    <p>
      {" "}
      If you make many mistakes, you will be caught by the operating system and
      you will fail!{" "}
    </p>
  </div>
);

const EasyLevelManual = (props) => (
  <div className="easy-level-manual">
    <h2>Easy Level</h2>
    <p>
      In this level, a mysterious person will send you a survival manual to help
      you. You should send proper TCP segments to complete a TCP connection.
    </p>
    <h3>Tips:</h3>
    <p>
      You will go through three TCP phases:
      <li>1. Connection establishment</li>
      <li>2. Data transmission</li>
      <li>3. Connection termination</li>
    </p>
    <Image src={ThreeWayHandshakeImage} alt="Connection establishment" />
    {props.showSurvivalManual ? (
      <div className="survival-manual">
        <Divider /> <SurvivalManual />
      </div>
    ) : (
      ""
    )}
  </div>
);

const SurvivalManual = () => {
  return (
    <div className="survival-manual">
      <h1>Survival Manual</h1>
      <p>
        <b>Sequence Number:</b> a counter used to keep track of every byte sent
        outward by a host, excluding header size.
      </p>
      Sequence Number = your last TCP segment sequence number + last TCP segment
      data size{" "}
      <p>
        If your last TCP segment is with flag SYN=1, then <br></br>
        Sequence Number = your last sequence number +1
      </p>
      <p>
        <b>Acknowledgment Number:</b> the next sequence number that the sender
        of the ACK is expecting.
      </p>
    </div>
  );
};

const EasyLevelFirstTaskDescription = () => {
  return (
    <div className="first-task-description">
      <h2>What should you do next?</h2>
      <p>Your <b>Source Port</b>, <b>Destination Port</b>, and <b>Sequence Number</b> are automatically generated.</p>
      <p>
        You need to complete the <b>Acknowledgement Number</b> and {" "}
        <b>
          Flags: (ACK, SYN, FIN).
        </b>{" "}
      </p>
      <p>
        You should input the correct answer and send it, or you will get
        error notifications.
      </p>
    </div>
  );
};

const EasyLevelSecondTaskDescription = () => {
  return (
    <div className="second-task-description">
      <h2>What should you do next?</h2>
      <p>
        Remember the definition of <b>Sequence Number</b>, <b>Acknowledgement Number</b>, and{" "}
        <b>Flags (ACK, SYN, FIN)</b> ?
        <p>Pay attention to what you have lastly received! </p>
      </p>
      <p>
        You should modify the <b>Sequence Number</b>, <b>Acknowledgement Number</b>, and{" "}
        <b>
          Flags (ACK, SYN, FIN).
        </b>{" "}
      </p>

      <p>
        You should input the correct answer and send it, or you will get
        error notifications.
      </p>
    </div>
  );
};

export {
  BackgroundMessage,
  EasyLevelManual,
  SurvivalManual,
  EasyLevelFirstTaskDescription,
  EasyLevelSecondTaskDescription
};
