import { Divider, Image } from "antd";
import ThreeWayHandshakeImage from "../img/three-way-handshake.png";
import FourWayHandshakeImage from "../img/four-way-handshake.png";

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
      you.
      You should send proper TCP segments to complete a TCP connection.
      You are not required to send any messages to the mysterious person.
    </p>
    <p>
      You will go through three TCP phases:
      <li>1. Connection establishment</li>
      <li>2. Data transmission</li>
      <li>3. Connection termination</li>
    </p>
    <h3>1. Connection establishment</h3>
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
      <h2>Survival Manual</h2>
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
      <h3>2. Data transmission</h3>
      <p>
        In this phase, the mysterious person will send you a segment with survival manual data, then try to terminate the connection.
      </p>
      <h3>3. Connection termination</h3>
      <p>
        TCP uses a cumulative acknowledgment.
        The receiver sends an acknowledgment segment to tell the sender that all segments before that acknowledgment number are received.
        If the cumulative acknowledgment is not used, the receiver will send an acknowledgment segment each time receives a segment.
      </p>
      <p>
        It is also possible to terminate the connection by a 3-way handshake,
        when host A sends a FIN and host B replies with a FIN & ACK (combining two steps into one) and host A replies with an ACK.
      </p>
      <Image src={FourWayHandshakeImage} alt="Connection termination" />
    </div>
  );
};

const EasyLevelFirstTaskDescription = () => {
  return (
    <div className="first-task-description">
      <h2>What should you do next?</h2>
      <h2>Send the second SYN-ACK</h2>
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
      <h2>Send the third FIN-ACK</h2>
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
