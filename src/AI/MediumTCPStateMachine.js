import { createMachine, assign } from 'xstate';

function getDataSizeInBytes(data) {
    return new Blob([data]).size;
}

/** 
 * Send segment by updating context
*/
const sendSegment = (context, data = "") => {
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
        RST: context.RST,
    }
    let newSequenceNumber = context.sequenceNumber;
    if (context.SYN === 1 || context.FIN === 1) {
        newSequenceNumber++;
    }
    newSequenceNumber += getDataSizeInBytes(data);
    outputSegment["data"] = data;
    context.sequenceNumber = newSequenceNumber;
    context.outputSegments.push(outputSegment);
}

/**
 * All recvSegments should pass this
 */
const TCPReceiverBaseGuard = (context, event, ACK = 1, SYN = 0, FIN = 0, RST = 0) => {
    if (!Object.prototype.hasOwnProperty.call(event, "recvSegments") || event.recvSegments.length === 0) {
        return false;
    }
    const recvSegment = event.recvSegments[0];
    if (
        !(recvSegment.ACK === ACK) ||
        !(recvSegment.sourcePort === context.destinationPort) ||
        !(recvSegment.destinationPort === context.sourcePort) ||
        !(recvSegment.SYN === SYN) ||
        !(recvSegment.FIN === FIN) ||
        !(recvSegment.RST === RST)
    ) {
        return false;
    }
    if (recvSegment.ACK === 1 && recvSegment.SYN === 0) {
        if (recvSegment.AckNumber !== context.sequenceNumber)
            return false;
        if (recvSegment.sequenceNumber !== context.AckNumber)
            return false;
    }
    if (recvSegment.SYN === 1 || recvSegment.FIN === 1) {
        context.AckNumber = recvSegment.sequenceNumber + 1;
    }
    else if (Object.prototype.hasOwnProperty.call(recvSegment, 'data')) {
        context.AckNumber = recvSegment.sequenceNumber + getDataSizeInBytes(recvSegment.data);
    }
    context.savedSegments.push(recvSegment);
    return true;
};

const autoRespond = (event) => {
    let respondData = "";
    switch (event.recvSegments[0].data.trim()) {
        case "What's your name?":
            respondData = "My name is Vint Bob";
            break;
        case "How can I contact you?":
            respondData = "Remember my port number is 3280, and I always send segments through your port 12345.";
            break;
        case "If I receive other segments, what should I do?":
            respondData = "You should act as normal and execute OS instructions.";
            break;
        default:
    }
    return respondData;
}

function createTCPStateMachine(sourcePort, destinationPort, initSequenceNumber, payload, MSL = 100, TIMEOUT = 30000) {
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
                outputSegments: [],
                savedSegments: [],
                MSL: MSL, // in ms
                ACK: 0,
                SYN: 0,
                FIN: 0,
                RST: 0,
                TIMEOUT: TIMEOUT
            },
            on: {
                // Except for SYN_RCVD, any time when receives a RST segment, transition to CLOSED. 
                RECV_SEGMENT: {
                    target: 'CLOSED',
                    cond: (context, event) => {
                        return (
                            event.recvSegments[0].RST === 1 &&
                            event.recvSegments[0].sourcePort === context.destinationPort &&
                            event.recvSegments[0].destinationPort === context.sourcePort
                        );
                    }
                }
            },
            states: {
                CLOSED: {
                    on: {
                        ACTIVE_OPEN: {
                            target: 'SYN_SENT',
                            actions: (context, event) => {
                                // send 1st handshake
                                Object.assign(context, { ACK: 0, SYN: 1, FIN: 0 });
                                sendSegment(context);
                            }
                        },
                        PASSIVE_OPEN: {
                            target: 'LISTEN'
                        }
                    },
                },
                SYN_SENT: {
                    after: [
                        {
                            // TIMEOUT
                            delay: (context, event) => {
                                return context.TIMEOUT;
                            },
                            target: 'CLOSED',
                        }
                    ],
                    on: {
                        // RECV_SYN_ACK_SEND_ACK
                        RECV_SEGMENT: {
                            target: 'ESTABLISHED',
                            cond: (context, event) => {
                                return TCPReceiverBaseGuard(context, event, 1, 1, 0, 0);
                                // event.recvSegments[0].AckNumber === context.sequenceNumber
                            },
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                sendSegment(context);
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
                                return TCPReceiverBaseGuard(context, event, 0, 1, 0, 0);
                            },
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 1, FIN: 0 });
                                sendSegment(context);
                            }
                        },
                        SEND_SYN: {
                            target: 'SYN_SENT',
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 0, SYN: 1, FIN: 0 });
                                sendSegment(context);
                            }
                        }
                    },
                },
                SYN_RCVD: {
                    after: [
                        {
                            // TIMEOUT_SEND_RST
                            delay: (context, event) => {
                                return context.TIMEOUT;
                            },
                            target: 'CLOSED',
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 0, SYN: 0, FIN: 0, RST: 1 });
                                sendSegment(context);
                            }
                        }
                    ],
                    on: {
                        RECV_SEGMENT: [
                            {
                                // RECV_ACK
                                target: 'ESTABLISHED',
                                cond: (context, event) => {
                                    return TCPReceiverBaseGuard(context, event, 1, 0, 0, 0);
                                }
                            },
                            {
                                // RECV_RST
                                target: 'LISTEN',
                                cond: (context, event) => {
                                    return event.recvSegments[0].RST === 1;
                                }
                            }
                        ],
                        SEND_FIN: {
                            target: 'FIN_WAIT_1',
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 1 });
                                sendSegment(context);
                            }
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
                                    return TCPReceiverBaseGuard(context, event, 1, 0, 0, 0);
                                },
                                actions: (context, event) => {
                                    // only reply ACK when receive data segment
                                    if (Object.prototype.hasOwnProperty.call(event.recvSegments[0], 'data')) {
                                        Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                        const data = autoRespond(event);
                                        sendSegment(context, data);
                                    }
                                },
                            },
                            {
                                // RECV_FIN
                                target: 'CLOSE_WAIT',
                                cond: (context, event) => {
                                    return TCPReceiverBaseGuard(context, event, 1, 0, 1, 0);
                                },
                                actions: (context, event) => {
                                    Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                    sendSegment(context);
                                },
                            }
                        ],
                        SEND_DATA: {
                            internal: true,
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                sendSegment(context, event.data);
                            }
                        },
                        SEND_FIN: {
                            target: 'FIN_WAIT_1',
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 1 });
                                sendSegment(context);
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
                                    return TCPReceiverBaseGuard(context, event, 1, 0, 1, 0);
                                },
                                actions: (context, event) => {
                                    Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                    sendSegment(context);
                                }
                            },
                            {
                                // RECV_ACK
                                target: 'FIN_WAIT_2',
                                cond: (context, event) => {
                                    return TCPReceiverBaseGuard(context, event, 1, 0, 0, 0);
                                    // event.recvSegments[0].AckNumber === context.sequenceNumber
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
                        RECV_SEGMENT: [
                            {
                                target: 'TIME_WAIT',
                                cond: (context, event) => {
                                    return TCPReceiverBaseGuard(context, event, 1, 0, 1, 0);
                                },
                                actions: (context, event) => {
                                    Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                    sendSegment(context);
                                }
                            },
                            {
                                // Wait the other side to send the rest data
                                internal: true,
                                cond: (context, event) => {
                                    return TCPReceiverBaseGuard(context, event, 1, 0, 0, 0);
                                },
                                actions: (context, event) => {
                                    Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                    sendSegment(context);
                                }
                            }
                        ]
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
                                sendSegment(context);
                            }
                        },
                        SEND_DATA: {
                            internal: true,
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                sendSegment(context, event.data);
                            }
                        },
                        RECV_SEGMENT: {
                            // Only receive ACK segments
                            internal: true,
                            cond: (context, event) => {
                                return TCPReceiverBaseGuard(context, event, 1, 0, 0, 0);
                            }
                        }
                    }
                },
                LAST_ACK: {
                    on: {
                        RECV_SEGMENT: {
                            target: 'CLOSED',
                            cond: (context, event) => {
                                return TCPReceiverBaseGuard(context, event, 1, 0, 0, 0);
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
            }
        }
    );
}


export {
    createTCPStateMachine,
    getDataSizeInBytes
}