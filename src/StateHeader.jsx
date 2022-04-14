import React from "react";
import "./StateHeader.css"
const StateHeader = (props, ref) => {
    let {state, setState} = props
    let {ThreeHandShakeState, FourHandShakeState, FlowControlState, Finished} = props
    
    React.useImperativeHandle(ref,()=>{
        const handleRefs = {
            changeState (newState) {
                setState(newState);
              }
        }
        return handleRefs
     },[])

    return (
        <div className="state-header"> 
            State: {state === ThreeHandShakeState
          ? 'Connection is establishing ... '
          : state === FlowControlState
          ? 'Connection established, data transmission ...'
          : state === FourHandShakeState
          ? 'Finish data transmission'
          : 'TCP Closed'}
        </div>
    )
}

export default StateHeader;