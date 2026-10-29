import React from "react";
import { useTheme } from "next-themes";
import data from "../../data/portfolio.json";

const Button = ({ children, type, onClick, classes }) => {
  if (type === "primary") {
    return (
      <button
        onClick={onClick}
        type="button"
        className={`text-sm tablet:text-base px-4 py-1 laptop:px-6 laptop:py-2 m-1 laptop:m-2 rounded-3xl border border-[#2B2118] font-bold transition-all duration-300 ease-out first:ml-0 hover:scale-105 active:scale-100 link bg-[#2B2118] text-[#FFC1CF] hover:bg-[#A8C69F] hover:text-[#2B2118] ${classes}`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      type="button"
      className={`text-sm tablet:text-base px-4 py-1 laptop:px-6 laptop:py-2 m-1 laptop:m-2 rounded-3xl border border-[#2B2118] flex items-center font-bold transition-all ease-out duration-300 hover:scale-105 active:scale-100 tablet:first:ml-0 text-[#2B2118] hover:bg-[#A8C69F] hover:text-[#2B2118] ${classes} link`}
    >
      {children}
    </button>
  );
};

export default Button;
