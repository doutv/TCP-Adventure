import { Modal, Radio } from "antd";
import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import EasyLevelGame from "./pages/EasyLevel";
import { BackgroundMessage } from "./components/text";

const HomePage = () => {
  const navigate = useNavigate();
  const [level, setLevel] = React.useState("/easy-level-game");
  return (
    <div>
      <Modal
        okText="Next"
        cancelText={() => {}}
        visible={true}
        title="Background"
        onOk={() => {
          navigate(level);
        }}
      >
        <div className="welcome-modal">
          <BackgroundMessage />
          <div className="select-level">
            <p>Please select a level to start with: </p>
            <Radio.Group
              defaultValue="/easy-level-game"
              size="large"
              onChange={(e) => {
                setLevel(e.target.value);
              }}
            >
              <Radio.Button value="/easy-level-game">Easy Level</Radio.Button>
              <Radio.Button value="/medium-level-game">
                Medium Level
              </Radio.Button>
              <Radio.Button value="/hard-level-game">Hard Level</Radio.Button>
            </Radio.Group>
          </div>
        </div>
      </Modal>
    </div>
  );
};
const App = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* <Route path="about" />  */}
        <Route path="easy-level-game" element={<EasyLevelGame />} />
      </Routes>
    </div>
  );
};

export default App;
