import * as React from "react";
import { getDataSizeInBytes } from "../AI/MediumTCPStateMachine";
import { Statistic, Row, Col, Card } from "antd";

const PlayerStatistics = (props) => {
    const { historyMes, AISavedSegmentsLength } = props;
    const stats = GetPlayerStatistics(historyMes, AISavedSegmentsLength);
    const gridStyle = {
        width: '50%',
    };
    return (
        <Row gutter={16}>
            <Col span={8}></Col>
            <Col span={8}>
                <Card >
                    <Card.Grid style={gridStyle}><Statistic title="Rating" value={stats.rating} /></Card.Grid>
                    <Card.Grid style={gridStyle}><Statistic title="Number of segments sent" value={stats.segmentsCnt} /></Card.Grid>
                    <Card.Grid style={gridStyle}><Statistic title="Total data bytes sent" value={stats.totalDataSent} /></Card.Grid>
                    <Card.Grid style={gridStyle}><Statistic title="Number of error segments sent" value={stats.errorSegmentCnt} /></Card.Grid>
                </Card>
            </Col>
            <Col span={8}></Col>
        </Row>
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
    const SegmentsCnt = playerMsgs.length;
    let errorSegmentCnt = playerMsgs.length - AISavedSegmentsLength
    let totalDataSent = 0;
    playerMsgs.forEach(msg => {
        totalDataSent += getDataSizeInBytes(msg.data);
    });
    // Use a backend to calculate the rating by comparing player performances
    let rating: Ratings = "S";
    const errorPercent = errorSegmentCnt / SegmentsCnt;
    if (errorPercent <= 0.1)
        rating = "S";
    else if (errorPercent <= 0.3)
        rating = "A"
    else if (errorPercent <= 0.5)
        rating = "B";
    else
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