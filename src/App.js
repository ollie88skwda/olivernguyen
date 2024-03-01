import logo from "./assets/porsche.jpg";
import "./App.css";
import { DrivingLogger } from "./components/DrivingLogger";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1 class="hi">HI EVAN</h1>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          hi
        </a>

        <DrivingLogger title="Driving Logger" />
      </header>
      <h1 class="hi">HI EVAN</h1>
    </div>
  );
}

export default App;
