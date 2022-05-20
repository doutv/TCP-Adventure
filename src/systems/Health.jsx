import * as React from "react";
import { Progress } from 'antd';
import _ from 'lodash';

const penalty = 10;
const reward = 5;

const HealthBar = (props) => {
    const { historyMes, service, health, setHealth } = props;
    const setHealthBounded = (health) => {
        if (health <= 0)
            health = 0;
        if (health >= 100)
            health = 100;
        setHealth(health);
    }
    // TODO: Only update health when historyMes changes
    // Below code depends on : Every time historyMes will update 2 msgs
    React.useEffect(() => {
        if (historyMes.length === 0)
            return;
        const AILastSavedSegment = service.getSnapshot().context.savedSegments[service.getSnapshot().context.savedSegments.length - 1];
        if (!AILastSavedSegment) {
            setHealthBounded(health - penalty);
            return;
        }
        let playerMsgs = historyMes.filter(msg => msg.isAIMsg === false);
        const lastMsg = playerMsgs[playerMsgs.length - 1];
        AILastSavedSegment["isAIMsg"] = false;

        // last 2 player messages are the same
        // _.isEqual() to check 2 objects equality
        if (playerMsgs.length >= 2 && _.isEqual(playerMsgs[playerMsgs.length - 1], playerMsgs[playerMsgs.length - 2])) {
            setHealthBounded(health - penalty);
            return;
        }

        if (_.isEqual(AILastSavedSegment, lastMsg))
            setHealthBounded(health + reward);
        else
            setHealthBounded(health - penalty);
    }, [historyMes]);

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