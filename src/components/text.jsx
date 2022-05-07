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
        <p>
            In this level, a mysterious person will send you a survival manual to help
            you.
            You should send proper TCP segments to complete a TCP connection.
        </p>
        <p>
            You will go through three TCP phases:
            <li>1. Connection establishment</li>
            <li>2. Data transmission</li>
            <li>3. Connection termination</li>
        </p>
        <h3>1. Connection establishment</h3>
        <Image src={ThreeWayHandshakeImage} height="250px" alt="Connection establishment" />
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
            Sequence Number = your last sequence number + last data size{" "}
            <p>
                If your last TCP segment is with flag SYN=1 or FIN=1, then <br></br>
                Sequence Number = your last sequence number + 1
            </p>
            <p>
                <b>Acknowledgment Number:</b> the next expecting sequence number.
            </p>
            <h3>2. Data transmission</h3>
            <p>
                In this phase, the mysterious person will send you a segment with survival manual data.
            </p>
            <h3>3. Connection termination</h3>
            <p>
                <b>Cumulative Acknowledgment:</b>
                <br></br>
                The receiver sends an acknowledgment segment to tell the sender that all segments before that acknowledgment number are received.
                If the cumulative acknowledgment is not used, the receiver will send an acknowledgment segment each time receives a segment.
            </p>
            <p>
                It is also possible to terminate the connection by a <b>3-way handshake</b>,
                when host A sends a FIN and host B replies with a FIN & ACK (combining two steps into one) and host A replies with an ACK.
            </p>
            <Image src={FourWayHandshakeImage} height="250px" alt="Connection termination" />
        </div>
    );
};

const EasyLevelFirstTaskDescription = () => {
    return (
        <div className="first-task-description">
            <h2>Send the second SYN-ACK</h2>
            <h3>
                Fill:
                <br></br>
                1. Acknowledgement Number
                <br></br>
                2. Flags (ACK, SYN, FIN)
            </h3>
        </div>
    );
};

const EasyLevelSecondTaskDescription = () => {
    return (
        <div className="second-task-description">
            <h2>Send the third FIN-ACK</h2>
            <h3>
                Fill:
                <br></br>
                1. Sequence Number
                <br></br>
                2. Acknowledgement Number
                <br></br>
                3. Flags (ACK, SYN, FIN)
            </h3>
        </div>
    );
};

const MediumLevelManual = () => {
    return (
        <div className="medium-level-manual">
            <h3>
                This time, you should proactively open and close the connection.
            </h3>
            <h3>
                You still have a lot of questions in your mind and want to ask the mysterious person:
                <ul>
                    <li>How can I contact you?</li>
                    <li>If I receive other segments, what should I do?</li>
                    <li>What's your name?</li>
                </ul>
            </h3>
        </div>
    )
}

const MediumLevelFirstTaskDescription = () => {
    return (
        <div className="first-task-description">
            <h2>Proactively open and close the connection</h2>
            <h3>Ask questions if you like</h3>
        </div>
    );
}

const MediumLevelSecondTaskDescription = () => {
    return (
        <div className="second-task-description">
            <h2>Reset malicious connections</h2>
        </div>
    );
}

export {
    BackgroundMessage,
    EasyLevelManual,
    SurvivalManual,
    EasyLevelFirstTaskDescription,
    EasyLevelSecondTaskDescription,
    MediumLevelManual,
    MediumLevelFirstTaskDescription,
    MediumLevelSecondTaskDescription
};
