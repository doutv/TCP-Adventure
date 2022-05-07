import { GetPlayerStatistics } from "./Rating"

it('Medium Level Player Rating', () => {
    const historyMsgs = [
        {
            "sourcePort": 12345,
            "destinationPort": 3280,
            "sequenceNumber": 1246737,
            "AckNumber": 0,
            "ACK": 0,
            "FIN": 0,
            "SYN": 1,
            "RST": 0,
            "data": "",
            "isAIMsg": false
        },
        {
            "sourcePort": 3280,
            "destinationPort": 12345,
            "sequenceNumber": 318573,
            "windowSize": 1,
            "AckNumber": 1246738,
            "ACK": 1,
            "SYN": 1,
            "FIN": 0,
            "RST": 0,
            "isAIMsg": true
        },
        {
            "sourcePort": 12345,
            "destinationPort": 3280,
            "sequenceNumber": 1246738,
            "AckNumber": 318574,
            "ACK": 1,
            "FIN": 0,
            "SYN": 0,
            "RST": 0,
            "data": "",
            "isAIMsg": false
        },
        {
            "sourcePort": 12345,
            "destinationPort": 3280,
            "sequenceNumber": 1246738,
            "AckNumber": 318574,
            "ACK": 1,
            "FIN": 0,
            "SYN": 0,
            "RST": 0,
            "data": "How can I contact you?",
            "isAIMsg": false
        },
        {
            "sourcePort": 3280,
            "destinationPort": 12345,
            "sequenceNumber": 318574,
            "windowSize": 1,
            "AckNumber": 1246760,
            "ACK": 1,
            "SYN": 0,
            "FIN": 0,
            "RST": 0,
            "isAIMsg": true
        },
        {
            "sourcePort": 3280,
            "destinationPort": 12345,
            "sequenceNumber": 318574,
            "windowSize": 1,
            "AckNumber": 1246760,
            "ACK": 1,
            "SYN": 0,
            "FIN": 0,
            "RST": 0,
            "data": "Remember my port number is 3280, and I always send segments through your port 12345.",
            "isAIMsg": true
        },
        {
            "sourcePort": 12345,
            "destinationPort": 3280,
            "sequenceNumber": 1246760,
            "AckNumber": 318658,
            "ACK": 1,
            "FIN": 0,
            "SYN": 0,
            "RST": 0,
            "data": "What's your name?",
            "isAIMsg": false
        },
        {
            "sourcePort": 3280,
            "destinationPort": 12345,
            "sequenceNumber": 318658,
            "windowSize": 1,
            "AckNumber": 1246777,
            "ACK": 1,
            "SYN": 0,
            "FIN": 0,
            "RST": 0,
            "isAIMsg": true
        },
        {
            "sourcePort": 3280,
            "destinationPort": 12345,
            "sequenceNumber": 318658,
            "windowSize": 1,
            "AckNumber": 1246777,
            "ACK": 1,
            "SYN": 0,
            "FIN": 0,
            "RST": 0,
            "data": "My name is Vint Bob",
            "isAIMsg": true
        },
        {
            "sourcePort": 12345,
            "destinationPort": 3280,
            "sequenceNumber": 1246777,
            "AckNumber": 318677,
            "ACK": 0,
            "FIN": 1,
            "SYN": 0,
            "RST": 0,
            "data": "",
            "isAIMsg": false
        },
        {
            "sourcePort": 12345,
            "destinationPort": 3280,
            "sequenceNumber": 1246777,
            "AckNumber": 318696,
            "ACK": 0,
            "FIN": 1,
            "SYN": 0,
            "RST": 0,
            "data": "",
            "isAIMsg": false
        },
        {
            "sourcePort": 12345,
            "destinationPort": 3280,
            "sequenceNumber": 1246777,
            "AckNumber": 318677,
            "ACK": 0,
            "FIN": 1,
            "SYN": 0,
            "RST": 0,
            "data": "",
            "isAIMsg": false
        },
        {
            "sourcePort": 12345,
            "destinationPort": 3280,
            "sequenceNumber": 1246777,
            "AckNumber": 318677,
            "ACK": 1,
            "FIN": 1,
            "SYN": 0,
            "RST": 0,
            "data": "",
            "isAIMsg": false
        },
        {
            "sourcePort": 3280,
            "destinationPort": 12345,
            "sequenceNumber": 318677,
            "windowSize": 1,
            "AckNumber": 1246778,
            "ACK": 1,
            "SYN": 0,
            "FIN": 0,
            "RST": 0,
            "isAIMsg": true
        },
        {
            "sourcePort": 3280,
            "destinationPort": 12345,
            "sequenceNumber": 318677,
            "windowSize": 1,
            "AckNumber": 1246778,
            "ACK": 1,
            "SYN": 0,
            "FIN": 1,
            "RST": 0,
            "isAIMsg": true
        },
        {
            "sourcePort": 12345,
            "destinationPort": 3280,
            "sequenceNumber": 1246778,
            "AckNumber": 318678,
            "ACK": 1,
            "FIN": 0,
            "SYN": 0,
            "RST": 0,
            "data": "",
            "isAIMsg": false
        }
    ]
    const stats = GetPlayerStatistics(historyMsgs, 6);
    console.log(stats);
    expect(stats.rating).toEqual("A");
    expect(stats.segmentsCnt).toEqual(9);
    expect(stats.errorSegmentCnt).toEqual(3);
    expect(stats.totalDataSent).toEqual(39)
});