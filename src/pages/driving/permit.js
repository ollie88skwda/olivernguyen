import React, { useEffect, useState } from "react";
import perm_reqs from "../../assets/permitrequirements.png";
import { Display, SectionHead } from "@/components/brand";
import "../../styles/sakura.css";
import "./permit.css";

const PermitSectionHead = ({ kicker, number, title }) => (
  <SectionHead
    as="h2"
    kicker={<span aria-hidden="true">{kicker}</span>}
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
          <Display as="h1" className="pm-title">
            How to get your permit (for high schoolers)
          </Display>
        </header>

        <section className="pm-section">
          <PermitSectionHead kicker="01" number="1" title="Driver's ed" />
          <p className="on-prose">
            Driver's ed takes the most time of anything on the way to your
            permit. Online courses all cost money. If your school offers
            driver's ed you can take that instead, but it takes longer. I
            recommend Aceable Driving. You can buy their California driver's ed
            course{" "}
            <a
              href="http://share.aceable.com/6z9QCp"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>
            . This link gives you a $10 discount.
          </p>
          <Display as="h3" className="pm-sub">
            Driver's ed info
          </Display>
          <p className="on-prose">
            Driver's ed is long and boring. It's listed at about 30 hours, but
            if you read fast you can finish sooner. It took me about 4 months
            because I'm lazy, but I know people who did it in 2 to 7 days.
          </p>
          <p className="on-prose">
            Pay attention during the course, but not every detail matters. Don't
            skim, and don't read it like a textbook either. Most decisions on
            the road happen in a split second, so common sense and basic road
            knowledge help more than remembering an exact law. Don't make dumb
            choices that break laws and you'll probably be fine.
          </p>
        </section>

        <section className="pm-section">
          <PermitSectionHead kicker="02" number="2" title="Other stuff" />
          <p className="on-prose">
            Once driver's ed is done, the rest is pretty easy. Check the{" "}
            <a
              href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/instruction-permits/"
              target="_blank"
              rel="noopener noreferrer"
            >
              official dmv page
            </a>{" "}
            to make sure you bring the right things to your DMV visit. Here are
            the items you need, from a screenshot of that page:
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
              If you're at the DMV and don't meet this requirement, I can't
              help.
            </p>
          </section>
          <section>
            <Display as="h3" className="pm-sub">
              Have a certificate of completion or enrollment for driver education
            </Display>
            <p className="on-prose">
              Bring the paper certificate that gets mailed to you after you finish
              your driver's ed course.
            </p>
          </section>
          <section>
            <Display as="h3" className="pm-sub">
              Complete the California driver's license or ID card application
            </Display>
            <p className="on-prose">
              This one's a bit harder. Use the link on that page or{" "}
              <a
                href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/dl-id-online-app-edl-44/"
                target="_blank"
                rel="noopener noreferrer"
              >
                here.
              </a>{" "}
              Create a California DMV account first, then fill out the
              application. Follow these steps with a parent:
            </p>
            <ol className="pm-steps" type="1">
              <li>Start Application</li>
              <li>Next</li>
              <li>Log in with the account you made earlier</li>
              <li>Get a driver's license or ID card for the first time</li>
              <li>Select Driver's License</li>
              <li>No</li>
              <li>No</li>
              <li>Check Yes if you want a REAL ID, otherwise click No</li>
              <li>Fill out your info (name, birthday, etc.)</li>
              <li>Noncommercial</li>
              <li>Car (Basic Class C)</li>
              <li>No (probably)</li>
              <li>
                Fill out your address and say whether you get mail there
              </li>
              <li>
                Fill out what goes on your ID card (gender, weight, etc.)
              </li>
              <li>No (probably)</li>
              <li>No</li>
              <li>No</li>
              <li>Register or donate if you want to</li>
              <li>Yes (probably)</li>
              <li>No (probably)</li>
              <li>Next</li>
              <li>
                Pick what your parents prefer. I recommend signing electronically
              </li>
              <li>
                Schedule your appointment. Book it early.
              </li>
            </ol>
            <p className="on-prose">
              You don't need to follow these steps exactly. Do whatever applies
              to you.
            </p>
            <section>
              <Display as="h3" className="pm-sub">
                Have a parent or guardian sign the application
              </Display>
              <p className="on-prose">
                Your parents can sign electronically or at the DMV
                appointment.
              </p>
            </section>
            <section>
              <Display as="h3" className="pm-sub">
                At the DMV office you will:
              </Display>
              <div>
                <h4 className="pm-h4">
                  1. Bring your California ID card or proof of identity and
                  residency
                </h4>
                <p className="on-prose">
                  Bring proof of residency. I'd bring two in case one doesn't
                  work. You can choose from{" "}
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
                  The fee is $45.
                </p>
                <h4 className="pm-h4">3. Pass a vision exam</h4>
                <p className="on-prose">Don't show up to the DMV unable to see.</p>
                <h4 className="pm-h4">4. Take a photo</h4>
                <p className="on-prose">
                  <strong>
                    Important: your photo is taken here. It goes on your permit and
                    your ID card, so it sticks around.
                  </strong>
                  <br />
                  <br />
                  Smile. I didn't, and now I look like I'm in a mugshot.
                </p>
                <h4 className="pm-h4">5. Take the knowledge test</h4>
                <p className="on-prose">
                  The next section covers the knowledge test.
                </p>
              </div>
            </section>
          </section>
        </section>

        <section className="pm-section">
          <PermitSectionHead kicker="03" number="3" title="The knowledge test" />
          <p className="on-prose">
            Most people fail this part. You need at least 38 of 46 questions
            right to pass. You can take the test 3 times before you have to pay
            another $45 fee. I recommend using{" "}
            <a
              href="https://www.dmv.ca.gov/portal/driver-education-and-safety/educational-materials/sample-driver-license-dl-knowledge-tests/"
              target="_blank"
              rel="noopener noreferrer"
            >
              these practice tests
            </a>{" "}
            to study. I got 43 of 46 and only studied with these. The real
            questions are very similar, so if you can pass the practice tests,
            you can pass the real one.
          </p>
        </section>

        <section className="pm-section">
          <PermitSectionHead kicker="04" number="4" title="Congrats!" />
          <p className="on-prose">
            If you made it this far, you should have your permit. You can now
            practice driving with your parents or a licensed driver over 25.
            Follow the rules and restrictions on your permit, and don't do
            anything stupid. Good luck.
          </p>
        </section>
      </article>
    </main>
  );
};

export default Permit;
