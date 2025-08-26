"use client";

import React from "react";
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
            v1.9.0
          </Link>
        </div>
        <Link
          href="/about"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          <div>
            This project is entirely generated using Co-Pilot AI with Claude
            Sonnet 4 model, as well as MySQL, Tempest Weather Station API and
            hosted at Vercel.
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Footer;
