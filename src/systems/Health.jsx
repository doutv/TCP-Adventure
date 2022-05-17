import * as React from "react";
import { Progress } from 'antd';
import _ from 'lodash';

const penalty = 10;
const reward = 5;

const HealthBar = (props) => {
    const { historyMes, service, health, setHealth } = props;

    React.useEffect(() => {
        if (historyMes.length === 0)
            return;
        const AILastSavedSegment = service.getSnapshot().context.savedSegments[service.getSnapshot().context.savedSegments.length - 1];
        if (!AILastSavedSegment) {
            setHealth(health - penalty);
            return;
        }
        let playerMsgs = historyMes.filter(msg => msg.isAIMsg === false);
        const lastMsg = playerMsgs[playerMsgs.length - 1];
        AILastSavedSegment["isAIMsg"] = false;

        // last 2 player messages are the same
        // _.isEqual() to check 2 objects equality
        if (playerMsgs.length >= 2 && _.isEqual(playerMsgs[playerMsgs.length - 1], playerMsgs[playerMsgs.length - 2])) {
            setHealth(health - penalty);
            return;
        }

        if (_.isEqual(AILastSavedSegment, lastMsg))
            setHealth(health + reward);
        else
            setHealth(health - penalty);

    }, [historyMes])

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