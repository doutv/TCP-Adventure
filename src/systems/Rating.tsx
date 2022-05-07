import * as React from "react";
import { getDataSizeInBytes } from "../AI/MediumTCPStateMachine";
import { Statistic, Row, Col } from "antd";

const PlayerStatistics = (props) => {
    const { historyMsgs, AISavedSegmentsLength } = props;
    const stats = GetPlayerStatistics(historyMsgs, AISavedSegmentsLength);
    return (
        <Row gutter={16}>
            <Col span={12}>
                <Statistic title="Rating" value={stats.rating} />
            </Col>
            <Col span={12}>
                <Statistic title="Number of segments sent" value={stats.segmentsCnt} />
            </Col>
            <Col span={12}>
                <Statistic title="Total data bytes sent" value={stats.totalDataSent} />
            </Col>
            <Col span={12}>
                <Statistic title="Number of error segments sent" value={stats.errorSegmentCnt} loading />
            </Col>
        </Row >
    );
};

interface HistoryMsg {
    sourcePort: number
    destinationPort: number
    sequenceNumber: number
    AckNumber: number
    ACK: number
    FIN: number
    SYN: number
    RST: number
    data?: string
    isAIMsg: boolean
};
type Ratings = "S" | "A" | "B" | "C";
interface PlayStatistics {
    rating: Ratings
    segmentsCnt: number
    errorSegmentCnt: number
    totalDataSent: number
    // time
}
function GetPlayerStatistics(historyMsgs: HistoryMsg[], AISavedSegmentsLength: number): PlayStatistics {
    const playerMsgs = historyMsgs.filter(msg => msg.isAIMsg === false);
    const AIMsgs = historyMsgs.filter(msg => msg.isAIMsg === true);
    const SegmentsCnt = playerMsgs.length;
    let errorSegmentCnt = playerMsgs.length - AISavedSegmentsLength
    let totalDataSent = 0;
    playerMsgs.forEach(msg => {
        totalDataSent += getDataSizeInBytes(msg.data);
    });
    // Use a backend to calculate the rating by comparing player performances
    let rating: Ratings = "S";
    if (errorSegmentCnt >= 1)
        rating = "A";
    else if (errorSegmentCnt >= 5)
        rating = "B";
    else if (errorSegmentCnt >= 10)
        rating = "C";
    return {
        rating: rating,
        segmentsCnt: SegmentsCnt,
        errorSegmentCnt: errorSegmentCnt,
        totalDataSent: totalDataSent
    }
}

export {
    GetPlayerStatistics,
    PlayerStatistics
};