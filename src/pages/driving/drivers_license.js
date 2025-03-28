import "../../App.css";
import { TopBar } from "../top_bar";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import driving_license from "../../assets/licenserequirements.png";

export const DriversLicense = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    setIsVisible(true);
    window.scrollTo(0, 0);
  }, []);
  return (
    <div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, translateY: -100 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              duration: 0.8,
              type: "tween",
            }}
            style={{ willChange: "opacity, transform" }}
            exit={{ opacity: 0, translateY: 10 }}
          >
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <div class="content">
              <main>
                <header>
                  <h1>How to get your drivers license after your permit</h1>
                </header>
                <div class="section1">
                  <h2>1: Get your permit</h2>
                  <p>
                    If you don't have your permit, go get it. Learn how to get
                    it <a href="/permit">here</a>.
                  </p>
                </div>
                <div class="section2">
                  <h2>2: Other stuff</h2>
                  <p>
                    Once you have your permit all you have to do is fulfill more
                    requirements, and you'll get it eventually. Again, you can
                    visit the{" "}
                    <a
                      href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/driver-licenses-dl/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      official dmv page
                    </a>{" "}
                    and to view the requirements. I'll also go through them and
                    my recommendations for them as well. Here's the screenshot
                    I'll be following:
                  </p>
                  <a
                    href="https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/driver-licenses-dl/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={driving_license}
                      alt="driving license"
                      height="500px"
                      class="dmvphoto"
                    />
                  </a>
                  <p className="note">
                    Note: after reading through the requirements, the first few
                    are pretty self-explanatory so click{" "}
                    <a href="#importantPart">here</a> if you want to start
                    reading the interesting ones.
                  </p>
                  <section>
                    <h3>Be between 16 and 18 years old</h3>
                    <p>
                      Not much you can do to change this one.
                      <br />
                      <br />
                    </p>
                  </section>
                  <section>
                    <h3>
                      Have held your provisional instruction permit for a
                      minimum of 6 months
                    </h3>
                    <p>
                      Also nothing you can do to change this one. I guess get
                      your permit faster if you don't have it yet.
                      <br />
                      <br />
                    </p>
                  </section>
                  <h3>Have completed driver's ed</h3>
                  <p>
                    I don't even know how you get your permit without driver's
                    ed.
                    <br />
                    <br />
                  </p>
                  <section>
                    <h3 id="importantPart">
                      Have completed 6 hours of professional driver training
                    </h3>
                    <p>
                      It's really up to you which driver school you choose, I
                      just went with the cheapast option and it was alright.
                      Some of my friends have gone to other driving schools and
                      they also said they were ok. I didn't hear about anything
                      too good except for this one double glasses guy who's
                      really chill, not sure what school though.
                      <br />
                      <br />
                    </p>
                  </section>
                  <section>
                    <h3>Have completed 50 hours of practice</h3>
                    <p>
                      For this requirement, try and focus on actually learning
                      to drive, and not meeting the time requirement, because
                      the dmv doesn't actually check if you tracked it. (if you
                      want to track it though, i'll probably build a driving
                      logger and put it on my website soon). <br />
                      <br />
                      There's two main ways to meet this. You can either drive
                      consistently a lot or do really long drives. I did a
                      combination. I drove to school every day, and I also did
                      one long drive to San Francisco (it was very tiring
                      though).
                      <br />
                      <br />
                      It's also pretty important that you're a safe driver w/
                      your parents, because if you aren't then your parent(s)
                      will get too scared to drive with you, decreasing the
                      amount of driving time you get. I speak from experience
                      (sorry Mom).
                      <br />
                      <br />
                    </p>
                  </section>
                  <section>
                    <h3>Drive in the night for 10 hours</h3>
                    <p>
                      Don't be scared of this, driving in the night is easier
                      than in the day for me because it's easier to see
                      headlights in your mirrors.
                    </p>
                  </section>
                </div>
                <div class="section3">
                  <h2>3: Driving advice</h2>
                  <p>
                    When I started, I had a lot of questions about controlling
                    the car. It's not super hard to physically drive a car, it's
                    just harder to make sure to make good decisions with it.
                    <h3>Car control</h3>
                    For actual driving advice, one thing to note is that you
                    should start off aiming for a comfortable driving style.
                    Make sure to press the pedal slowly at first, then increase
                    the amount you press sort of at an exponential rate. Another
                    thing I recommend is when you are braking and about to come
                    to a complete stop, slightly let go of the pedal at the last
                    moment (not all the way, just a small amount) and it will
                    make your braking far more comfortable. This technique is
                    called{" "}
                    <a href="https://www.tarheelbmwcca.org/Chauffeur%20Braking.doc#:~:text=Squeeze%20the%20brake%20firmly%20at,and%20the%20passengers%20bob%20forward%3F">
                      chauffeur braking.{" "}
                    </a>
                    <br />
                    <br />I don't want to teach you how to actually drive, this
                    is just what I think is valuable that I wasn't really
                    taught. The rest of it you can make your parents teach you.
                  </p>
                  <h3>Decision making/logic tips</h3>
                  <p>
                    There's a slightly steeper learning curve here, since you'll
                    rarely come across truly difficult decisions. Honestly, the
                    best catch-all advice I can give is just do what everyone
                    else is doing. If there's an accident and everoyne is
                    passing around the accident, just do what they're doing. If
                    there's no one there and you don't know what to do, just
                    take the same approach as the permit test, which is just
                    take the safest option (duh).
                  </p>
                  {/* TODO: Add more driving advice */}
                </div>
                <div class="section4">
                  <h2>4: At the DMV</h2>
                  <h3>Choosing which DMV</h3>
                  <p>
                    I have a decent amount of experience with DMVs and going for
                    a license (maybe because I've been to two different ones
                    since I failed my first try). I've been to Whittier dmv and
                    Westminster DMV. From experience, the route for Westminster
                    was much easier than Whittier, but I just failed because I
                    suck. Whittier wasn't too difficult, but still slightly
                    harder than Westminster. <br />
                    <br />
                    However, the workers at Westminster are kinda mean and the
                    people at Whittier are much nicer. Lines were also much
                    shorter at Whittier for me, which was a plus.
                    <br />
                    <br />I would recommend Whittier to most, but if it's too
                    far away, you could try some closer dmvs (i only went there
                    since they had open appointments). However, i've heard
                    horror stories of the Santa Ana route/test, so I can't
                    recommend that. <br />
                    <br />
                    As for the actual driving portion, you should look on
                    Youtube for people showing up the route (just search "[dmv]
                    driver's test route"). In my opinion, the most important
                    thing you should know though is that whenever they mark down
                    on the clipboard, it means you did something correctly, not
                    that you made a mistake. This made me really nervous the
                    first time I took it, and I failed. Besides this, also make
                    sure to drive like your great great grandma and go really
                    slow (but not dangerously slow). Also avoid making right
                    turns on red unless the proctor tells you to. Honestly just
                    make the safest decision possible and you should be fine.
                    Good luck on your test!
                  </p>
                </div>
              </main>
            </div>
          </motion.div>
        )}
        <TopBar />
      </AnimatePresence>
    </div>
  );
};

export default DriversLicense;
