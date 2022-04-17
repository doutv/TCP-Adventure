import { createTCPStateMachine, getDataSizeInBytes } from './TCPStateMachine';
import { interpret } from 'xstate';
import { createModel } from '@xstate/test';

const testTCPStateMachine = createTCPStateMachine(0, "");

/*
describe('model-based testing', () => {
    const model = createModel(testTCPStateMachine).withEvents({
        ACTIVE_OPEN: {
            exec: () => { }
        },
        RECV_FIN_ACK_SEND_ACK: {
            exec: () => { }
        }
    });
    const testPlans = model.getShortestPathPlans();
    console.log(testPlans);
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

