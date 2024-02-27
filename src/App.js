import logo from "./assets/porsche.jpg";
import "./App.css";
import { DrivingLogger } from "./components/DrivingLogger";

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

        <DrivingLogger title="Driving Logger" />
      </header>
    </div>
  );
}

export default App;
