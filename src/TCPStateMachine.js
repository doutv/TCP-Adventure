import { createMachine, assign } from 'xstate';

function getDataSizeInBytes(data) {
    return new Blob([data]).size;
}

function checkRecvSegment(context, recvSegment) {
    return (
        recvSegment.ACK === 1 &&
        recvSegment.sourcePort === context.destinationPort &&
        recvSegment.destinationPort === context.sourcePort
    );
}

const TCPReceiverBaseGuard = (context, event) => {
    // All recvSegments should pass this
    if (!event.hasOwnProperty("recvSegments") || event.recvSegments.length === 0) {
        return false;
    }
    const recvSegment = event.recvSegments[0];
    if (
        !(recvSegment.ACK === 1) ||
        !(recvSegment.sourcePort === context.destinationPort) ||
        !(recvSegment.destinationPort === context.sourcePort) ||
        !(recvSegment.sequenceNumber >= context.AckNumber)
    ) {
        return false;
    }
    if (recvSegment.SYN === 1 || recvSegment.FIN === 1) {
        context.AckNumber = recvSegment.sequenceNumber + 1;
    }
    else if (recvSegment.hasOwnProperty('data')) {
        context.AckNumber = recvSegment.sequenceNumber + getDataSizeInBytes(recvSegment.data);
    }
    return true;
};

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
                MSL: 10000, // 10s
                ACK: 0,
                SYN: 0,
                FIN: 0
            },
            states: {
                CLOSED: {
                    exit: assign({ ACK: 0, SYN: 1, FIN: 0 }),
                    on: {
                        ACTIVE_OPEN: {
                            target: 'SYN_SENT',
                            actions: 'generateOutputSegment'
                        },
                        PASSIVE_OPEN: {
                            target: 'LISTEN'
                        }
                    },
                },
                SYN_SENT: {
                    after: {
                        // TIMEOUT
                        30000: {
                            target: 'CLOSED'
                        }
                    },
                    exit: assign({ ACK: 1, SYN: 0, FIN: 0 }),
                    on: {
                        // RECV_SYN_ACK_SEND_ACK
                        RECV_SEGMENT: {
                            target: 'ESTABLISHED',
                            cond: (context, event) => {
                                if (!TCPReceiverBaseGuard(context, event)) {
                                    return false;
                                }
                                const recvSegment = event.recvSegments[0];
                                return (
                                    recvSegment.SYN === 1 &&
                                    recvSegment.AckNumber === context.sequenceNumber
                                );
                            },
                            actions: 'generateOutputSegment',
                        },
                        RECV_SYN_SEND_SYN_ACK: {
                            target: 'SYN_RCVD'
                            // TODO: simultaneously open
                        }
                    }
                },
                LISTEN: {
                    // TODO
                    exit: assign({ ACK: 1, SYN: 1, FIN: 0 }),
                    on: {
                        // RECV_SYN_SEND_SYN_ACK
                        RECV_SEGMENT: {
                            target: 'SYN_RCVD',
                            cond: (context, event) => {
                                if (!event.hasOwnProperty("recvSegments") || event.recvSegments.length === 0) {
                                    return false;
                                }
                                recvSegment = event.recvSegments[0];
                                if (
                                    checkRecvSegment(context, recvSegment) &&
                                    recvSegment.SYN === 1
                                ) {
                                    const recvSegment = event.recvSegments.shift();
                                    context.AckNumber = recvSegment.sequenceNumber + 1;
                                    return true;
                                }
                                return false;
                            },
                            actions: 'generateOutputSegment',
                        },
                        SEND_SYN: {
                            target: 'SYN_SENT',
                            actions: 'generateOutputSegment',
                        }
                    }
                },
                SYN_RCVD: {
                    // TODO
                    on: {
                        // RECV_ACK
                        RECV_SEGMENT: {
                            target: 'ESTABLISHED',
                            cond: (context, event) => {
                                if (!event.hasOwnProperty("recvSegments") || event.recvSegments.length === 0) {
                                    return false;
                                }
                                recvSegment = event.recvSegments[0];
                                return (
                                    checkRecvSegment(context, recvSegment)
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
                    entry: assign({ ACK: 1, SYN: 0, FIN: 0 }),
                    exit: assign({ ACK: 1, SYN: 0, FIN: 1 }),
                    on: {
                        // receive data
                        RECV_SEGMENT: {
                            internal: true,
                            cond: (context, event) => {
                                return TCPReceiverBaseGuard(context, event);
                            },
                            actions: (context, event) => {
                                const recvSegment = event.recvSegments[0];
                                context.savedSegments.push(recvSegment); // save segment
                                // The last segment sent by AI is lost, resend the last segment
                                // by outside application layer
                                if (recvSegment.AckNumber < context.sequenceNumber)
                                    return;  // resend
                            }
                        },
                        SEND_DATA: {
                            internal: true,
                            actions: 'generateOutputSegment'
                        },
                        SEND_FIN: {
                            target: 'FIN_WAIT_1',
                            actions: 'generateOutputSegment' // assign({ ACK: 1, SYN: 0, FIN: 1 })
                        }
                    }
                },
                FIN_WAIT_1: {
                    exit: assign({ ACK: 1, SYN: 0, FIN: 0 }),
                    on: {
                        RECV_FIN_SEND_ACK: {
                            // TODO: simultaneous close
                            target: 'CLOSING'
                        },
                        // RECV_FIN_ACK_SEND_ACK
                        RECV_SEGMENT: {
                            target: 'TIME_WAIT',
                            cond: (context, event) => {
                                if (!TCPReceiverBaseGuard(context, event)) {
                                    return false;
                                }
                                const recvSegment = event.recvSegments[0];
                                return (
                                    recvSegment.FIN === 1 &&
                                    recvSegment.AckNumber === context.sequenceNumber
                                );
                            },
                            actions: 'generateOutputSegment'
                        },
                        // TODO: RECV_ACK
                        RECV_ACK: {
                            target: 'FIN_WAIT_2',
                            cond: (context, event) => {
                                if (!event.hasOwnProperty("recvSegments") || event.recvSegments.length === 0) {
                                    return false;
                                }
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
                    exit: assign({ ACK: 1, SYN: 0, FIN: 0 }),
                    on: {
                        // RECV_FIN_SEND_ACK
                        RECV_SEGMENT: {
                            target: 'TIME_WAIT',
                            cond: (context, event) => {
                                if (!event.hasOwnProperty("recvSegments") || event.recvSegments.length === 0) {
                                    return false;
                                }
                                const recvSegment = event.recvSegments[0];
                                if (
                                    checkRecvSegment(context, recvSegment) &&
                                    recvSegment.FIN === 1
                                ) {
                                    event.recvSegments.shift(); // Can it modify the event outside?
                                    context.AckNumber = recvSegment.sequenceNumber + 1;
                                    return true;
                                }
                                return false;
                            },
                            actions: 'generateOutputSegment'
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
            },
        },
        {
            actions: {
                generateOutputSegment: assign((context, event) => {
                    const oldSequenceNumber = context.sequenceNumber;
                    let outputSegment = {
                        sourcePort: context.sourcePort,
                        destinationPort: context.destinationPort,
                        sequenceNumber: oldSequenceNumber,
                        windowSize: context.windowSize,
                        AckNumber: context.AckNumber,
                        ACK: context.ACK,
                        SYN: context.SYN,
                        FIN: context.FIN,
                    }
                    let newSequenceNumber = context.sequenceNumber;
                    if (context.SYN === 1 || context.FIN === 1) {
                        newSequenceNumber++;
                    }
                    else if (event.hasOwnProperty('data')) {
                        newSequenceNumber += getDataSizeInBytes(event.data);
                        outputSegment["data"] = event.data;
                    }
                    return {
                        ...context,
                        sequenceNumber: newSequenceNumber,
                        outputSegment: outputSegment
                    }
                })
            },
            guards: {
                recvSYN: (context, event) => {
                    if (!TCPReceiverBaseGuard(context, event)) {
                        return false;
                    }
                    const recvSegment = event.recvSegments[0];
                    return (
                        recvSegment.SYN === 1 &&
                        recvSegment.AckNumber === context.sequenceNumber
                    );
                }
            }
        }
    );
}


export {
    createTCPStateMachine,
    getDataSizeInBytes
}