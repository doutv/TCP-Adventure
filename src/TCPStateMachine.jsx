const createTCPStateMachine = (initSequenceNumber) => {
    createMachine(
        {
            id: 'TCPMachine',
            initial: 'CLOSED',
            context: {
                sourcePort: 3280,
                destinationPort: 12345,
                sequenceNumber: initSequenceNumber,
                windowSize: 666666,
                ackNo: 0,
                payload: '',
                outstandingSegments: [],
                outputSegments: [],
                MSL: 10000 // 10s
            },
            states: {
                CLOSED: {
                    on: {
                        ACTIVE_OPEN: {
                            // directly call
                            target: 'SYN_SENT',
                            actions: (context, event) => {
                                context.outputSegments = [{
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.ackNo,
                                    ACK: 0,
                                    SYN: 1,
                                    FIN: 0,
                                }]
                            }
                        },
                        PASSIVE_OPEN: {
                            target: 'LISTEN'
                        }
                    }
                },
                SYN_SENT: {
                    after: {
                        30000: { target: 'CLOSED' } // TIMEOUT
                    },
                    on: {
                        TIMEOUT: {
                            target: 'CLOSED'
                        },
                        RECV_SYN_ACK_SEND_ACK: {
                            target: 'ESTABLISHED',
                            cond: (context, event) => {
                                // TODO: 同时收到握手包和后面的数据传输包会怎么处理？
                                handshakeSegment = event.recvSegments[0];
                                return checkRecvSegment(handshakeSegment) &&
                                    handshakeSegment.ACK == 1 &&
                                    handshakeSegment.SYN == 1
                            },
                            actions: (context, event) => {
                                context.outputSegments = [{
                                    sourcePort: context.sourcePort,
                                    destinationPort: context.destinationPort,
                                    sequenceNumber: context.sequenceNumber,
                                    windowSize: context.windowSize,
                                    AckNumber: context.ackNo,
                                    ACK: 1,
                                    SYN: 0,
                                    FIN: 0,
                                }]
                            }
                        }
                    }
                },
                LISTEN: {
                    on: {
                        RECV_SYN_SEND_SYN_ACK: { target: 'SYN_RCVD' },
                        SEND_SYN: { target: 'SYN_SENT' }
                    }
                },
                SYN_RCVD: {
                    on: {
                        RECV_ACK: { target: 'ESTABLISHED' },
                        SEND_FIN: { target: 'FIN_WAIT_1' },
                        TIMEOUT_SEND_RST: { target: 'CLOSED' },
                        RECV_RST: { target: 'LISTEN' }
                    }
                },
                ESTABLISHED: {
                    on: {
                        SEND_FIN: { target: 'FIN_WAIT_1' }
                    }
                },
                FIN_WAIT_1: {
                    on: {
                        RECV_FIN_SEND_ACK: { target: 'CLOSING' },
                        RECV_FIN_ACK_SEND_ACK: { target: 'TIME_WAIT' },
                        RECV_ACK: { target: 'FIN_WAIT_2' }
                    }
                },
                FIN_WAIT_2: {
                    on: {
                        RECV_FIN_SEND_ACK: { target: 'TIME_WAIT' }
                    }
                },
                CLOSING: {
                    on: {
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
                // action implementations
                sendFirstHandshake: (context, event) => {
                    console.log('activating...');
                },
                notifyActive: (context, event) => {
                    console.log('active!');
                },
                notifyInactive: (context, event) => {
                    console.log('inactive!');
                },
                sendTelemetry: (context, event) => {
                    console.log('time:', Date.now());
                }
            }
        }
    )
}