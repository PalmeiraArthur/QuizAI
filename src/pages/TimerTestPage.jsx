import React from "react";
import Timer from "../components/Timer";

const TimerTestPage = () => {
  return (
    <div className="m-[20px]">
      <Timer
        initialTime={5}
        size={'xl'}
        strokeWidth={10}
        circleColor="#e0e0e0"
        progressColor="#4CAF50"
        textColor="#e0e0e0"
        onComplete={() => console.log("Timer completed!")}
      />
    </div>
  );
};

export default TimerTestPage;
