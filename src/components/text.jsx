import { Image } from "antd"
import ThreeWayHandshakeImage from "../img/three-way-handshake.png"
const BackgroundMessage = ()=> (
    <div className="background-description">
        <p>One day you become a TCP module in your computer and you feel a bit scared when you see your surroundings, maybe your knowledge of TCP can help you escape from here.</p>
        <p> If you make many mistakes, you will be caught by the operating system and you will fail! </p>
    </div>
)

const EasyLevelManual = ()=> (
    <div className="easy-level-manual">
        <h2>Easy Level</h2>
        <p>In this level, a mysterious person will send you a survival manual to help you. You should send proper TCP segments to complete a TCP connection.</p>
        <h3>Tips:</h3>
        <p>You will go through three TCP phases: 
            <li>1. Connection establishment</li>
            <li>2. Data transmission</li>
            <li>3. Connection termination</li>
        </p>
        <Image src={ThreeWayHandshakeImage} alt="Connection establishment" />
    </div>
)

export {BackgroundMessage, EasyLevelManual}