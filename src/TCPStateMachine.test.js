import { createTCPStateMachine, getDataSizeInBytes } from './TCPStateMachine';
import { getSimplePaths } from '@xstate/graph';
import { createMachine, interpret } from 'xstate';


const testTCPStateMachine = createTCPStateMachine(0, "");

/*
const promiseService = interpret(testTCPStateMachine).onTransition((state) =>
    console.log(state.value, state.context)
);
promiseService.start();

promiseService.send({ type: 'ACTIVE_OPEN' });
*/

// model-based testing
/*
describe('feedback app', () => {
    const testPlans = feedbackModel.getShortestPathPlans();

    testPlans.forEach();

    it('should have full coverage', () => {
        return testModel.testCoverage();
    });
});
*/

// BDD behavior-driven development
it('Easy Level', (done) => {
    const service = interpret(testTCPStateMachine).onTransition((state) => {
        // this is where you expect the state to eventually
        // be reached
        console.log(state.value, state.context)
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
    expect(service.machine.context.outputSegment).toEqual({
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
        type: 'recv_data',
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
    // a TCP segment will be digest
    // expect(event.recvSegments).toEqual([]);

    // AI send 3rd handshake segment
    expect(service.machine.context.outputSegment).toEqual({
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
        SYN: 1,
        FIN: 0,
        data: "Hello AI!"
    };
    playerSequenceNumber += getDataSizeInBytes(message.data);
    service.send({
        type: 'recv_data',
        recvSegments: [message]
    });
    expect(service.machine.context.savedSegments[0]).toEqual(message);

    // AI send a message to player
    const data = "Hello Player!";
    service.send({
        type: 'SEND_DATA',
        data: data
    })
    expect(service.machine.context.outputSegment).toEqual({
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
    expect(service.machine.context.outputSegment).toEqual({
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
        type: 'recv_data',
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
    expect(service.machine.context.outputSegment).toEqual({
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

