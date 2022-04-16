import React from "react";
import "./StateHeader.css"
import {QuestionCircleOutlined} from "@ant-design/icons"
import { Modal } from "antd";
import { EasyLevelManual } from "./text";
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
          <QuestionCircleOutlined color="white" style={{float: 'right', fontSize:"40px", margin:"5px"}} onClick={()=>{
            Modal.confirm({
                width:"800px",
                cancelText:() => {},
                title: "Tips",
                content: <EasyLevelManual />
            })
          }}/>
          
        </div>
    )
}

export default StateHeader;