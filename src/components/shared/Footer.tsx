"use client";

import React from "react";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import Link from "next/link";

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
        <div className="mb-1">
          ©/™ {currentYear} hikerbikerwriter /{" "}
          <Link
            href="https://github.com/sjamesmccarthy/hikerbikerwriter"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            v1.5.0
          </Link>
        </div>
        <div>
          This project is entirely{" "}
          <Link
            href="https://github.com/sjamesmccarthy/hikerbikerwriter/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:underline font-medium text-blue-200 inline-flex items-center gap-0.5 align-baseline"
            style={{ lineHeight: 1, whiteSpace: "nowrap" }}
          >
            <span style={{ display: "inline" }}>
              generated using Co-Pilot AI with Claude Sonnet 4 mode
            </span>
            <OpenInNewIcon
              sx={{
                fontSize: 13,
                marginLeft: "1.5px",
                verticalAlign: "text-bottom",
                minWidth: 0,
              }}
            />
          </Link>
          , mysql, Tempest Weather Station API and hosted at Vercel.
        </div>
      </div>
    </div>
  );
};

export default Footer;
