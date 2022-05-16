import { Drawer, Steps, Tooltip } from "antd";
import React from "react";
import {
  EasyLevelFirstTaskDescriptionWithAnswer,
  EasyLevelSecondTaskDescriptionWithAnswer,
  MediumLevelFirstTaskDescription,
  MediumLevelSecondTaskDescription
} from "./text";
import { ForwardOutlined } from "@ant-design/icons";
const { Step } = Steps;

const EasyLevelSteps = (props) => {
  const { clientPackConfigs } = props;
  const current = props.current ? props.current : 0;
  const [drawer, setDrawer] = React.useState(false);
  return (
    <div className="easy-level step-drawer">
      <Tooltip title="Missions">
        <ForwardOutlined
          className="open-progress"
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
        title="Missions"
        onClose={() => {
          setDrawer(false);
        }}
        visible={drawer}
        placement="right"
        size="large"
      >
        <Steps current={current} direction="vertical" initial={0}>
          <Step
            description={current == 0 ?
              <EasyLevelFirstTaskDescriptionWithAnswer
                clientPackConfigs={clientPackConfigs}
              /> : ""
            }
          />
          <Step
            description={current == 1 ?
              <EasyLevelSecondTaskDescriptionWithAnswer
                clientPackConfigs={clientPackConfigs}
              /> : ""}
          />
        </Steps>
      </Drawer>
    </div>
  );
};

const MediumLevelSteps = (props) => {
  const current = props.current ? props.current : 0;
  const [drawer, setDrawer] = React.useState(false);
  return (
    <div className="easy-level step-drawer">
      <Tooltip title="Missions">
        <ForwardOutlined
          className="open-progress"
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
        title="Missions"
        size="large"
        onClose={() => {
          setDrawer(false);
        }}
        visible={drawer}
        placement="right"
      >
        <Steps current={current} direction="vertical" initial={0}>
          <Step
            description={current == 0 ? <MediumLevelFirstTaskDescription /> : ""}
          />
          <Step
            description={current == 1 ? <MediumLevelSecondTaskDescription /> : ""}
          />
        </Steps>
      </Drawer>
    </div>
  );
};

export {
  EasyLevelSteps,
  MediumLevelSteps
};
