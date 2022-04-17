import { createTCPStateMachine, getDataSizeInBytes } from './TCPStateMachine';
import { interpret } from 'xstate';
import { createModel } from '@xstate/test';


it('Two Machines talking to each other', (done) => {
    const AIMachine = createTCPStateMachine(3280, 12345, 100, "");
    const playerMachine = createTCPStateMachine(12345, 3280, 10000, "");
    const AIService = interpret(AIMachine).onTransition((state) => {
        console.log("AI: ", state.value, state.context);
        if (state.matches('CLOSED')) {
            done();
        }
    });
    const playerService = interpret(playerMachine).onTransition((state) => {
        console.log("Player: ", state.value, state.context);
    });
    const getOutputSegment = (service) => { return service.getSnapshot().context.outputSegment; }
    AIService.start();
    playerService.start();

    // Player send 1st handshake
    playerService.send({ type: 'ACTIVE_OPEN' });
    AIService.send({ type: 'PASSIVE_OPEN' });
    // AI get 1st handshake and send 2nd handshake
    AIService.send({
        type: 'RECV_SEGMENT',
        recvSegments: [getOutputSegment(playerService)]
    });
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
    playerService.send({
        type: 'SEND_DATA',
        data: "Hello AI!"
    });
    AIService.send({
        type: "RECV_SEGMENT",
        recvSegments: [getOutputSegment(playerService)]
    });
    expect(AIService.getSnapshot().context.savedSegments[AIService.getSnapshot().context.savedSegments.length - 1])
        .toEqual(getOutputSegment(playerService));

})

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
                    // TODO: create a player machine to talk with AI machine
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
    const AIMachine = createTCPStateMachine(3280, 12345, 100, "");
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
        data: "Hello AI!"
    };
    playerSequenceNumber += getDataSizeInBytes(message.data);
    service.send({
        type: 'RECV_SEGMENT',
        recvSegments: [message]
    });
    expect(service.machine.context.savedSegments[0]).toEqual(message);

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
    });
});
// => 'resolved'

