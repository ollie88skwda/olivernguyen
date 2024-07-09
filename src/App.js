import "./App.css";
import React, { useState, useEffect, useCallback } from "react";
import perm_reqs from "./assets/permitrequirements.png";
import on_logo from "./assets/on_logo.png";
import { Routes } from "./Routes";

function App() {
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const SCROLL_TOP_THRESHOLD = 25; // Adjust this value to set the threshold near the top

  const handleScroll = useCallback(() => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop <= SCROLL_TOP_THRESHOLD) {
      // Near the top
      setShowTopBar(true);
    } else if (scrollTop > lastScrollTop) {
      // Scrolling down
      setShowTopBar(false);
    } else {
      // Scrolling up
      setShowTopBar(true);
    }
    setLastScrollTop(scrollTop);
  }, [lastScrollTop]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  return (
    <div>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <div class="content">
        <main>
          <header>
            <h1>
              How to get your permit from someone with a permit (for high
              schoolers)
            </h1>
          </header>
          <div id="section1">
            <h2>1: Driver's ed</h2>
            <p>
              Driver's ed will be the biggest time commitment when getting your
              permit. All online courses will cost money, although if your
              school offers driver's ed you can take that class (although it'll
              take more time). I recommend using Aceable Driving, and you can
              buy their California Driver's ed course{" "}
              <a
                href="http://share.aceable.com/6z9QCp"
                target="_blank"
                rel="noreferrer"
              >
                here
              </a>
              . This link gives you a $10 discount.*{" "}
            </p>
            <h3>Driver's ed info</h3>
            <p>
              Driver's ed is going to be long and boring. It's projected to take
              about 30 hours, but if you read quickly you can get through it in
              less time. It took me about 4 months to complete because I'm very
              lazy, but I know people who have done it in 2-7 days. <br />
              <br />
              The point is, make sure to pay attention during the course, but
              not all the information is ultra important. Don't skim, but you
              also don't need to read it like a textbook. Most decisions on the
              road are split second, and it is much more practical to use logic,
              common sense, and basic road knowledge than it is to spend
              valuable time trying to remember exactly what complex law driver's
              ed told you to do. Just don't make stupid decisions that break
              laws, and you'll probably be fine.
            </p>
            <br />
          </div>
          <div id="section2">
            <h2>2: Other stuff</h2>
            <p>
              Once you've done all the driver's ed stuff, everything else will
              be pretty easy. You can visit the{" "}
              <a
                href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/instruction-permits/"
                target="_blank"
                rel="noreferrer"
              >
                official dmv page
              </a>{" "}
              and make sure you bring all the right things to your dmv visit.
              I'll go through all the items you need, according to a screenshot
              from the official dmv page:{" "}
            </p>
            <a
              href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/instruction-permits/"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={perm_reqs}
                alt="dmv permit requirements"
                height="500px"
                class="dmvphoto"
              />
            </a>
            <section>
              <h3>Be at least 15 ½ but under 18</h3>
              <p>
                If you are at the dmv and don't meet this requirement, I can't
                help. <br />
                <br />
              </p>
            </section>
            <section>
              <h3>
                Have a Certificate of Completion/Enrollment of Driver Education
              </h3>
              <p>
                Make sure to bring in the PHYSICAL certificate that you should
                be mailed after completing your driver's ed course. <br />
                <br />
              </p>
            </section>
            <section>
              <h3>
                Complete the California Driver's License or ID Card Application
              </h3>
              <p>
                This one's a bit more complicated. Visit the hyperlink on the
                website or{" "}
                <a
                  href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/dl-id-online-app-edl-44/"
                  target="_blank"
                  rel="noreferrer"
                >
                  here.
                </a>{" "}
                Start off by creating a California DMV account, and then you can
                fill out the application. Then follow these steps with a parent:{" "}
                <br />
                <ol type="1">
                  <li>Start Application</li>
                  <li>Next</li>
                  <li>Log in with the account you made earlier</li>
                  <li>Get a driver’s license or ID card for the first time</li>
                  <li>Select Driver's License</li>
                  <li>No</li>
                  <li>No</li>
                  <li>Check Yes if you want a REAL ID, otherwise click no</li>
                  <li>Fill out all the info (name, birthday, etc)</li>
                  <li>Noncommercial</li>
                  <li>Car (Basic Class C)</li>
                  <li>No (probably)</li>
                  <li>
                    Fill out your address and check if you get mail or not at
                    this address
                  </li>
                  <li>
                    Fill out all the stuff that will go in your ID card (gender,
                    weight, etc)
                  </li>
                  <li>No (probably)</li>
                  <li>No</li>
                  <li>No</li>
                  <li>Up to you if you would like to register/donate</li>
                  <li>Yes (probably)</li>
                  <li>No (probably)</li>
                  <li>Next</li>
                  <li>
                    Select whatever your parents would like to do, I recommend
                    signing electronically
                  </li>
                  <li>
                    Schedule your appointment. Make sure to schedule your
                    appointment earlier rather than later.
                  </li>
                </ol>
                You don't need to follow these steps perfectly. Make sure to do
                whatever applies to you.
                <br />
                <br />
              </p>
              <section>
                <h3>Have a parent(s)/guardian(s) sign the application</h3>
                <p>
                  Either have your parents sign electronically or at the dmv
                  appointment.
                  <br />
                  <br />
                </p>
              </section>
              <section>
                <h3>Visit a DMV office where you will:</h3>
                <p>
                  <h4>
                    1. Bring your California Identification Card or proof of
                    identity and residency.
                  </h4>
                  <p>
                    Bring a proof of residency (I would bring two just in case
                    one doesn't work). You can choose from{" "}
                    <a
                      href="https://www.dmv.ca.gov/portal/file/federal-non-compliant-dl-id-card-documents-list-pdf/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      this list.
                    </a>{" "}
                  </p>
                  <h4>2. Pay the application fee</h4>
                  <p>
                    Pretty self explanatory $45 fee, I guess they have to make
                    money somehow.
                  </p>
                  <h4>3. Pass a vision exam</h4>
                  <p>Don't pull up to the dmv blind.</p>
                  <h4>4. Take a photo</h4>
                  <p>
                    Make sure to smile, I made the mistake of not smiling and
                    now I look like I was taking a mugshot.
                  </p>
                  <h4>5. Take the knowledge test</h4>
                  <p>I'll go over the knowledge test in the next section</p>
                  <br />
                </p>
              </section>
            </section>
          </div>
          <div id="section3">
            <h2>3. Knowledge test</h2>
            <p>
              When you finally get there, the hardest part will be the knowledge
              test. You can practice by actually paying attention during
              driver's ed (jk who even does that (jk again)) and by taking
              practice tests. I recommend the official{" "}
              <a
                href="https://www.dmv.ca.gov/portal/driver-education-and-safety/educational-materials/sample-driver-license-dl-knowledge-tests/"
                target="_blank"
                rel="noreferrer"
              >
                DMV practice tests
              </a>{" "}
              or the test from{" "}
              <a
                href="https://driving-tests.org/california/dmv-practice-test/"
                target="_blank"
                rel="noreferrer"
              >
                driving-test.org.
              </a>{" "}
              The latter has some good practice tests and a decent amount of the
              questions were on the actual test. I don't recommend the Aceable
              practice tests because they aren't that similar to the real one.
              <br />
              <br /> The biggest thing you need to remember for the knowledge
              test though is that if you use common sense, you'll likely pass,
              since that's what driving mostly is. Common sense and logic is all
              you need for this test.
              <br />
              <br />
              <br />
            </p>
          </div>
          <div>
            <p>
              ok thanks for reading and also use my referral code
              <br />
              <br />
              if you have any questions or comments or changes or anything idk
              hmu
              <br />
              <br />
              <br />
            </p>
          </div>
        </main>
        <footer>* - I make money from the referral code</footer>
      </div>
      <div className={`top-bar ${showTopBar ? "visible" : "hidden"}`}>
        <img src={on_logo} width="100px" alt="website logo" />
      </div>
    </div>
  );
}

export default App;
