"use client";

import React from "react";

interface FooterProps {
  containerClassName?: string;
  hrClassName?: string;
  textClassName?: string;
}

const Footer: React.FC<FooterProps> = ({
  containerClassName = "w-full pt-8 pb-8 px-8",
  hrClassName = "hidden",
  textClassName = "text-center text-white text-sm",
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className={containerClassName}>
      {hrClassName !== "hidden" && <hr className={hrClassName} />}
      <div className={textClassName}>
        <div className="mb-1">©/™ {currentYear} hikerbikerwriter</div>
        <div>
          This project was entirely generated using Co-Pilot AI with Claude
          Sonnet 4 model and the Tempest Weather Station API
        </div>
      </div>
    </div>
  );
};

export default Footer;
