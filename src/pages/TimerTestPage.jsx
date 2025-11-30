import React from "react";
import Timer from "../components/Timer";

const TimerTestPage = () => {
  return (
    <div className="m-[20px]">
      <Timer
        initialTime={100}
        size={'xl'}
        strokeWidth={120}
        circleColor="whitesmoke"
        progressColor="darkorange"
        textColor="black"
        onComplete={() => console.log("Timer completed!")}
      />
    </div>
  );
};

export default TimerTestPage;
