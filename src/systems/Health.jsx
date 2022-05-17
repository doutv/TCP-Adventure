import * as React from "react";
import { Progress } from 'antd';

const initHealth = 100;
const penalty = 10;
const reward = 5;

const HealthBar = (props) => {
    const { historyMes, service } = props;
    const [health, setHealth] = React.useState(initHealth);
    // const prevPlayerMsgsRef = React.useRef([]);
    const AILastSavedSegment = service.getSnapshot().context.savedSegments[service.getSnapshot().context.savedSegments.length - 1];

    const updateHealth = () => {
        // let playerMsgs = historyMes.filter(msg => msg.isAIMsg === false);
        if (historyMes.length === 0) {
            return;
        }
        const lastMsg = historyMes[historyMes.length - 1];
        if (lastMsg.isAIMsg === false) {
            if (lastMsg !== AILastSavedSegment) {
                setHealth(health - penalty);
            }
            else {
                setHealth(health + reward);
            }
        }
        // prevPlayerMsgsRef.current = playerMsgs;
    }
    updateHealth();
    return (
        <div>
            <div style={{ width: '99%' }}>
                <Progress
                    percent={health}
                    strokeColor={{
                        "0%": "#FF4D4F",
                        "100%": "#52C41A"
                    }}
                    status="normal"
                    format={percent => `${percent}`}
                />
            </div>
        </div>
    );
};

export {
    HealthBar
}