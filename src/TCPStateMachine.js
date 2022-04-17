import { createMachine, assign } from 'xstate';

function getDataSizeInBytes(data) {
    return new Blob([data]).size;
}

/** 
 * Send segment by updating context
*/
const sendSegment = (context, event) => {
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
    context["sequenceNumber"] = newSequenceNumber;
    context["outputSegment"] = outputSegment;
}

/**
 * All recvSegments should pass this
 */
const TCPReceiverBaseGuard = (context, event) => {
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
    context.savedSegments.push(recvSegment); // save segment
    return true;
};

function createTCPStateMachine(sourcePort, destinationPort, initSequenceNumber, payload) {
    return createMachine(
        {
            id: 'TCPMachine',
            initial: 'CLOSED',
            context: {
                sourcePort: sourcePort,
                destinationPort: destinationPort,
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
                    on: {
                        ACTIVE_OPEN: {
                            target: 'SYN_SENT',
                            actions: (context, event) => {
                                // send 1st handshake
                                Object.assign(context, { ACK: 0, SYN: 1, FIN: 0 });
                                sendSegment(context, event);
                                context.outputSegment.AckNumber = 0;
                            }
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
                    on: {
                        // RECV_SYN_ACK_SEND_ACK
                        RECV_SEGMENT: {
                            target: 'ESTABLISHED',
                            cond: (context, event) => {
                                return (
                                    TCPReceiverBaseGuard(context, event) &&
                                    event.recvSegments[0].SYN === 1 &&
                                    event.recvSegments[0].AckNumber === context.sequenceNumber
                                );
                            },
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                sendSegment(context, event);
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
                        RECV_SEGMENT: {
                            target: 'SYN_RCVD',
                            cond: (context, event) => {
                                // Attention: the first handshake with ACK = 0
                                const recvSegment = event.recvSegments[0];
                                if (
                                    recvSegment.ACK === 0 &&
                                    recvSegment.SYN === 1 &&
                                    recvSegment.sourcePort === context.destinationPort &&
                                    recvSegment.destinationPort === context.sourcePort
                                ) {
                                    context.AckNumber = recvSegment.sequenceNumber + 1;
                                    return true;
                                }
                                return false;
                            },
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 1, FIN: 0 });
                                sendSegment(context, event);
                            }
                        },
                        SEND_SYN: {
                            target: 'SYN_SENT',
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 0, SYN: 1, FIN: 0 });
                                sendSegment(context, event);
                            }
                        }
                    },
                },
                SYN_RCVD: {
                    // after: {
                    //     // TODO
                    //     // TIMEOUT_SEND_RST
                    //     30000: {
                    //         target: 'CLOSED',
                    //         actions: (context, event) => {
                    //             Object.assign(context,{ ACK: 0, SYN: 0, FIN: 0, RST: 1 });
                    //             generateOutputSegment(context, event);
                    //         }
                    //     }
                    // },
                    on: {
                        RECV_SEGMENT: [
                            {
                                // RECV_ACK
                                target: 'ESTABLISHED',
                                cond: (context, event) => {
                                    return TCPReceiverBaseGuard(context, event);
                                }
                            },
                            {
                                // RECV_RST
                                target: 'CLOSED',
                                cond: (context, event) => {
                                    return (
                                        TCPReceiverBaseGuard(context, event) &&
                                        event.recvSegments[0].RST === 1
                                    );
                                }
                            }
                        ],
                        SEND_FIN: {
                            target: 'FIN_WAIT_1',
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 1 });
                                sendSegment(context, event);
                            }
                        },
                        RECV_RST: {
                            // TODO
                            target: 'LISTEN'
                        }
                    }
                },
                ESTABLISHED: {
                    // Data transfer state
                    on: {
                        // receive data
                        RECV_SEGMENT: [
                            {
                                internal: true,
                                cond: (context, event) => {
                                    return TCPReceiverBaseGuard(context, event);
                                },
                                actions: (context, event) => {
                                    const recvSegment = event.recvSegments[0];
                                    // The last segment sent by AI is lost, resend the last segment
                                    // by outside application layer
                                    if (recvSegment.AckNumber < context.sequenceNumber)
                                        return;  // TODO: resend
                                },
                            },
                            {
                                // RECV_FIN
                                target: 'CLOSE_WAIT',
                                cond: (context, event) => {
                                    return (
                                        TCPReceiverBaseGuard(context, event) &&
                                        event.recvSegments[0].FIN === 1
                                    );
                                },
                                actions: (context, event) => {
                                    Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                    sendSegment(context, event);
                                },
                            }
                        ],
                        SEND_DATA: {
                            internal: true,
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                sendSegment(context, event);
                            }
                        },
                        SEND_FIN: {
                            target: 'FIN_WAIT_1',
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 1 });
                                sendSegment(context, event);
                            }
                        },
                    }
                },
                FIN_WAIT_1: {
                    on: {

                        RECV_SEGMENT: [
                            {
                                target: 'TIME_WAIT',
                                cond: (context, event) => {
                                    return (
                                        TCPReceiverBaseGuard(context, event) &&
                                        event.recvSegments[0].FIN === 1 &&
                                        event.recvSegments[0].AckNumber === context.sequenceNumber
                                    );
                                },
                                actions: (context, event) => {
                                    Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                    sendSegment(context, event);
                                }
                            },
                            {
                                // RECV_ACK
                                target: 'FIN_WAIT_2',
                                cond: (context, event) => {
                                    return (
                                        TCPReceiverBaseGuard(context, event) &&
                                        event.recvSegments[0].AckNumber === context.sequenceNumber
                                    );
                                },
                            },
                            /*
                            {
                                // RECV_FIN_SEND_ACK
                                // TODO: simultaneous close
                                target: 'CLOSING'
                            }
                            */
                        ],
                    },
                },
                FIN_WAIT_2: {
                    on: {
                        // RECV_FIN_SEND_ACK
                        RECV_SEGMENT: {
                            target: 'TIME_WAIT',
                            cond: (context, event) => {
                                return (
                                    TCPReceiverBaseGuard(context, recvSegment) &&
                                    event.recvSegments[0].FIN === 1
                                );
                            },
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                sendSegment(context, event);
                            }
                        }
                    }
                },
                CLOSING: {
                    on: {
                        // TODO: simultaneously close
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
                },
                CLOSE_WAIT: {
                    on: {
                        SEND_FIN: {
                            target: 'LAST_ACK',
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 1 });
                                sendSegment(context, event);
                            }
                        },
                    }
                },
                LAST_ACK: {
                    on: {
                        RECV_SEGMENT: {
                            target: 'CLOSED',
                            cond: (context, event) => {
                                return TCPReceiverBaseGuard(context, event);
                            }
                        }
                    }
                }
            },
        },
        {
            actions: {

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