import { createTCPStateMachine, getDataSizeInBytes } from './TCPStateMachine';
import { interpret } from 'xstate';
import { createModel } from '@xstate/test';

const prettyPrintState = (state) => {
    console.log({
        "state": state.value,
        "sourcePort": state.context["sourcePort"],
        "destinationPort": state.context["destinationPort"],
        "sequenceNumber": state.context["sequenceNumber"],
        "AckNumber": state.context["AckNumber"],
        "outputSegment": state.context["outputSegment"],
        "lastSavedSegment": state.context["savedSegments"][state.context["savedSegments"].length - 1]
    }
    );
}

it('Two Machines talking to each other', async () => {
    const MSL = 100;
    const AIMachine = createTCPStateMachine(3280, 12345, 100, "", MSL);
    const playerMachine = createTCPStateMachine(12345, 3280, 10000, "", MSL);
    const AIService = interpret(AIMachine).onTransition((state) => {
        prettyPrintState(state);
    });
    const playerService = interpret(playerMachine).onTransition((state) => {
        prettyPrintState(state);
    });
    const getOutputSegment = (service) => { return service.getSnapshot().context.outputSegment; }
    const getLastSavedSegment = (service) => { return service.getSnapshot().context.savedSegments[service.getSnapshot().context.savedSegments.length - 1]; }
    AIService.start();
    playerService.start();

    // Player send 1st handshake
    playerService.send({ type: 'ACTIVE_OPEN' });
    expect(playerService.getSnapshot().value).toBe("SYN_SENT");
    AIService.send({ type: 'PASSIVE_OPEN' });
    expect(AIService.getSnapshot().value).toBe("LISTEN");
    // AI get 1st handshake and send 2nd handshake
    AIService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(playerService)]
    });
    expect(AIService.getSnapshot().value).toBe("SYN_RCVD");
    // Player get 2nd handshake and send 3rd handshake
    playerService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(AIService)]
    });
    AIService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(playerService)]
    });
    expect(AIService.getSnapshot().value).toBe('ESTABLISHED');
    expect(playerService.getSnapshot().value).toBe('ESTABLISHED');

    // ------------ Connection ESTABLISHED ---------------------
    // Round 1: player -> AI
    playerService.send({
        type: 'SEND_DATA',
        data: "Hello AI!"
    });
    AIService.send({
        type: "RECV_SEGMENT",
        recvSegments: [getOutputSegment(playerService)]
    });
    expect(getLastSavedSegment(AIService))
        .toEqual(getOutputSegment(playerService));
    // AI ---ACK---> player
    playerService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(AIService)]
    });
    expect(getLastSavedSegment(playerService))
        .toEqual(getOutputSegment(AIService));

    // Round 2: AI -> player
    AIService.send({
        type: 'SEND_DATA',
        data: "Hello Player!"
    });
    playerService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(AIService)]
    });
    expect(getLastSavedSegment(playerService))
        .toEqual(getOutputSegment(AIService));
    // player ---ACK---> AI
    AIService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(playerService)]
    });
    expect(getLastSavedSegment(AIService))
        .toEqual(getOutputSegment(playerService));

    // AI send an old segment to player
    const oldAISend = Object.assign({}, getOutputSegment(AIService)); // shallow copy
    oldAISend.data = "Old data, should not be saved";
    const lastPlayerOutput = Object.assign({}, getOutputSegment(playerService));
    playerService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [oldAISend]
    });
    expect(getLastSavedSegment(playerService)).not.toEqual(oldAISend);
    // player should not respond to this old segment
    expect(getOutputSegment(playerService)).toEqual(lastPlayerOutput);

    // Connection termination 4-way handshake
    // player send FIN
    playerService.send({
        type: 'SEND_FIN'
    });
    expect(playerService.getSnapshot().value).toBe("FIN_WAIT_1");
    // AI receive FIN and send ACK
    AIService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(playerService)]
    });
    expect(AIService.getSnapshot().value).toBe("CLOSE_WAIT");
    // player receive ACK
    playerService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(AIService)]
    });
    expect(playerService.getSnapshot().value).toBe("FIN_WAIT_2");

    // AI continue to send data
    AIService.send({
        type: 'SEND_DATA',
        data: "I want to say:"
    });
    playerService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(AIService)]
    });
    expect(getLastSavedSegment(playerService))
        .toEqual(getOutputSegment(AIService));
    AIService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(playerService)]
    });
    expect(getLastSavedSegment(AIService)).toEqual(getOutputSegment(playerService));

    AIService.send({
        type: 'SEND_DATA',
        data: "See you next time~"
    });
    playerService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(AIService)]
    });
    expect(getLastSavedSegment(playerService))
        .toEqual(getOutputSegment(AIService));
    AIService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(playerService)]
    });
    expect(getLastSavedSegment(AIService)).toEqual(getOutputSegment(playerService));

    // AI send FIN
    AIService.send({
        type: 'SEND_FIN'
    });
    expect(AIService.getSnapshot().value).toBe("LAST_ACK");
    // player send ACK
    playerService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(AIService)]
    });
    // AI receive ACK
    AIService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(playerService)]
    });
    expect(AIService.getSnapshot().value).toBe("CLOSED");
    // player wait 2MSL from TIME_WAIT to CLOSED
    expect(playerService.getSnapshot().value).toBe('TIME_WAIT');
    await new Promise(r => setTimeout(r, 2 * MSL));
    expect(playerService.getSnapshot().value).toBe("CLOSED");
});

/*
describe('model-based testing', () => {
    const testModel = createModel(AIMachine).withEvents({
        ACTIVE_OPEN: {
            exec: (playerService) => {
                playerService.send({ 'type': 'PASSIVE_OPEN' });
            }
        },
        PASSIVE_OPEN: {
            exec: (playerService) => {
                playerService.send({ 'type': 'ACTIVE_OPEN' });
            }
        },
        RECV_SEGMENT: {
            exec: (playerService) => {
                playerService.send({ 'type': 'SEND_SYN' });
            }
        }
    });
    const testPlans = testModel.getShortestPathPlans({
        filter: (state) => {
            // console.log(state.value);
            return state.context.SYN == 1;
        }
    });
    testPlans.forEach((plan) => {
        describe(plan.description, () => {
            plan.paths.forEach((path) => {
                it(path.description, async () => {
                    const playerMachine = createTCPStateMachine(0, "");
                    const playerService = interpret(playerMachine).onTransition((state) => {
                        if (state.matches('ESTABLISHED')) {
                            done();
                        }
                    });
                    await path.test(playerService);
                });
            });
        });
    });

    // it('should have full coverage', () => {
    //     return testModel.testCoverage();
    // });
});
*/

// BDD behavior-driven development
it('Easy Level', (done) => {
    const MSL = 100;
    const AIMachine = createTCPStateMachine(3280, 12345, 100, "", MSL);
    const service = interpret(AIMachine).onTransition((state) => {
        // this is where you expect the state to eventually
        // be reached
        console.log(state.value, state.context);
        if (state.matches('CLOSED')) {
            done();
        }
    });

    service.start();
    const playerPort = service.machine.context.destinationPort;
    const AIPort = service.machine.context.sourcePort;
    let playerSequenceNumber = 0;
    let windowSize = service.machine.context.windowSize;
    let AISequenceNumber = service.machine.context.sequenceNumber;

    // AI send 1st handshake segment
    service.send({ type: 'ACTIVE_OPEN' });
    expect(service.getSnapshot().context.outputSegment).toEqual({
        sourcePort: AIPort,
        destinationPort: playerPort,
        sequenceNumber: AISequenceNumber++,
        windowSize: windowSize,
        AckNumber: 0,
        ACK: 0,
        SYN: 1,
        FIN: 0,
        RST: 0,
    });

    // Player send 2nd handshake segment
    let event = {
        type: 'RECV_SEGMENT',
        recvSegments: [{
            sourcePort: playerPort,
            destinationPort: AIPort,
            sequenceNumber: playerSequenceNumber++,
            windowSize: windowSize,
            AckNumber: AISequenceNumber,
            ACK: 1,
            SYN: 1,
            FIN: 0,
            RST: 0,
        }]
    };
    service.send(event);

    // AI send 3rd handshake segment
    expect(service.getSnapshot().context.outputSegment).toEqual({
        sourcePort: AIPort,
        destinationPort: playerPort,
        sequenceNumber: AISequenceNumber,
        windowSize: windowSize,
        AckNumber: playerSequenceNumber,
        ACK: 1,
        SYN: 0,
        FIN: 0,
        RST: 0,
    });

    // Player send a message to AI
    const message = {
        sourcePort: playerPort,
        destinationPort: AIPort,
        sequenceNumber: playerSequenceNumber,
        windowSize: windowSize,
        AckNumber: AISequenceNumber,
        ACK: 1,
        SYN: 0,
        FIN: 0,
        RST: 0,
        data: "Hello AI!"
    };
    playerSequenceNumber += getDataSizeInBytes(message.data);
    service.send({
        type: 'RECV_SEGMENT',
        recvSegments: [message]
    });
    expect(service.machine.context.savedSegments[service.getSnapshot().context.savedSegments.length - 1])
        .toEqual(message);

    // AI send a message to player
    const data = "Hello Player!";
    service.send({
        type: 'SEND_DATA',
        data: data
    })
    expect(service.getSnapshot().context.outputSegment).toEqual({
        sourcePort: AIPort,
        destinationPort: playerPort,
        sequenceNumber: AISequenceNumber,
        windowSize: windowSize,
        AckNumber: playerSequenceNumber,
        ACK: 1,
        SYN: 0,
        FIN: 0,
        RST: 0,
        data: data
    })
    AISequenceNumber += getDataSizeInBytes(data);

    // AI send 1st terminal handshake
    service.send({ type: 'SEND_FIN' });
    expect(service.getSnapshot().value).toBe('FIN_WAIT_1');
    expect(service.getSnapshot().context.outputSegment).toEqual({
        sourcePort: AIPort,
        destinationPort: playerPort,
        sequenceNumber: AISequenceNumber++,
        windowSize: windowSize,
        AckNumber: playerSequenceNumber,
        ACK: 1,
        SYN: 0,
        FIN: 1,
        RST: 0,
    })

    // ignore 2nd terminal handshake
    // Player send 3rd terminal handshake
    service.send({
        type: 'RECV_SEGMENT',
        recvSegments: [{
            sourcePort: playerPort,
            destinationPort: AIPort,
            sequenceNumber: playerSequenceNumber++,
            windowSize: windowSize,
            AckNumber: AISequenceNumber,
            ACK: 1,
            SYN: 0,
            FIN: 1,
            RST: 0,
        }]
    })
    expect(service.getSnapshot().value).toBe('TIME_WAIT');
    // AI send 4th terminal handshake
    expect(service.getSnapshot().context.outputSegment).toEqual({
        sourcePort: AIPort,
        destinationPort: playerPort,
        sequenceNumber: AISequenceNumber,
        windowSize: windowSize,
        AckNumber: playerSequenceNumber,
        ACK: 1,
        SYN: 0,
        FIN: 0,
        RST: 0,
    });
});
// => 'resolved'

