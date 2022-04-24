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
        RST: context.RST,
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
const TCPReceiverBaseGuard = (context, event, ACK = 1, SYN = 0, FIN = 0, RST = 0) => {
    if (!event.hasOwnProperty("recvSegments") || event.recvSegments.length === 0) {
        return false;
    }
    // TODO: resend
    // if (recvSegment.AckNumber < context.sequenceNumber)
    //     return;  
    const recvSegment = event.recvSegments[0];
    if (
        !(recvSegment.ACK === ACK) ||
        !(recvSegment.sourcePort === context.destinationPort) ||
        !(recvSegment.destinationPort === context.sourcePort) ||
        !(recvSegment.sequenceNumber >= context.AckNumber) ||
        !(recvSegment.SYN === SYN) ||
        !(recvSegment.FIN === FIN) ||
        !(recvSegment.RST === RST)
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
                outputSegment: {},
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
                                return TCPReceiverBaseGuard(context, event, 1, 1, 0, 0);
                                // event.recvSegments[0].AckNumber === context.sequenceNumber
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
                                return TCPReceiverBaseGuard(context, event, 0, 1, 0, 0);
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
                    after: [{
                        // TIMEOUT_SEND_RST
                        delay: (context, event) => {
                            return context.TIMEOUT;
                        },
                        target: 'CLOSED',
                        actions: (context, event) => {
                            Object.assign(context, { ACK: 0, SYN: 0, FIN: 0, RST: 1 });
                            sendSegment(context, event);
                        }
                    }],
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
                                sendSegment(context, event);
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
                                    if (event.recvSegments[0].hasOwnProperty("data")) {
                                        Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                        sendSegment(context, event);
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
                                    return TCPReceiverBaseGuard(context, event, 1, 0, 1, 0);
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
                                    sendSegment(context, event);
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
                                    sendSegment(context, event);
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
                                sendSegment(context, event);
                            }
                        },
                        SEND_DATA: {
                            internal: true,
                            actions: (context, event) => {
                                Object.assign(context, { ACK: 1, SYN: 0, FIN: 0 });
                                sendSegment(context, event);
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