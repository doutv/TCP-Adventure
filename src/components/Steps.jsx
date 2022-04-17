import { Drawer, Steps, Tooltip } from "antd";
import React from "react";
import {
  EasyLevelFirstTaskDescription,
  EasyLevelSecondTaskDescription,
} from "./text";
import { ForwardOutlined } from "@ant-design/icons";
const { Step } = Steps;

const EasyLevelSteps = (props) => {
  const current = props.current ? props.current : 0;
  const [drawer, setDrawer] = React.useState(false);
  return (
    <div className="easy-level step-drawer">
      <Tooltip title="Tasks">
        <ForwardOutlined
          style={{
            fontSize: "40px",
            position: "fixed",
            borderRadius: "50px",
            color: "#293845",
            bottom: "40px",
            right: "40px",
          }}
          onClick={() => {
            setDrawer(true);
          }}
        />
      </Tooltip>

      <Drawer
        title="Progress"
        onClose={() => {
          setDrawer(false);
        }}
        visible={drawer}
        placement="right"
      >
        <Steps current={current} direction="vertical" initial={0}>
          <Step
            title="Step 1"
            description={current == 0 ? <EasyLevelFirstTaskDescription /> : ""}
          />
          <Step
            title="Step 2"
            description={current == 1 ? <EasyLevelSecondTaskDescription /> : ""}
          />
        </Steps>
      </Drawer>
    </div>
  );
};

export default EasyLevelSteps;
