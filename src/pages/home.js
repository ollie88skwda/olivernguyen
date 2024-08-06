import { TopBar } from "./top_bar";
import "../Home.css";
import Front_Page_Text from "../assets/front_page_text.png";
export const Home = () => {
  return (
    <div class="home-page-content">
      <img
        src={Front_Page_Text}
        alt="OLIVER NGUYEN"
        height="1000px"
        class="home-title-text"
      />
      <h1>
        <a href="/driving">Learn to drive</a>
      </h1>
      <TopBar />
    </div>
  );
};
