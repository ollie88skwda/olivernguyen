import React, { useEffect, useState } from "react";
import perm_reqs from "../../assets/permitrequirements.png";
import { Display, MonoLabel, SectionHead } from "@/components/brand";
import "../../styles/sakura.css";
import "./permit.css";

const PermitSectionHead = ({ kicker, number, title }) => (
  <SectionHead
    as="h2"
    kicker={kicker}
    title={
      <>
        <span aria-hidden="true">{title}</span>
        <span className="sr-only">{number}: {title}</span>
      </>
    }
  />
);

// /permit — restyled onto the sakura ladder (docs/redesign-research/
// 16-legacy-restyle.md). Content, links, image + alt text and heading
// semantics are preserved from the legacy page; only the presentation moved
// to the brand (BRAND.md §7 type roles, §5 spacing, §6 motion, §4/§9
// surfaces). The legacy framer-motion translate entrance is gone — the shell
// fades in opacity-only at the §6 state duration (permit.css .pm-in).
export const Permit = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className={`sakura permit${isVisible ? " pm-in" : ""}`}>
      <article className="pm-guide">
        <header className="pm-head">
          <MonoLabel>California DMV · Permit Guide</MonoLabel>
          <Display as="h1" className="pm-title">
            How to get your permit (for high schoolers)
          </Display>
        </header>

        <section className="pm-section">
          <PermitSectionHead kicker="01" number="1" title="Driver's ed" />
          <p className="on-prose">
            Driver's ed will be the biggest time commitment when getting your
            permit. All online courses will cost money, although if your school
            offers driver's ed you can take that class (although it'll take more
            time). I recommend using Aceable Driving, and you can buy their
            California Driver's ed course{" "}
            <a
              href="http://share.aceable.com/6z9QCp"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>
            . This link gives you a $10 discount.*
          </p>
          <Display as="h3" className="pm-sub">
            Driver's ed info
          </Display>
          <p className="on-prose">
            Driver's ed is going to be long and boring. It's projected to take
            about 30 hours, but if you read quickly you can get through it in
            less time. It took me about 4 months to complete because I'm very
            lazy, but I know people who have done it in 2-7 days.
          </p>
          <p className="on-prose">
            The point is, make sure to pay attention during the course, but not
            all the information is ultra important. Don't skim, but you also
            don't need to read it like a textbook. Most decisions on the road
            are split second, and it is much more practical to use logic, common
            sense, and basic road knowledge than it is to spend valuable time
            trying to remember exactly what complex law driver's ed told you to
            do. Just don't make stupid decisions that break laws, and you'll
            probably be fine.
          </p>
        </section>

        <section className="pm-section">
          <PermitSectionHead kicker="02" number="2" title="Other stuff" />
          <p className="on-prose">
            Once you've done all the driver's ed stuff, everything else will be
            pretty easy. You can visit the{" "}
            <a
              href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/instruction-permits/"
              target="_blank"
              rel="noopener noreferrer"
            >
              official dmv page
            </a>{" "}
            and make sure you bring all the right things to your dmv visit. I'll
            go through all the items you need, according to a screenshot from
            the official dmv page:
          </p>
          <a
            className="pm-shot-link"
            href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/instruction-permits/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="pm-shot"
              src={perm_reqs}
              alt="dmv permit requirements"
            />
          </a>
          <section>
            <Display as="h3" className="pm-sub">
              Be at least 15 ½ but under 18
            </Display>
            <p className="on-prose">
              If you are at the dmv and don't meet this requirement, I can't
              help.
            </p>
          </section>
          <section>
            <Display as="h3" className="pm-sub">
              Have a Certificate of Completion/Enrollment of Driver Education
            </Display>
            <p className="on-prose">
              Make sure to bring in the PHYSICAL certificate that you should be
              mailed after completing your driver's ed course.
            </p>
          </section>
          <section>
            <Display as="h3" className="pm-sub">
              Complete the California Driver's License or ID Card Application
            </Display>
            <p className="on-prose">
              This one's a bit more complicated. Visit the hyperlink on the
              website or{" "}
              <a
                href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/dl-id-online-app-edl-44/"
                target="_blank"
                rel="noopener noreferrer"
              >
                here.
              </a>{" "}
              Start off by creating a California DMV account, and then you can
              fill out the application. Then follow these steps with a parent:
            </p>
            <ol className="pm-steps" type="1">
              <li>Start Application</li>
              <li>Next</li>
              <li>Log in with the account you made earlier</li>
              <li>Get a driver's license or ID card for the first time</li>
              <li>Select Driver's License</li>
              <li>No</li>
              <li>No</li>
              <li>Check Yes if you want a REAL ID, otherwise click no</li>
              <li>Fill out all the info (name, birthday, etc)</li>
              <li>Noncommercial</li>
              <li>Car (Basic Class C)</li>
              <li>No (probably)</li>
              <li>
                Fill out your address and check if you get mail or not at this
                address
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
            <p className="on-prose">
              You don't need to follow these steps perfectly. Make sure to do
              whatever applies to you.
            </p>
            <section>
              <Display as="h3" className="pm-sub">
                Have a parent(s)/guardian(s) sign the application
              </Display>
              <p className="on-prose">
                Either have your parents sign electronically or at the dmv
                appointment.
              </p>
            </section>
            <section>
              <Display as="h3" className="pm-sub">
                Visit a DMV office where you will:
              </Display>
              <div>
                <h4 className="pm-h4">
                  1. Bring your California Identification Card or proof of
                  identity and residency.
                </h4>
                <p className="on-prose">
                  Bring a proof of residency (I would bring two just in case one
                  doesn't work). You can choose from{" "}
                  <a
                    href="https://www.dmv.ca.gov/portal/file/federal-non-compliant-dl-id-card-documents-list-pdf/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    this list.
                  </a>{" "}
                </p>
                <h4 className="pm-h4">2. Pay the application fee</h4>
                <p className="on-prose">
                  Pretty self explanatory $45 fee, I guess they have to make
                  money somehow.
                </p>
                <h4 className="pm-h4">3. Pass a vision exam</h4>
                <p className="on-prose">Don't pull up to the dmv blind.</p>
                <h4 className="pm-h4">4. Take a photo</h4>
                <p className="on-prose">
                  <strong>
                    VERY IMPORTANT: YOU ARE TAKING YOUR PHOTO HERE. THIS PHOTO
                    WILL BE ON YOUR PERMIT AND YOUR ID CARD, SO THIS IS PRETTY
                    PERMANANT
                  </strong>
                  <br />
                  <br />
                  Also, Make sure to smile, I made the mistake of not smiling
                  and now I look like I was taking a mugshot.
                </p>
                <h4 className="pm-h4">5. Take the knowledge test</h4>
                <p className="on-prose">
                  I'll go over the knowledge test in the next section
                </p>
              </div>
            </section>
          </section>
        </section>

        <section className="pm-section">
          <PermitSectionHead kicker="03" number="3" title="The knowledge test" />
          <p className="on-prose">
            This is the part that most people fail. You need to get at least
            38/46 questions right to pass. You can take the test 3 times before
            you have to pay another $45 fee. I recommend using{" "}
            <a
              href="https://www.dmv.ca.gov/portal/driver-education-and-safety/educational-materials/sample-driver-license-dl-knowledge-tests/"
              target="_blank"
              rel="noopener noreferrer"
            >
              these practice tests
            </a>{" "}
            to study. When I took the test, I got a 43/46, and I only studied
            using these practice tests. The questions on the actual test are
            very similar to the practice tests, so if you can pass the practice
            tests, you can pass the real test.
          </p>
        </section>

        <section className="pm-section">
          <PermitSectionHead kicker="04" number="4" title="Congrats!" />
          <p className="on-prose">
            If you've made it this far, you should have your permit! Now you can
            start practicing driving with your parents or a licensed driver over
            25. Make sure to follow all the rules and restrictions on your
            permit, and don't do anything stupid. Good luck!
          </p>
        </section>
      </article>
    </main>
  );
};

export default Permit;
