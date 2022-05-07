import { Button, Modal, Radio, Spin } from "antd";
import * as React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import EasyLevelGame from "./pages/EasyLevel";
import { BackgroundMessage } from "./components/text";
import HardLevelGame from "./pages/HardLevel";
import MediumLevelGame from "./pages/MediumLevel";
import { LeftOutlined } from "@ant-design/icons"
const HomePage = () => {
    const navigate = useNavigate();
    const [level, setLevel] = React.useState("/easy-level-game");
    return (
        <div>
            <a href="https://www.freevector.com/dynamic-background"></a>
            <Modal
                okText="Next"
                visible={true}
                cancelText={() => { }}
                title="Background"
                onOk={() => {
                    navigate(level);
                }}>
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
export const App = () => {
    const navigate = useNavigate()
    return (
        <div className="App">
            <Button
                className="back-button"
                shape={"round"}
                size="large"
                style={{ position: "fixed", background: "#1e498c", color: "white" }}
                icon={<LeftOutlined />}
                onClick={() => {
                    navigate("/")
                }}
            >
                Go Back
            </Button>
            <Routes>
                <Route path="/" element={<HomePage />} />
                {/* <Route path="about" />  */}
                <Route path="easy-level-game" element={<EasyLevelGame />} />
                <Route path="medium-level-game" element={<MediumLevelGame />} />
                <Route path="hard-level-game" element={<HardLevelGame />} />
            </Routes>
        </div>
    );
};
