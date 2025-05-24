import React from "react";
import Lottie from "lottie-react";
import animationData from "./assets/loader.json";
import "./Preloader.css";

const Preloader = () => {
  return (
    <div className="preloader-container">
      <div className="lottie-wrapper">
        <Lottie animationData={animationData} loop={true} />
      </div>
      <div className="preloader-text">Loading Schedule Planner...</div>
    </div>
  );
};

export default Preloader;
