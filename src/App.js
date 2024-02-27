import logo from "./assets/porsche.jpg";
import "./App.css";
const RenderH2 = ({ title }) => {
  return (
    <>
      <h2>{title}</h2>
    </>
  );
};
function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>olivernguyen.com</h1>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          bla bla bla hi hi hi
        </a>
        <RenderH2 title="Driving Logger" />
        <p>Date Start time End time Conditions Is night Notes</p>
        <input placeholder="Date" />
        <input placeholder="Start time" />
        <input placeholder="end time" />
        <select>
          <option>rainy</option>
          <option>rainy</option>
          <option>rainy</option>
          <option>rainy</option>
          <option>rainy</option>
        </select>
        <label>
          <input type="checkbox" />
          Is night
        </label>
        <textarea id="w3review" name="w3review" rows="4" cols="50"></textarea>

        <RenderH2 title="bla bla bla doesn't matter" />
      </header>
    </div>
  );
}

export default App;
