import { createTCPStateMachine } from './TCPStateMachine';
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
    const sourcePort = service.machine.context.destinationPort;
    const destinationPort = service.machine.context.sourcePort;
    let playerSequenceNumber = 0;
    let windowSize = service.machine.context.windowSize;
    let AISequenceNumber = service.machine.context.sequenceNumber;

    // AI send 1st handshake segment
    service.send({ type: 'ACTIVE_OPEN' });
    expect(service.machine.context.outputSegment).toEqual({
        sourcePort: destinationPort,
        destinationPort: sourcePort,
        sequenceNumber: AISequenceNumber++,
        windowSize: windowSize,
        AckNumber: 0,
        ACK: 0,
        SYN: 1,
        FIN: 0,
    })
    // send 2nd handshake segment
    let event = {
        type: 'unknown',
        recvSegments: [{
            sourcePort: sourcePort,
            destinationPort: destinationPort,
            sequenceNumber: playerSequenceNumber++,
            windowSize: windowSize,
            AckNumber: service.machine.context.sequenceNumber + 1,
            ACK: 1,
            SYN: 1,
            FIN: 0,
        }]
    }
    service.send(event);
    console.log(event)
    // receive 3rd handshake segment
    expect(service.machine.context.outputSegment).toEqual({
        sourcePort: destinationPort,
        destinationPort: sourcePort,
        sequenceNumber: AISequenceNumber,
        windowSize: windowSize,
        AckNumber: playerSequenceNumber,
        ACK: 1,
        SYN: 0,
        FIN: 0,
    })
    service.send({
        type: 'unknown',
        recvSegments: [{
            sourcePort: sourcePort,
            destinationPort: destinationPort,
            sequenceNumber: playerSequenceNumber++,
            windowSize: windowSize,
            AckNumber: service.machine.context.sequenceNumber + 1,
            ACK: 1,
            SYN: 1,
            FIN: 0,
            data: "Hello World!"
        }]
    });

});
// => 'resolved'

