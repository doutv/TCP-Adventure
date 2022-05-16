import * as React from "react";

const initHealth = 100;
const penalty = 10;
const reward = 5;

function updateHealth(health, prevPlayerMsgs, historyMsgs, AILastSavedSegment) {
    const playerMsgs = historyMsgs.filter(msg => msg.isAIMsg === false);
    if (prevPlayerMsgs.length < playerMsgs.length) {
        if (playerMsgs[playerMsgs.length - 1] !== AILastSavedSegment) {
            return health - penalty;
        }
        else {
            return health + reward;
        }
    }
}

const HealthBar = (props) => {
    const { historyMes, AILastSavedSegment } = props;
    const [health, setHealth] = React.useState(initHealth);
    // setHealth(updateHealth(health, historyMes, AILastSavedSegment));
}