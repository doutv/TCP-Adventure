import { createMachine } from 'xstate';

function getDataSizeInBytes(data) {
    return new Blob([data]).size;
}

function increaseSequenceNumber(context) {
    if (context.outputSegment.SYN === 1 || context.outputSegment.FIN === 1) {
        context.sequenceNumber++;
    }
    else if (context.outputSegment.hasOwnProperty('data')) {
        context.sequenceNumber += getDataSizeInBytes(context.outputSegment.data);
    }
}

function checkRecvSegment(context, recvSegment) {
    return (
        recvSegment.ACK === 1 &&
        recvSegment.sourcePort === context.destinationPort &&
        recvSegment.destinationPort === context.sourcePort
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
                windowSize: 1,
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
                                }
                                increaseSequenceNumber(context);
                            }
                        },
                        PASSIVE_OPEN: {
                            target: 'LISTEN'
                        }
                    },
                    // meta: {
                    //     test:
                    // }
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
                            // TODO: 同时收到握手包和后面的数据传输包会怎么处理？
                            cond: (context, event) => {
                                // receive 2nd handshake segment
                                const recvSegment = event.recvSegments[0];
                                return (
                                    checkRecvSegment(context, recvSegment) &&
                                    recvSegment.SYN === 1 &&
                                    recvSegment.AckNumber === context.sequenceNumber
                                );
                            },
                            actions: (context, event) => {
                                // Send 3rd handshake segment
                                const recvSegment = event.recvSegments.shift(); // Can it modify the event outside? YES!
                                context.AckNumber = recvSegment.sequenceNumber + 1;
                                context.outputSegment = {
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 0,
                                    FIN: 0,
                                };
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
                                    checkRecvSegment(context, recvSegment) &&
                                    recvSegment.SYN === 1
                                );
                            },
                            actions: (context, event) => {
                                const recvSegment = event.recvSegments.shift(); // Can it modify the event outside?
                                context.AckNumber = recvSegment.sequenceNumber + 1;
                                context.outputSegment = {
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 1,
                                    FIN: 0,
                                };
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
                                    checkRecvSegment(context, recvSegment) &&
                                    recvSegment.ACK === 1
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
                        // receive data
                        "*": {
                            internal: true,
                            cond: (context, event) => {
                                const recvSegment = event.recvSegments[0];
                                return checkRecvSegment(context, recvSegment);
                            },
                            actions: (context, event) => {
                                const recvSegment = event.recvSegments.shift();
                                // This segment is already saved
                                if (recvSegment.sequenceNumber < context.AckNumber)
                                    return;
                                context.AckNumber = recvSegment.sequenceNumber + getDataSizeInBytes(recvSegment.data);
                                context.savedSegments.push(recvSegment); // save segment
                                // The last segment sent by AI is lost, resend the last segment
                                // by outside application layer
                                if (recvSegment.AckNumber < context.sequenceNumber)
                                    return;  // resend
                            }
                        },
                        "SEND_DATA": {
                            internal: true,
                            actions: (context, event) => {
                                context.outputSegment = {
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 0,
                                    FIN: 0,
                                    data: event.data
                                };
                                increaseSequenceNumber(context);
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
                                }
                                increaseSequenceNumber(context);
                            }
                        }
                    }
                },
                FIN_WAIT_1: {
                    on: {
                        RECV_FIN_SEND_ACK: {
                            // simultaneous close
                            target: 'CLOSING'
                        },
                        // RECV_FIN_ACK_SEND_ACK
                        "*": {
                            target: 'TIME_WAIT',
                            cond: (context, event) => {
                                const recvSegment = event.recvSegments[0];
                                return (
                                    checkRecvSegment(context, recvSegment) &&
                                    recvSegment.FIN === 1 &&
                                    recvSegment.AckNumber === context.sequenceNumber
                                );
                            },
                            actions: (context, event) => {
                                const recvSegment = event.recvSegments.shift(); // Can it modify the event outside?
                                context.AckNumber = recvSegment.sequenceNumber + 1;
                                context.outputSegment = {
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 0,
                                    FIN: 0,
                                };
                                increaseSequenceNumber(context);
                            }
                        },
                        // RECV_ACK
                        "RECV_ACK": {
                            target: 'FIN_WAIT_2',
                            cond: (context, event) => {
                                const recvSegment = event.recvSegments.shift();
                                return (
                                    checkRecvSegment(context, recvSegment) &&
                                    recvSegment.AckNumber === context.sequenceNumber
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
                                const recvSegment = event.recvSegments[0];
                                return (
                                    checkRecvSegment(context, recvSegment) &&
                                    recvSegment.FIN === 1
                                );
                            },
                            actions: (context, event) => {
                                const recvSegment = event.recvSegments.shift(); // Can it modify the event outside?
                                context.AckNumber = recvSegment.sequenceNumber + 1;
                                context.outputSegment = {
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.AckNumber,
                                    ACK: 1,
                                    SYN: 0,
                                    FIN: 0,
                                };
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
    );
}


export {
    createTCPStateMachine,
    getDataSizeInBytes
}