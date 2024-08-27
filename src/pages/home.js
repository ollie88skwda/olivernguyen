import { TopBar } from "./top_bar";
import "../Home.css";
export const Home = () => {
  return (
    <div class="home-page-content">
      <h1 class="home-title-text">
        OLIVER<br/>NGUYEN
      </h1>
      {/* <img
        src={Front_Page_Text}
        alt="OLIVER NGUYEN"
        height="1000px"
        class="home-title-text"
      /> */}
      <TopBar />
    </div>
  );
};
