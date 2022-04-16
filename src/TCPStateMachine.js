import { createMachine } from 'xstate';

function increaseSequenceNumber(context) {
    if (context.outputSegment.SYN === 1) {
        context.sequenceNumber++;
    }
    else if (context.outputSegment.hasOwnProperty(data)) {
        context.sequenceNumber += new Blob([context.outputSegment.data]).size;
    }
}

function checkRecvSegment(context, recvSegment) {
    return (
        recvSegment.ACK === 1 &&
        recvSegment.sourcePort === context.destinationPort &&
        recvSegment.destinationPort == context.sourcePort
    );
}

function createTCPStateMachine(initSequenceNumber, payload) {
    return createMachine(
        {
            id: 'TCPMachine',
            initial: 'CLOSED',
            context: {
                sourcePort: 3280,
                destinationPort: 12345,
                sequenceNumber: initSequenceNumber,
                windowSize: 666666,
                AckNumber: 0,
                payload: payload,
                outstandingSegments: [],
                outputSegment: {},
                savedSegments: [],
                MSL: 10000 // 10s
            },
            states: {
                CLOSED: {
                    on: {
                        ACTIVE_OPEN: {
                            target: 'SYN_SENT',
                            actions: (context, event) => {
                                context.outputSegment = {
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 0,
                                    SYN: 1,
                                    FIN: 0,
                                    data: ''
                                }
                                increaseSequenceNumber(context);
                            }
                        },
                        PASSIVE_OPEN: {
                            target: 'LISTEN'
                        }
                    }
                },
                SYN_SENT: {
                    after: {
                        // TIMEOUT
                        30000: {
                            target: 'CLOSED'
                        }
                    },
                    on: {
                        // RECV_SYN_ACK_SEND_ACK
                        "*": {
                            target: 'ESTABLISHED',
                            // 同时收到握手包和后面的数据传输包会怎么处理？
                            cond: (context, event) => {
                                recvSegment = event.recvSegments[0];
                                return (
                                    checkRecvSegment(recvSegment) &&
                                    recvSegment.ACK == 1 &&
                                    recvSegment.SYN == 1
                                );
                            },
                            actions: (context, event) => {
                                // 消耗 event 中的第一个握手包
                                const recvSegment = event.recvSegments.shift(); // Can it modify the event outside?
                                context.AckNumber = recvSegment.sequenceNumber + 1;
                                context.outputSegments = [{
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 0,
                                    FIN: 0,
                                    data: ''
                                }]
                                increaseSequenceNumber(context);
                            }
                        },
                        RECV_SYN_SEND_SYN_ACK: {
                            target: 'SYN_RCVD'
                            // TODO: simultaneously open
                        }
                    }
                },
                LISTEN: {
                    on: {
                        // RECV_SYN_SEND_SYN_ACK
                        "*": {
                            target: 'SYN_RCVD',
                            cond: (context, event) => {
                                recvSegment = event.recvSegments[0];
                                return (
                                    checkRecvSegment(recvSegment) &&
                                    recvSegment.SYN == 1
                                );
                            },
                            actions: (context, event) => {
                                const recvSegment = event.recvSegments.shift(); // Can it modify the event outside?
                                context.AckNumber = recvSegment.sequenceNumber + 1;
                                context.outputSegments = [{
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 1,
                                    FIN: 0,
                                    data: ''
                                }]
                                increaseSequenceNumber(context);
                            }
                        },
                        SEND_SYN: {
                            target: 'SYN_SENT',
                            actions: (context, event) => {
                                context.outputSegment = {
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 1,
                                    FIN: 0,
                                    data: ''
                                }
                                increaseSequenceNumber(context);
                            }
                        }
                    }
                },
                SYN_RCVD: {
                    on: {
                        // RECV_ACK
                        "*": {
                            target: 'ESTABLISHED',
                            cond: (context, event) => {
                                recvSegment = event.recvSegments[0];
                                return (
                                    checkRecvSegment(recvSegment) &&
                                    recvSegment.ACK == 1
                                );
                            },
                        },
                        SEND_FIN: { target: 'FIN_WAIT_1' },
                        TIMEOUT_SEND_RST: { target: 'CLOSED' },
                        RECV_RST: { target: 'LISTEN' }
                    }
                },
                ESTABLISHED: {
                    // Data transfer state
                    on: {
                        // RECV_AND_SEND_ACK
                        "*": {
                            internal: true,
                            cond: (context, event) => {
                                for (const recvSegment of event.recvSegments) {
                                    if (checkRecvSegment(recvSegment, context) == false) {
                                        return false;
                                    }
                                }
                                return true;
                            },
                            actions: (context, event) => {
                                // save all segments
                                context.savedSegments.push(...event.recvSegments);
                            }
                        },
                        SEND_FIN: {
                            target: 'FIN_WAIT_1',
                            actions: (context, event) => {
                                context.outputSegment = {
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 0,
                                    FIN: 1,
                                    data: ''
                                }
                                increaseSequenceNumber(context);
                            }
                        }
                    }
                },
                FIN_WAIT_1: {
                    on: {
                        RECV_FIN_SEND_ACK: { target: 'CLOSING' },
                        // RECV_FIN_ACK_SEND_ACK
                        "*": {
                            target: 'TIME_WAIT',
                            cond: (context, event) => {
                                recvSegment = event.recvSegments[0];
                                return (
                                    checkRecvSegment(recvSegment) &&
                                    recvSegment.FIN == 1 &&
                                    recvSegment.AckNumber == context.sequenceNumber + 1
                                );
                            },
                            actions: (context, event) => {
                                const recvSegment = event.recvSegments.shift(); // Can it modify the event outside?
                                context.AckNumber = recvSegment.sequenceNumber + 1;
                                context.outputSegments = [{
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 0,
                                    FIN: 0,
                                    data: ''
                                }]
                                increaseSequenceNumber(context);
                            }
                        },
                        // RECV_ACK
                        "*": {
                            target: 'FIN_WAIT_2',
                            cond: (context, event) => {
                                recvSegment = event.recvSegments.shift();
                                return (
                                    checkRecvSegment(recvSegment) &&
                                    recvSegment.AckNumber == context.sequenceNumber + 1
                                );
                            },
                        }
                    }
                },
                FIN_WAIT_2: {
                    on: {
                        // RECV_FIN_SEND_ACK
                        "*": {
                            target: 'TIME_WAIT',
                            cond: (context, event) => {
                                recvSegment = event.recvSegments[0];
                                return (
                                    checkRecvSegment(recvSegment) &&
                                    recvSegment.FIN == 1
                                );
                            },
                            actions: (context, event) => {
                                const recvSegment = event.recvSegments.shift(); // Can it modify the event outside?
                                context.AckNumber = recvSegment.sequenceNumber + 1;
                                context.outputSegments = [{
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 0,
                                    FIN: 0,
                                    data: ''
                                }]
                                increaseSequenceNumber(context);
                            }
                        }
                    }
                },
                CLOSING: {
                    on: {
                        // simultaneously close
                        RECV_ACK: { target: "TIME_WAIT" }
                    }
                },
                TIME_WAIT: {
                    after: [
                        {
                            delay: (context, event) => {
                                return context.MSL * 2;
                            },
                            target: 'CLOSED'
                        }
                    ]
                }
            }
        },
        {
            actions: {

            }
        }
    )
}


export { createTCPStateMachine }