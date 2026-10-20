import { Popover } from "@headlessui/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Button from "../Button";
// Local Data
import data from "../../data/portfolio.json";
import MovingBanner from "./MovingBanner/MovingBanner";
const Header = ({ handleWorkScroll, handleAboutScroll }) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { showResume } = data;

  return (
    <>
      {/* Fixed Home Button - visible on all screen sizes */}
      <div
        onClick={() => router.push("/")}
        className="fixed top-16 left-5 w-10 h-10 tablet:w-12 tablet:h-12 flex items-center justify-center rounded-full bg-[#A8C69F] border border-[#2B2118] cursor-pointer z-50 animate-spin-slow"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        <span className="text-lg tablet:text-xl font-bold text-[#2B2118]">*</span>
      </div>

      {/* Mobile Menu */}
      <Popover className="block tablet:hidden mt-5">
        {({ open }) => (
          <>
            <div className="flex items-center justify-between p-2 laptop:p-0">
              {/* Spacer for where home button was */}
              <div className="w-8"></div>

              <div className="flex items-center">
                <Popover.Button>
                  <img
                    className="h-5"
                    src={`/images/${!open ? "menu.svg" : "cancel.svg"}`}
                  />
                </Popover.Button>
              </div>
            </div>

            <Popover.Panel
              className="absolute right-5 z-10 w-11/12 p-4 bg-[#FFC1CF] border border-[#2B2118] shadow-md rounded-md"
            >
              <div className="grid grid-cols-1">
                <Button onClick={() => router.push("/")}>Home</Button>
                <Button onClick={handleWorkScroll}>Work</Button>
                <Button onClick={handleAboutScroll}>About</Button>
                {showResume && (
                  <Button onClick={() => router.push("/resume")}>
                    Resume
                  </Button>
                )}
                <Button
                  onClick={() => window.open("mailto:awlicepicco@gmail.com")}
                  className="mt-6"
                >
                  Contact
                </Button>
              </div>
            </Popover.Panel>
          </>
        )}
      </Popover>

      <MovingBanner />

      {/* Desktop Header */}
      <div
        className="mt-5 hidden flex-row items-center justify-between sticky w-full rounded-full bg-[#FFC1CF] border border-[#2B2118] top-0 z-10 tablet:flex"
      >
        {/* Spacer for fixed home button */}
        <div className="w-16 ml-10"></div>

           

        

        <div className="flex">
          <Button onClick={handleWorkScroll}>Work</Button>
          <Button onClick={handleAboutScroll}>About</Button>
          {showResume && (
            <Button
              onClick={() => router.push("/resume")}
              classes="first:ml-1"
            >
              Resume
            </Button>
          )}
          <Button onClick={() => window.open("mailto:awlicepicco@gmail.com")}>
            Contact
          </Button>
        </div>
      </div>
    </>
  );
}
export default Header;

